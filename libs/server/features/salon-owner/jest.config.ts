export default {
  displayName: 'server-feature-salon-owner',
  preset: '../../../../jest.preset.cjs',
  testEnvironment: 'node',
  globalSetup: '<rootDir>/tests/integration/salon-owner-test-global-setup.ts',
  setupFiles: ['reflect-metadata', '<rootDir>/../../server-testing-utils/src/lib/test-database-worker-setup.ts'],
  testTimeout: 30000,
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../../coverage/libs/server/features/salon-owner',
  coveragePathIgnorePatterns: ['[\\/]dto[\\/]'],
  coverageThreshold: {
    global: {
      statements: 100,
      branches: 40,
      functions: 100,
      lines: 100,
    },
  },
};
