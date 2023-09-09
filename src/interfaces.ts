export interface Timeable {
  name: string;
  duration: number;

  [key: string]: { toString(): string };
}

export interface BenchmarkCommand extends Timeable {
  id: number;
  startTimestamp: number;
  endTimestamp: number;
  duration: number;
  args: any;
  testId: string;
}

export interface LoggableTest extends Timeable {
  state: string;
  spec: string;
}

export interface TestConfig {
  testConfigList: Cypress.ObjectLike[];
  unverifiedTestConfig: Cypress.ObjectLike;
  applied: string;
}

export interface InvocationDetails {
  function: string;
  fileUrl: string;
  originalFile: string;
  relativeFile?: any;
  absoluteFile?: any;
  line: number;
  column: number;
  whitespace: string;
  stack: string;
}

export interface Test extends Cypress.ObjectLike {
  _testConfig: TestConfig;
  id: string;
  order: number;
  title: string;
  pending: boolean;
  body: string;
  type: string;
  wallClockStartedAt: string;
  file: any;
  invocationDetails: InvocationDetails;
  currentRetry: number;
  retries: number;
  _slow: number;
}

export interface CommandQueue extends Cypress.CommandQueue {
  name: string;
  args: any;
  chainerId: string;
  useInvocationStack: string;
  query: boolean;
  id: string;
  fn: Function;
  privilegeVerification: any[];
  prev: CommandQueue;
  next: CommandQueue;

  logs(filter: any): any[];
}
export interface TableColumn {
  name: string;
  width: number;
  values: any[];
}
export interface TableColumns {
  [key: string]: TableColumn;
}
export interface FormattedTable {
  columns: TableColumns;
  header: string[];
  lines: string[];
}