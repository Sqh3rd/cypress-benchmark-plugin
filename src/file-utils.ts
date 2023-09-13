import { Timeable } from "./interfaces";
import { writeFileSync } from "fs";

export const saveAsCsv = <T extends Timeable>(timeables: Array<T>, file: string) => {
  let columns: string[] = [];
  let valueString = timeables.map(timeable => {
    let returnString = "";
    for (let key in timeable) {
      if (!columns.includes(key.toString())) {
        columns.push(key.toString());
      }
      if (returnString.length >= 1) {
        returnString += "|";
      }
      returnString += `${timeable[key]}`;
    }
    return returnString;
  }).join("\n");
  let columnsString = columns.join("|");
  writeFileSync(file, `${columnsString}\n${valueString}`, { flag: "w" });
};
