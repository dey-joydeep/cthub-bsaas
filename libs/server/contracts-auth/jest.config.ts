import type { Config } from 'jest';

const config: Config = {
  displayName: 'server-contracts-auth',
  preset: '../../../jest.preset.cjs',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'json', 'html'],
  coverageDirectory: '../../../coverage/libs/server/contracts-auth',
  collectCoverageFrom: ['<rootDir>/src/**/*.ts', '!**/*index.ts'],
  coverageThreshold: {
    global: {
      statements: 0,
      branches: 0,
      functions: 0,
      lines: 0,
    },
  },
};

export default config;
