import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testMatch: ['<rootDir>/src/**/*.e2e-spec.ts'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['src/**/*.(t|j)s'],
  coverageDirectory: '../../../coverage/apps/e2e/api',
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/../../../apps/api/src/$1',
  },
  testTimeout: 20000,
  clearMocks: true,
};

export default config;

