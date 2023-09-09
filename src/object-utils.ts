import { CommandQueue, FormattedTable, TableColumn, TableColumns, Timeable } from "./interfaces";

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
const extendHeader = (header: string[], column: TableColumn, horizontalLine: string, verticalLine: string, verticalHorizontalLine: string) => {
  if (header.length === 0) {
    header.push(String.fromCharCode(0x250c));
    header.push("");
    header.push(String.fromCharCode(0x251c));
  }
  let startOfHeader = String.fromCharCode(0x252c);
  if (header[0].length == 1) {
    startOfHeader = "";
  }
  header[0] += startOfHeader + horizontalLine.repeat(column.width + 2);
  let startOfLine = verticalHorizontalLine;
  if (header[2].length == 1) {
    startOfLine = "";
  }
  header[2] += startOfLine + horizontalLine.repeat(column.width + 2);
  let remainder = column.width - column.name.length;
  header[1] += `${verticalLine} ${" ".repeat(Math.floor(remainder / 2))}${column.name}${" ".repeat(
    Math.ceil(remainder / 2)
  )} `;
};
const closeHeader = (header: string[], verticalLine: string) => {
  header[0] += String.fromCharCode(0x2510);
  header[1] += verticalLine;
  header[2] += String.fromCharCode(0x2524);
}
export const formattedTable = (objs: Array<object>): FormattedTable => {
  if (objs.length == 0) return { lines: [], header: [], columns: {} };
  let columns: TableColumns = {};
  let lines: string[] = [];
  let header: string[] = [];
  let verticalLine = String.fromCharCode(0x2502);
  let verticalHorizontalLine = String.fromCharCode(0x253c);
  let horizontalLine = String.fromCharCode(0x2500);
  let lastLine = "";
  objs.forEach((timeable) => {
    for (const key in timeable) {
      if (!(key in columns)) {
        columns[key] = { name: key, width: key.length, values: [] };
      }
      let value = timeable[key].toString();
      columns[key].values.push(value);
      if (value.length > columns[key].width) {
        columns[key].width = value.length;
      }
    }
  });
  for (const column in columns) {
    extendHeader(header, columns[column], horizontalLine, verticalLine, verticalHorizontalLine);
    const currentValues = columns[column].values;
    let startOfLastLine = String.fromCharCode(0x2534);
    if (lastLine.length == 0) {
      startOfLastLine = String.fromCharCode(0x2514);
    }
    lastLine += startOfLastLine + horizontalLine.repeat(columns[column].width + 2);
    for (let i = 0; i < currentValues.length; i++) {
      let j = i + 3;
      if (lines.length < j + 1) {
        lines.push("");
      }
      lines[j] += `${verticalLine} ${currentValues[i]}${" ".repeat(columns[column].width - currentValues[i].length)} `;
    }
  }
  closeHeader(header, verticalLine);
  lastLine += String.fromCharCode(0x2518);
  for (let i = 3; i < lines.length; i++) {
    lines[i] += verticalLine;
  }
  lines.push(lastLine);
  return { columns: columns, header: header, lines: lines };
};
export const formattedTimeableTable = <T extends Timeable>(
  timeables: Array<T>,
  _okDuration: number,
  _slowDuration: number,
  _tooSlowDuration: number
) => {
  let table = formattedTable(timeables);
  for (let i = 0; i < table.columns["duration"].values.length; i++) {
    let duration = parseInt(table.columns["duration"].values[i]);
    let col = "";
    if (duration < _okDuration) {
      continue;
    } else if (_okDuration <= duration && duration < _slowDuration) {
      col = "\x1B[93m";
    } else if (_slowDuration <= duration && duration < _tooSlowDuration) {
      col = "\x1B[33m";
    } else {
      col = "\x1B[31m";
    }
    table.lines[i + 3] = `${col}${table.lines[i + 3]}\x1B[m`;
  }
  return table.lines.join("\n");
};
