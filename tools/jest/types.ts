import type { Config } from '@jest/types';

export type JestConfig = Config.InitialOptions;

export const createJestConfig = (config: JestConfig): JestConfig => ({
  // Default configuration
  testEnvironment: 'node',
  preset: 'ts-jest',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.(t|j)sx?$': 'ts-jest',
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],

  // Merge with the provided config
  ...config,
});
