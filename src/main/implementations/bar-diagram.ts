import { DurationBoundaries, Timeable } from "../interfaces";
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

const generateEntries = <T extends Timeable>(durationsAsArray: number[], timeables: T[]) => {
  let entriesByDuration: ElementsInRange<T>[] = [];
  let maxAmount = 0;
  let timeableDuplicate = [...timeables];
  let durationCopy = [...durationsAsArray];
  for (let i = 0; i <= durationCopy.length; i++) {
    let start: number;
    let end: number;
    if (i === 0) {
      end = durationCopy[i];
      start = timeableDuplicate.filter(timeable => timeable.duration <= end)
        .sort((t1, t2) => t2.duration - t1.duration).at(0)?.duration ?? -Infinity;
      durationsAsArray.push(start);
    } else {
      start = durationCopy[i - 1];
      if (i === durationCopy.length) {
        end = timeableDuplicate.filter(timeable => timeable.duration >= start)
          .sort((t1, t2) => t1.duration - t2.duration).at(0)?.duration ?? Infinity;
        durationsAsArray.push(end);
      } else
        end = durationCopy[i];
    }
    let filteredTimeables = timeableDuplicate.filter(timeable => timeable.duration <= end && timeable.duration >= start);
    entriesByDuration.push({
      start: start,
      end: end,
      amount: filteredTimeables.length,
      elements: [...filteredTimeables]
    });
    timeableDuplicate = timeableDuplicate.filter(item => filteredTimeables.indexOf(item) < 0);
    maxAmount = Math.max(maxAmount, filteredTimeables.length);
  }
  return { maxAmount: maxAmount, entries: entriesByDuration };
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
  limiterChar: string
) => {
  return sections.map(section => {
    if (section === currentStep)
      return blockCharacters.LOWER_HALF.repeat(longestIndicator);
    else if (section > currentStep)
      return blockCharacters.FULL.repeat(longestIndicator);
    else if (section < previousStep)
      return limiterChar.repeat(longestIndicator);
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
  maxDisplay: number,
  stepPadding: string,
  stepPaddingAmount: number,
  longestIndicator: number,
  sections: number[]
) => {
  let bars: string[] = [];
  let previousStep = 0;
  for (let i = 0; i < height; i++) {
    let currentStep = maxDisplay / (height / 2) * (i + 1) / 2;
    let limiterChar = " ";
    let currentBar = "";
    if (i % 2 === 0) {
      currentBar = stepPadding + formattingCharacters.VERTICAL_LINE;
    } else {
      currentBar = " " + currentStep + " ".repeat(stepPaddingAmount - String(currentStep).length - 1) + formattingCharacters.VERTICAL_LINE;
      limiterChar = formattingCharacters.HORIZONTAL_LINE;
    }
    currentBar += generateBarPrefix(limiterChar, longestIndicator);
    currentBar += generateBarSection(sections, currentStep, longestIndicator, previousStep, limiterChar);
    currentBar += generateBarSuffix(limiterChar, longestIndicator);
    console.log(`noReplaced: ${currentBar}\nisReplaced: ${replaceIfSurroundedBy(currentBar, " ", formattingCharacters.HORIZONTAL_LINE, formattingCharacters.HORIZONTAL_LINE)}`);
    bars.push(replaceIfSurroundedBy(currentBar, " ", formattingCharacters.HORIZONTAL_LINE, formattingCharacters.HORIZONTAL_LINE));
    previousStep = currentStep;
  }
  return bars;
};

const generateHeaderBar = (stepPaddingAmount: number, sections: number[], maxDisplay: number, longestIndicator: number) => {
  let header = "";
  header += " ".repeat(stepPaddingAmount + 1);
  header += generateBarPrefix(" ", longestIndicator);
  header += sections.map(section => {
    if (section !== maxDisplay)
      return " ".repeat(longestIndicator);
    return alignCenter(String(section), longestIndicator);
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
  let bars = generateBodyBar(height, maxDisplay, stepPadding, stepPaddingAmount, longestIndicator, sections);
  bars.push(generateHeaderBar(stepPaddingAmount, sections, maxDisplay, longestIndicator));
  return bars;
};

export const barDiagram = <T extends Timeable>(inputs: Array<T>, durations: DurationBoundaries, height: number = 10) => {
  let filteredInputs = inputs.filter(input => input != null);
  if (filteredInputs.length === 0) throw Error("Can't draw a bar diagram from empty array");
  let durationsAsArray: number[] = [];
  for (let key in durations) {
    durationsAsArray.push(durations[key]);
  }
  let entries = generateEntries(durationsAsArray, filteredInputs);
  durationsAsArray = durationsAsArray.sort((d1, d2) => d1 - d2);
  let maxAsE = entries.maxAmount.toExponential(1).toLowerCase().split("e").map(part => Number(part));
  let maxDisplay = Math.ceil(maxAsE[0]) * 10 ** maxAsE[1];
  let stepPaddingAmount = String(maxDisplay).length + 2;
  let stepPadding = " ".repeat(stepPaddingAmount);
  let longestDuration = getLongestStringFromArray(durationsAsArray).length;
  let longestSection = getLongestStringFromArray(entries.entries.map(entry => entry.amount)).length;
  let longestIndicator = Math.max(longestDuration, longestSection);
  let sections = entries.entries.sort((e1, e2) => e1.start - e2.start).map(e => e.amount);
  let footer = generateFooter(stepPaddingAmount, stepPadding, sections, durationsAsArray, longestIndicator);
  let bars = generateBars(height, maxDisplay, stepPadding, stepPaddingAmount, longestIndicator, sections);

  return `${bars.reverse().join("\n")}\n${footer.join("\n")}`;
};