import { formattingCharacters } from "../constants";

export interface TableColumn {
  name: string;
  width: number;
  values: any[];
}

export interface TableColumns {
  [key: string]: TableColumn;
}

export class FormattedTable {
  columns: TableColumns;
  headers: string[];
  lines: string[];

  constructor(columns: TableColumns, headers: string[], lines: string[]) {
    this.columns = columns;
    this.headers = headers;
    this.lines = lines;
  }

  toFormattedString() {
    return `${this.headers.join("\n")}\n${this.lines.join("\n")}`;
  }
}

const getTextWithPrefixIfHasLength = (
  prefix: string,
  text: string,
  textToAppend: string,
  length?: number,
) => {
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
  let columnTest = ` ${" ".repeat(Math.floor(remainder / 2))}${
    column.name
  }${" ".repeat(Math.ceil(remainder / 2))} `;
  header[0] += getTextWithPrefixIfHasLength(
    String.fromCharCode(0x252c),
    header[0],
    formattingCharacters.HORIZONTAL_LINE.repeat(column.width + 2),
    1,
  );
  header[1] += getTextWithPrefixIfHasLength(
    formattingCharacters.VERTICAL_LINE,
    header[1],
    columnTest,
  );
  header[2] += getTextWithPrefixIfHasLength(
    formattingCharacters.VERTICAL_HORIZONTAL_LINE,
    header[2],
    formattingCharacters.HORIZONTAL_LINE.repeat(column.width + 2),
    1,
  );
};

const closeHeader = (header: string[]) => {
  header[0] += String.fromCharCode(0x2510);
  header[1] += formattingCharacters.VERTICAL_LINE;
  header[2] += String.fromCharCode(0x2524);
};

export const toFormattedTable = (objs: Array<object>): FormattedTable => {
  if (objs.length == 0) return new FormattedTable({}, [], []);
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
    lastLine +=
      startOfLastLine +
      formattingCharacters.HORIZONTAL_LINE.repeat(columns[column].width + 2);
    for (let i = 0; i < currentValues.length; i++) {
      if (lines.length < i + 1) {
        lines.push("");
      }
      lines[i] += `${formattingCharacters.VERTICAL_LINE} ${
        currentValues[i]
      }${" ".repeat(columns[column].width - currentValues[i].length)} `;
    }
  }
  closeHeader(header);
  lastLine += String.fromCharCode(0x2518);
  for (let i = 0; i < lines.length; i++) {
    lines[i] += formattingCharacters.VERTICAL_LINE;
  }
  lines.push(lastLine);
  return new FormattedTable(columns, header, lines);
};
