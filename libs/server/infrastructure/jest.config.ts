import type { Config } from 'jest';

const config: Config = {
  displayName: 'server-infrastructure',
  preset: '../../../jest.preset.cjs',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json', 'html'],
  coverageDirectory: '../../../coverage/libs/server/infrastructure',
  collectCoverageFrom: ['<rootDir>/src/**/*.ts', '!<rootDir>/src/**/index.ts'],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
};

export default config;
