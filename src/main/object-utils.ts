import { toFormattedTable } from "./implementations/formatted-table";
import {
  CommandQueue, DurationBoundaries,
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

export const formattedTimeableTable = <T extends Timeable>(
  timeables: Array<T>,
  durations: DurationBoundaries
) => {
  let table = toFormattedTable(timeables);
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
  return table.toString();
};

export class ObjectUtils {
  static toFormattedTable = (objs: Array<object>) => toFormattedTable(objs);
}