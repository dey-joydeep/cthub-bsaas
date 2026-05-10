import type { Config } from 'jest';

const config: Config = {
  displayName: 'api-e2e',
  preset: '../../../jest.preset.cjs',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/src/**/*.e2e-spec.ts'],
  coverageDirectory: '../../../coverage/apps/e2e/api',
  testTimeout: 20000,
  clearMocks: true,
};

export default config;
