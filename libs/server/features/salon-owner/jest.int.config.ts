export default {
  displayName: 'server-feature-salon-owner',
  preset: '../../../../jest.preset.cjs',
  testEnvironment: 'node',
  testTimeout: 30000,
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../../coverage/libs/server/features/salon-owner',
  coveragePathIgnorePatterns: ['/node_modules/', '<rootDir>/tests/', '<rootDir>/src/lib/dto/'],
  coverageThreshold: undefined,
  setupFiles: ['reflect-metadata', '<rootDir>/../../server-testing-utils/src/lib/test-database-worker-setup.ts'],
  testMatch: ['<rootDir>/tests/**/*.spec.ts', '<rootDir>/tests/**/*.it-spec.ts'],
};
