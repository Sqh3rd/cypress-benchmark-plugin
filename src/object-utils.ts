import { blockCharacters, formattingCharacters } from "./constants";
import {
  CommandQueue,
  Durations,
  ElementsInRange,
  FormattedTable,
  TableColumn,
  TableColumns,
  Timeable
} from "./interfaces";

export const getKeys = Object.keys as <T extends object>(obj: T) => Array<keyof T>;
export const toCommandQueue = (command: Cypress.CommandQueue) => {
  return {
    name: command.get("name"),
    args: command.get("args"),
    chainerId: command.get("chainerId"),
    useInvocationStack: command.get("useInvocationStack"),
    query: command.get("query"),
    id: command.get("id"),
    fn: command.get("fn"),
    privilegeVerification: command.get("privilegeVerfication"),
    prev: command.get("prev"),
    next: command.get("next")
  } as CommandQueue;
};
const getTextWithPrefixIfHasLength = (prefix: string, text: string, textToAppend: string, length?: number) => {
  let usedPrefix = prefix;
  if (text.length === length) {
    usedPrefix = "";
  }
  return usedPrefix + textToAppend;
};

const extendHeader = (header: string[], column: TableColumn) => {
  if (header.length === 0) {
    header.push(String.fromCharCode(0x250c));
    header.push("");
    header.push(String.fromCharCode(0x251c));
  }
  let remainder = column.width - column.name.length;
  let columnTest = ` ${" ".repeat(Math.floor(remainder / 2))}${column.name}${" ".repeat(Math.ceil(remainder / 2))} `;
  header[0] += getTextWithPrefixIfHasLength(String.fromCharCode(0x252c), header[0], formattingCharacters.HORIZONTAL_LINE.repeat(column.width + 2), 1);
  header[1] += getTextWithPrefixIfHasLength(formattingCharacters.VERTICAL_LINE, header[1], columnTest);
  header[2] += getTextWithPrefixIfHasLength(formattingCharacters.VERTICAL_HORIZONTAL_LINE, header[2], formattingCharacters.HORIZONTAL_LINE.repeat(column.width + 2), 1);
};
const closeHeader = (header: string[]) => {
  header[0] += String.fromCharCode(0x2510);
  header[1] += formattingCharacters.VERTICAL_LINE;
  header[2] += String.fromCharCode(0x2524);
};
export const formattedTable = (objs: Array<object>): FormattedTable => {
  if (objs.length == 0) return { lines: [], header: [], columns: {} };
  let columns: TableColumns = {};
  let lines: string[] = [];
  let header: string[] = [];
  let lastLine = "";
  objs.forEach((obj) => {
    for (const key in obj) {
      if (!(key in columns)) {
        columns[key] = { name: key, width: key.length, values: [] };
      }
      let value = String(obj[key]);
      columns[key].values.push(value);
      if (value.length > columns[key].width) {
        columns[key].width = value.length;
      }
    }
  });
  for (const column in columns) {
    extendHeader(header, columns[column]);
    const currentValues = columns[column].values;
    let startOfLastLine = String.fromCharCode(0x2534);
    if (lastLine.length == 0) {
      startOfLastLine = String.fromCharCode(0x2514);
    }
    lastLine += startOfLastLine + formattingCharacters.HORIZONTAL_LINE.repeat(columns[column].width + 2);
    for (let i = 0; i < currentValues.length; i++) {
      if (lines.length < i + 1) {
        lines.push("");
      }
      lines[i] += `${formattingCharacters.VERTICAL_LINE} ${currentValues[i]}${" ".repeat(columns[column].width - currentValues[i].length)} `;
    }
  }
  closeHeader(header);
  lastLine += String.fromCharCode(0x2518);
  for (let i = 0; i < lines.length; i++) {
    lines[i] += formattingCharacters.VERTICAL_LINE;
  }
  lines.push(lastLine);
  return { columns: columns, header: header, lines: lines };
};
export const formattedTimeableTable = <T extends Timeable>(
  timeables: Array<T>,
  durations: Durations
) => {
  let table = formattedTable(timeables);
  for (let i = 0; i < table.columns["duration"].values.length; i++) {
    let duration = parseInt(table.columns["duration"].values[i]);
    let col = "";
    if (duration < durations.ok) {
      continue;
    } else if (durations.ok <= duration && duration < durations.warn) {
      col = "\x1B[93m";
    } else if (durations.warn <= duration && duration < durations.critical) {
      col = "\x1B[33m";
    } else {
      col = "\x1B[31m";
    }
    table.lines[i] = `${col}${table.lines[i]}\x1B[m`;
  }
  return `${table.header.join("\n")}\n${table.lines.join("\n")}`;
};

const alignCenter = (value: string, maxCharacters: number, fillCharacter: string = " ", secondHalfFillCharacter?: string) => {
  secondHalfFillCharacter = secondHalfFillCharacter ?? fillCharacter;
  if (maxCharacters < value.length) {
    throw Error("maxCharacters have to be longer or equal ot the given value");
  }
  let remainder = maxCharacters - value.length;
  return fillCharacter.repeat(Math.floor(remainder / 2)) + value + secondHalfFillCharacter.repeat(Math.ceil(remainder / 2));
};

const createSections = (sections: number[], middleCharacter: string, fillCharacter: string, inbetweenFillCharacter: string, longestIndicator: number) => {
  let output: string[] = [];
  sections.forEach((_section, index) => {
    let inbetweenChar = _section > 0 ? inbetweenFillCharacter : fillCharacter; 
    if (index === 0) {
      output.push(alignCenter(middleCharacter, longestIndicator, fillCharacter, inbetweenChar));
    } else if (index === sections.length - 1) {
      output.push(alignCenter(middleCharacter, longestIndicator, inbetweenChar, fillCharacter));
    } else {
      output.push(alignCenter(middleCharacter, longestIndicator, inbetweenChar));
    }
  });
  return output;
}
export const barDiagram = <T extends Timeable>(timeables: Array<T>, durations: Durations) => {
  let barDiagramString = "";
  let block = String.fromCharCode(2588);
  let size = 20;
  let durationsAsArray: number[] = [];
  for (let key in durations) {
    durationsAsArray.push(durations[key]);
  }
  let entriesByDuration: ElementsInRange<T>[] = [];
  let timeableDuplicate = [...timeables];
  let max: number = 0;
  for (let i = 0; i < durationsAsArray.length; i++) {
    let filteredTimeables: T[];
    let start: number;
    let end: number = Infinity;
    if (i === 0) {
      filteredTimeables = timeableDuplicate.filter(timeable => timeable.duration <= durationsAsArray[i]);
      start = filteredTimeables.sort((t1, t2) => t2.duration - t1.duration).at(0)?.duration ?? -Infinity;
    } else {
      filteredTimeables = timeableDuplicate.filter(timeable => durationsAsArray[i - 1] < timeable.duration && timeable.duration <= durationsAsArray[i]);
    }
    entriesByDuration.push({ start: start, end: end, amount: filteredTimeables.length, elements: filteredTimeables });
    timeableDuplicate = timeableDuplicate.filter(item => filteredTimeables.indexOf(item) < 0);
    if (filteredTimeables.length > max) {
      max = filteredTimeables.length;
    }
  }
  let timeableDuplicateSortedByDuration = [...timeables].sort((t1, t2) => t1.duration - t2.duration); 
  let shortestTimeable = timeableDuplicateSortedByDuration.at(-1)?.duration; 
  let end = timeableDuplicateSortedByDuration.at(0)?.duration ?? undefined;
  let start =  shortestTimeable < durationsAsArray.at(0) ? shortestTimeable : undefined;
  if (start)
    durationsAsArray.push(start);
  durationsAsArray.sort((d1, d2) => d1 - d2);
  entriesByDuration.push({
    start: durationsAsArray.at(-1)!,
    end: end,
    amount: timeableDuplicate.length,
    elements: timeableDuplicate
  });
  if (timeableDuplicate.length > max) {
    max = timeableDuplicate.length;
  }
  let maxAsE = max.toExponential(2).toLowerCase().split("e").map(part => Number(part));
  let maxDisplay = Math.ceil(maxAsE[0]) * 10 ** maxAsE[1];
  let steps = maxDisplay / (size / 2);
  let stepPaddingAmount = String(maxDisplay).length + 2;
  let stepPadding = " ".repeat(stepPaddingAmount);
  let longestIndicator = durationsAsArray.map(duration => String(duration)).sort((s1, s2) => s2.length - s1.length).at(0).length;
  let footer: string[] = [];
  let sections = entriesByDuration.sort((e1, e2) => e2.start - e1.start).map(e => e.amount);
  footer.push(stepPadding + formattingCharacters.VERTICAL_LINE);
  footer.push(" ".repeat(stepPaddingAmount - 2) + "0 " + formattingCharacters.INVERTED_T);
  footer.push(stepPadding + " ");
  footer[1] += createSections(sections, formattingCharacters.VERTICAL_HORIZONTAL_LINE, formattingCharacters.HORIZONTAL_LINE, blockCharacters.UPPER_HALF, longestIndicator).join(blockCharacters.UPPER_HALF);
  footer[2] += durationsAsArray.map(duration => alignCenter(String(duration), longestIndicator, " ")).join(" ");
  footer[0] += createSections(sections, " ", " ", blockCharacters.FULL, longestIndicator).join(blockCharacters.FULL);
  barDiagramString = footer.join("\n");
  return barDiagramString;
};
