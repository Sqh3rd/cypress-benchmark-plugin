import {
  barDiagramWithRanges,
  barDiagramWithSections,
  generateEntriesByRangesFromInput,
  generateEntriesBySectionsFromInput,
} from "../../main/implementations/bar-diagram";

describe("bar-diagram", () => {
  let max = 100_000;

  test("print range bar-diagram", () => {
    let entries = [...Array(max).keys()].map((i) => {
      if (i % 5 === 0) return 100;
      return 500;
    });
    console.log(
      barDiagramWithRanges(
        generateEntriesByRangesFromInput(entries, [250, 500, 750]),
        10,
      ),
    );
  });

  test("print section bar-diagram", () => {
    let entries = [...Array(max).keys()].map((i) => {
      if (i % 5 === 0) return "VW";
      else if (i % 3 === 0) return "MERCEDES";
      else return "BMW";
    });
    console.log(
      barDiagramWithSections(generateEntriesBySectionsFromInput(entries), 10),
    );
  });
});
