import base from './jest.config.ts';

export default {
  ...base,
  globalSetup: undefined,
  globalTeardown: undefined,
  testMatch: ['<rootDir>/src/**/*.spec.ts', '<rootDir>/src/**/*.test.ts'],
};
