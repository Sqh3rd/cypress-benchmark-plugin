import { Measurable } from "../interfaces";
import { blockCharacters, formattingCharacters } from "../constants";

export interface ElementsInRange<T> {
  start: number;
  end: number;
  amount: number;
  elements: T[];
}

const alignCenter = (value: string, maxCharacters: number, fillCharacter: string = " ", secondHalfFillCharacter?: string) => {
  secondHalfFillCharacter = secondHalfFillCharacter ?? fillCharacter;
  if (maxCharacters < value.length) {
    throw Error(`maxCharacters (${maxCharacters}) has to be bigger or equal ot the given values length "${value}" (${value.length})`);
  }
  let remainder = maxCharacters - value.length;
  return fillCharacter.repeat(Math.floor(remainder / 2)) + value + secondHalfFillCharacter.repeat(Math.ceil(remainder / 2));
};

const getLongestStringFromArray = (array: any[]) => {
  return array.map(element => String(element)).sort((e1, e2) => e2.length - e1.length)[0];
};

const generateEntries = <T extends Measurable>(durationsAsArray: number[], measurables: T[]) => {
  let entriesByDuration: ElementsInRange<T>[] = [];
  let maxAmount = 0;
  let measurablesDuplicate = [...measurables];
  let durations = [...durationsAsArray];
  let durationCopy = [...durationsAsArray];
  for (let i = 0; i <= durationCopy.length; i++) {
    let start: number;
    let end: number;
    if (i === 0) {
      end = durationCopy[i];
      start = measurablesDuplicate.filter(measurable => measurable.value < end)
        .sort((t1, t2) => t1.value - t2.value).at(0)?.value ?? -Infinity;
      durations.push(start);
    } else {
      start = durationCopy[i - 1];
      if (i === durationCopy.length) {
        end = measurablesDuplicate.filter(measurable => measurable.value >= start)
          .sort((t1, t2) => t2.value - t1.value).at(0)?.value ?? Infinity;
        if (end === Infinity) continue;
        durations.push(end);
      } else
        end = durationCopy[i];
    }
    let filteredMeasurables = measurablesDuplicate.filter(measurable => measurable.value <= end && measurable.value >= start);
    entriesByDuration.push({
      start: start,
      end: end,
      amount: filteredMeasurables.length,
      elements: [...filteredMeasurables]
    });
    measurablesDuplicate = measurablesDuplicate.filter(item => filteredMeasurables.indexOf(item) < 0);
    maxAmount = Math.max(maxAmount, filteredMeasurables.length);
  }
  return { maxAmount: maxAmount, durations: durations, entries: entriesByDuration };
};

const generateSection = (section: number, index: number, length: number, longestIndicator: number) => {
  let midCharacter = blockCharacters.UPPER_HALF;
  let start = "";
  let end = "";
  if (section === 0)
    midCharacter = formattingCharacters.HORIZONTAL_LINE;
  if (index === 0)
    start = formattingCharacters.HORIZONTAL_LINE.repeat(Math.floor(longestIndicator / 2));
  else if (index === length - 1)
    end = formattingCharacters.VERTICAL_HORIZONTAL_LINE + formattingCharacters.HORIZONTAL_LINE.repeat(Math.ceil(longestIndicator / 2));
  let mid = midCharacter.repeat(longestIndicator);
  return `${start}${formattingCharacters.VERTICAL_HORIZONTAL_LINE}${mid}${end}`;
};

const generateFooter = (
  stepPaddingAmount: number,
  stepPadding: string,
  sections: number[],
  durationsAsArray: number[],
  longestIndicator: number
) => {
  let footer: string[] = [];
  footer.push(" ".repeat(stepPaddingAmount - 2) + "0 " + formattingCharacters.INVERTED_T);
  footer.push(stepPadding + " ");
  footer[0] += sections.map((section, index) => generateSection(section, index, sections.length, longestIndicator)).join("");
  footer[1] += durationsAsArray.map(d => alignCenter(String(d), longestIndicator)).join(" ");
  return footer;
};

const generateBarPrefix = (limiterChar: string, longestIndicator: number) => {
  return limiterChar.repeat(Math.floor(longestIndicator / 2)) + " ";
};

const generateBarSuffix = (limiterChar: string, longestIndicator: number) => {
  return " " + limiterChar.repeat(Math.ceil(longestIndicator / 2));
};

const generateBarSection = (
  sections: number[],
  currentStep: number,
  longestIndicator: number,
  previousStep: number,
  limiterChar: string,
  stepSize: number
) => {
  return sections.map(section => {
    if (section < previousStep)
      return limiterChar.repeat(longestIndicator);
    else if (section > currentStep)
      return blockCharacters.FULL.repeat(longestIndicator);
    else if (section >= previousStep + (stepSize / 2))
      return blockCharacters.LOWER_HALF.repeat(longestIndicator);
    return alignCenter(String(section), longestIndicator);
  }).join(" ");
}

const replaceIfSurroundedBy = (s: string, toReplace: string, replaceBy: string, surroundingChar: string) => {
  let returnString = "";
  let indices = [-(surroundingChar.length + toReplace.length)];
  let currentIndex = -1;
  do {
    currentIndex = s.indexOf(`${surroundingChar}${toReplace}${surroundingChar}`, currentIndex + 1);
    indices.push(currentIndex);
  } while (currentIndex > -1);
  indices = indices.filter(i => i !== -1).sort((i1, i2) => i1 - i2);
  for (let i = 1; i < indices.length; i++)
  {
    returnString += s.slice(indices[i-1] + surroundingChar.length + toReplace.length, indices[i] + surroundingChar.length);
    returnString += replaceBy;
  }
  returnString += s.slice(indices[indices.length - 1] + surroundingChar.length + toReplace.length);
  return returnString;
};

const generateBodyBar = (
  height: number,
  stepSize: number,
  stepPadding: string,
  stepPaddingAmount: number,
  longestIndicator: number,
  sections: number[]
) => {
  let bars: string[] = [];
  let previousStep = 0;
  for (let i = 0; i < height; i++) {
    let currentStep = Math.floor(stepSize * (i + 1));
    let limiterChar = " ";
    let currentBar = "";
    if (i % 2 === 0) {
      currentBar = stepPadding + formattingCharacters.VERTICAL_LINE;
    } else {
      currentBar = " ".repeat(stepPaddingAmount - String(currentStep).length - 1) + currentStep + " " + formattingCharacters.VERTICAL_LINE;
      limiterChar = formattingCharacters.HORIZONTAL_LINE;
    }
    currentBar += generateBarPrefix(limiterChar, longestIndicator);
    currentBar += generateBarSection(sections, currentStep, longestIndicator, previousStep, limiterChar, stepSize);
    currentBar += generateBarSuffix(limiterChar, longestIndicator);
    bars.push(replaceIfSurroundedBy(currentBar, " ", formattingCharacters.HORIZONTAL_LINE, formattingCharacters.HORIZONTAL_LINE));
    previousStep = currentStep;
  }
  return bars;
};

const generateHeaderBar = (stepPaddingAmount: number, sections: number[], maxDisplay: number, stepSize: number, longestIndicator: number) => {
  let header = "";
  header += " ".repeat(stepPaddingAmount + 1);
  header += generateBarPrefix(" ", longestIndicator);
  header += sections.map(section => {
    if (section >= maxDisplay - stepSize)
      return alignCenter(String(section), longestIndicator);
    return " ".repeat(longestIndicator);
  }).join(" ");
  return header;
};

const generateBars = (
  height: number,
  maxDisplay: number,
  stepPadding: string,
  stepPaddingAmount: number,
  longestIndicator: number,
  sections: number[]
) => {
  let stepSize = maxDisplay / (height / 2) / 2;
  let bars = generateBodyBar(height, stepSize, stepPadding, stepPaddingAmount, longestIndicator, sections);
  bars.push(generateHeaderBar(stepPaddingAmount, sections, maxDisplay, stepSize, longestIndicator));
  return bars;
};

export const barDiagram = <T extends Measurable>(inputs: Array<T>, durations: number[], height: number = 10) => {
  let filteredInputs = inputs.filter(input => input != null);
  if (filteredInputs.length === 0) throw Error("Can't draw a bar diagram from empty array");
  let durationCopy = [...durations];
  let entries = generateEntries(durationCopy, filteredInputs);
  durationCopy = entries.durations.sort((d1, d2) => d1 - d2);
  let maxAsE = entries.maxAmount.toExponential(1).toLowerCase().split("e").map(part => Number(part));
  let maxDisplay = Math.floor(maxAsE[0] * 10 + 1) * 10 ** (maxAsE[1] - 1);
  let stepPaddingAmount = String(maxDisplay).length + 2;
  let stepPadding = " ".repeat(stepPaddingAmount);
  let longestDuration = getLongestStringFromArray(durationCopy).length;
  let longestSection = getLongestStringFromArray(entries.entries.map(entry => entry.amount)).length;
  let longestIndicator = Math.max(longestDuration, longestSection);
  let sections = entries.entries.sort((e1, e2) => e1.start - e2.start).map(e => e.amount);
  let footer = generateFooter(stepPaddingAmount, stepPadding, sections, durationCopy, longestIndicator);
  let bars = generateBars(height, maxDisplay, stepPadding, stepPaddingAmount, longestIndicator, sections);

  return `${bars.reverse().join("\n")}\n${footer.join("\n")}`;
};