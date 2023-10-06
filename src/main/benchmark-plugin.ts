/// <reference types="cypress" />
import { DateTime } from "luxon";
import { BenchmarkCommand, DurationBoundaries, LoggableTest, Test } from "./interfaces";
import { saveAsCsv } from "./file-utils";
import { barDiagram, formattedTimeableTable, toCommandQueue } from "./object-utils";
import CypressRunResult = CypressCommandLine.CypressRunResult;
import CypressFailedRunResult = CypressCommandLine.CypressFailedRunResult;

export class BenchmarkPlugin {
  static getStartupString = (config: Cypress.PluginConfigOptions) => getStartupString(config);
  static benchmarkEvents = (on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions, fileLocation: string) =>
    benchmarkEvents(on, config, fileLocation);
  static benchmarkComponentTestSetup = () => benchmarkComponentTestSetup();
}

let resultCommands: BenchmarkCommand[][] = [];
let lastTestId = 0;
const getStartupString = (config: Cypress.PluginConfigOptions) => {
  return config.env["benchmark"] !== true ? "" : "Running with benchmarking enabled";
};
const benchmarkEvents = (on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions, fileLocation: string) => {
  if (config.env["benchmark"] !== true) return;
  on("task", {
    stats(commands: BenchmarkCommand[]) {
      resultCommands.push(commands.map(command => ({ ...command, testId: lastTestId })));
      lastTestId++;
      return null;
    }
  });
  on("after:run", (result) => {
    if ("status" in result && result.status === "failed") {
      handleFailure(<CypressFailedRunResult>result);
    } else {
      handleSuccess(<CypressRunResult>result, fileLocation);
    }
  });
};
const getTimeDifferenceFromISO = (time1: string, time2: string) => {
  return DateTime.fromISO(time1).toMillis() - DateTime.fromISO(time2).toMillis();
};
const handleFailure = (_result: CypressFailedRunResult) => {
};
const handleSuccess = (result: CypressRunResult, fileLocation: string) => {
  let totalBreakTime = 0;
  let totalRunTime = 0;
  for (let i = 0; i < result.runs.length; i++) {
    totalRunTime += getTimeDifferenceFromISO(result.runs[i].stats.endedAt, result.runs[i].stats.startedAt);
    if (i < result.runs.length - 1)
      totalBreakTime += getTimeDifferenceFromISO(result.runs[i + 1].stats.startedAt, result.runs[i].stats.endedAt);
  }
  let tests = result.runs.map((run) => run.tests);
  let loggableTests = tests.flat().map(
    (test, index) =>
      ({
        state: test.state,
        duration: test.duration,
        spec: test.title.at(0)!,
        name: test.title.at(1)!,
        testId: index
      } as LoggableTest)
  );
  let filePath = `${fileLocation}/tmp/${DateTime.now().toISODate()}`;
  let numberOfTestsShown = 50;
  if (loggableTests.length < numberOfTestsShown) {
    numberOfTestsShown = loggableTests.length;
  }
  loggableTests.sort((test1, test2) => test2.duration - test1.duration);
  let durations = { ok: 250, warn: 500, critical: 1000} as DurationBoundaries;
  let formattedTable = formattedTimeableTable(loggableTests.slice(0, numberOfTestsShown), durations);
  let commands = resultCommands.flatMap((commands, index) => {
    commands.forEach(command => command.testId = index);
    return commands;
  });
  saveAsCsv(loggableTests, `${filePath}/tests.csv`);
  saveAsCsv(commands, `${filePath}/commands.csv`);
  console.log(`Total break time ${totalBreakTime / 1000}s`);
  console.log(`Total run time ${totalRunTime / 1000}s`);
  console.log(`Relative break time ${totalBreakTime / totalRunTime}`);
  console.log(`Slowest ${numberOfTestsShown}\n${formattedTable}`);
  console.log(`Bar\n${barDiagram(loggableTests, {ok: 250, warn: 500, critical: 1000})}`)
};

const benchmarkComponentTestSetup = () => {
  if (Cypress.env("benchmark") !== true) return;

  let commandId = 0;
  let currentTestTitle = "";
  let commands: BenchmarkCommand[] = [];
  let lastCommand: BenchmarkCommand;
  Cypress.on("test:before:run:async", (test: Test) => {
    commandId = 0;
    currentTestTitle = test.title;
  });

  Cypress.on("command:start", (cc) => {
    let c = toCommandQueue(cc);
    if (c.name === "task") return;
    commands.push({
      id: commandId,
      testName: currentTestTitle,
      testId: 0,
      name: c.name,
      startTimestamp: +new Date(),
      args: c.args,
      endTimestamp: -1,
      duration: -1
    });
    commandId++;
    lastCommand = commands.at(-1)!;
    if (typeof lastCommand.args === "object") {
      let arg: any[] = [];
      for (let key in lastCommand.args) {
        if (typeof lastCommand.args[key] === "object") {
          arg.push("object");
          continue;
        }
        arg.push(lastCommand.args[key]);
      }
      lastCommand.args = arg;
    }
  });

  Cypress.on("command:end", (cc) => {
    let c = toCommandQueue(cc);
    if (c.name === "task") return;
    if (commands.length < 1) throw new Error(`Something went seriously fucking wrong with ${c.name}`);
    lastCommand.endTimestamp = +new Date();
    lastCommand.duration = lastCommand.endTimestamp - lastCommand.startTimestamp;
  });

  const sendStats = () => {
    if (lastCommand !== undefined && lastCommand.endTimestamp === -1) {
      lastCommand.endTimestamp = +new Date();
      lastCommand.duration = lastCommand.endTimestamp - lastCommand.startTimestamp;
    }
    commandId = 0;
    cy.task("stats", commands);
  };

  afterEach(sendStats);
};

//      on("before:run", () => {
//        let startupStrings: string[] = [];
//        startupStrings.push(BenchmarkPlugin.getStartupString(config));
//        startupStrings = startupStrings.filter(Boolean);
//        let startupString =
//          startupStrings.length >= 1 && startupStrings.some((value) => value !== "")
//            ? startupStrings.join("\n")
//            : "No additional startup messages";
//        console.log(`env: ${JSON.stringify(config.env)}\n${startupString}`);
//      });
//      BenchmarkPlugin.benchmarkEvents(on, config);
