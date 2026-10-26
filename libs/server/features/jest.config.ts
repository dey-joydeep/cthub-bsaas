import type { Config } from 'jest';

const config: Config = {
  displayName: 'server-features',
  preset: '../../../jest.preset.cjs',
  testEnvironment: 'node',
  globalSetup: '<rootDir>/../server-testing-utils/src/lib/global-setup.ts',
  globalTeardown: '<rootDir>/../server-testing-utils/src/lib/global-teardown.ts',
  testTimeout: 30000,
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../coverage/libs/server/features',
  coveragePathIgnorePatterns: ['[\\/]dto[\\/]'],
  coverageThreshold: {
    global: {
      statements: 100,
      branches: 95,
      functions: 100,
      lines: 100,
    },
  },
};

export default config;
