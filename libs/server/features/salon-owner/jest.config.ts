export default {
  displayName: 'server-feature-salon-owner',
  preset: '../../../../jest.preset.cjs',
  testEnvironment: 'node',
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
