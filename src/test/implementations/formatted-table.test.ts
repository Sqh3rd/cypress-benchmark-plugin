import { describe, expect, test } from "@jest/globals";
import { toFormattedTable } from "../../main/implementations/formatted-table";

describe("formatted table", () => {
  let testArray = [
    { name: "asdf", value: 1 },
    { name: "something else indeed", value: 100 },
  ];
  let table = toFormattedTable(testArray);
  test("print formatted String", () => {
    console.log(table.toFormattedString());
  });
  test("non-visual stuff", () => {
    expect(table.columns).toStrictEqual({
      name: {
        name: "name",
        width: 21,
        values: ["asdf", "something else indeed"],
      },
      value: { name: "value", width: 5, values: ["1", "100"] },
    });
    expect(table.headers.length).toBe(3);
    expect(table.lines.length).toBe(3);
    expect(table.headers[1]).toContain("name");
    expect(table.headers[1]).toContain("value");
  });
  test("visual stuff", () => {
    expect(table.headers[0]).toBe("┌───────────────────────┬───────┐");
    expect(table.headers[1]).toBe("│         name          │ value │");
    expect(table.headers[2]).toBe("├───────────────────────┼───────┤");

    expect(table.lines[0]).toBe("│ asdf                  │ 1     │");
    expect(table.lines[1]).toBe("│ something else indeed │ 100   │");
    expect(table.lines[2]).toBe("└───────────────────────┴───────┘");
  });
});
