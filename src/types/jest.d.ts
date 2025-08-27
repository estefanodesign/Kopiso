// Jest global types for TypeScript compilation
declare var jest: {
  fn<T = any, Y extends any[] = any>(implementation?: (...args: Y) => T): {
    (...args: Y): T;
    mockReturnValue(value: T): any;
    mockResolvedValue(value: T): any;
    mockRejectedValue(value: any): any;
    mockImplementation(fn: (...args: Y) => T): any;
    mockClear(): any;
    mockReset(): any;
    mockRestore(): void;
    mockName(name: string): any;
  };
  mock(moduleName: string, factory?: () => any): any;
  clearAllMocks(): void;
  resetAllMocks(): void;
  restoreAllMocks(): void;
  useFakeTimers(): void;
  useRealTimers(): void;
  advanceTimersByTime(msToRun: number): void;
  Mock: any;
};

declare var describe: any;
declare var it: any;
declare var test: any;
declare var expect: any;
declare var beforeEach: any;
declare var afterEach: any;
declare var beforeAll: any;
declare var afterAll: any;

declare namespace jest {
  interface Mock<T = any, Y extends any[] = any> {
    (...args: Y): T;
    mockReturnValue(value: T): this;
    mockResolvedValue(value: T): this;
    mockRejectedValue(value: any): this;
    mockImplementation(fn: (...args: Y) => T): this;
    mockClear(): this;
    mockReset(): this;
    mockRestore(): void;
    mockName(name: string): this;
  }

  function fn<T = any, Y extends any[] = any>(implementation?: (...args: Y) => T): Mock<T, Y>;
  function mock(moduleName: string, factory?: () => any): any;
  function clearAllMocks(): void;
  function resetAllMocks(): void;
  function restoreAllMocks(): void;
  function useFakeTimers(): void;
  function useRealTimers(): void;
  function advanceTimersByTime(msToRun: number): void;
}