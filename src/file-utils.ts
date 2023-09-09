import { Timeable } from "./interfaces";
import { writeFileSync } from "fs";
import { getKeys } from "./object-utils";

export const saveAsCsv = <T extends Timeable>(timeables: Array<T>, file: string) => {
  console.log(JSON.stringify(timeables));
  let columns = getKeys<T>(timeables[0]);
  let columnsString = columns.join("|");
  let valueString = timeables.map(timeable => {
    let returnString = "";
    for (let key in columns) {
      let columnValueAsString = "";
      if (timeable[key]) {
        columnValueAsString = timeable[key].toString().replace("|", ",");
      }
      if (returnString.length == 0) {
        returnString += columnValueAsString;
      } else {
        returnString += `|${columnValueAsString}`;
      }
    }
    return returnString;
  }).join("\n");
  writeFileSync(file, `${columnsString}\n${valueString}`, { flag: "w" });
};
