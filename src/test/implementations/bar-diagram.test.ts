import { Measurable } from "../../main/interfaces";
import { barDiagram } from "../../main/implementations/bar-diagram";

describe("bar-diagram", () => {
  let max = 100_000;
  let e1: Measurable = { value: 100};
  let e2: Measurable = { value: 500};
  let entries = [...Array(max).keys()].map(i => {
    if (i % 5 === 0) return e2;
    return e1;
  });
  let barDiagramString = barDiagram(entries, [250, 500, 750], 10);

  test("print bar-diagram", () => {
    console.log(barDiagramString);
  });
});