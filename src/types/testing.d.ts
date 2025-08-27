// Additional type declarations for testing environment

declare module 'react' {
  export const Component: any;
  export const ReactNode: any;
  export const createElement: any;
  export default any;
}

declare module '@testing-library/react' {
  export function render(ui: any, options?: any): any;
  export const screen: {
    getByText: (text: string) => any;
    getByRole: (role: string) => any;
    queryByText: (text: string) => any;
  };
}

declare module '@testing-library/jest-dom' {
  // Jest DOM matchers
}

// Global expect matchers
declare namespace jest {
  interface Matchers<R> {
    toBeInTheDocument(): R;
    toHaveClass(className: string): R;
    toHaveLength(length: number): R;
    toContain(value: any): R;
    toBe(value: any): R;
    toEqual(value: any): R;
    toBeNull(): R;
    toBeDefined(): R;
    toBeUndefined(): R;
    toBeInstanceOf(constructor: any): R;
    toHaveBeenCalled(): R;
    toHaveBeenCalledWith(...args: any[]): R;
    stringContaining(text: string): R;
    any(constructor: any): R;
    objectContaining(obj: any): R;
  }
}

declare var expect: {
  (value: any): jest.Matchers<any>;
  any: (constructor: any) => any;
  objectContaining: (obj: any) => any;
  stringContaining: (text: string) => any;
};