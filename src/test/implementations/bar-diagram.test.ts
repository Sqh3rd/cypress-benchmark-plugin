import { DurationBoundaries } from "../../main/interfaces";
import { barDiagram } from "../../main/implementations/bar-diagram";

describe("bar-diagram", () => {
  let max = 1_000;
  let durations: DurationBoundaries = {ok: 100, warn: 500, critical: 1000};
  let entries = [...Array(max).keys()].map(_i => {
    return { name: "test", duration: Math.ceil(Math.random() * 1500)};
  });
  let barDiagramString = barDiagram(entries, durations);

  test("print bar-diagram", () => {
    console.log(barDiagramString);
  });
});