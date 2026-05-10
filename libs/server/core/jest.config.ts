import type { Config } from 'jest';

const config: Config = {
  // Use TypeScript preset
  preset: 'ts-jest',

  // Test environment
  testEnvironment: 'node',

  // Test file patterns
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],

  // Module name mapper for path aliases
  moduleNameMapper: {
    '^@cthub-bsaas/(.*)$': '<rootDir>/../../$1/src',
  },

  // Transform settings
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        isolatedModules: true,
      },
    ],
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/testing/setup.ts'],

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,

  // Module handling
  moduleFileExtensions: ['js', 'json', 'ts'],

  // Coverage: not enforced at core level (feature libs enforce thresholds)

  // No extra watch plugins required in CI/envs without TTY
};

export default config;
