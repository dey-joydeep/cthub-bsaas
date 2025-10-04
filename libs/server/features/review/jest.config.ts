import type { Config } from 'jest';

const config: Config = {
  displayName: 'server-feature-review',
  preset: '../../../../jest.preset.cjs',
  testEnvironment: 'node',
  globalSetup: '<rootDir>/../../server-testing-utils/src/lib/global-setup.ts',
  globalTeardown: '<rootDir>/../../server-testing-utils/src/lib/global-teardown.ts',
  testTimeout: 30000,
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../../coverage/libs/server/features/review',
  coveragePathIgnorePatterns: ['[\\/]dto[\\/]'],
  coverageThreshold: {
    global: {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
  },
};

export default config;
