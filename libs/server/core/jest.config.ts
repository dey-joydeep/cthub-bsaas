// NOTE: Keep this file import-free to avoid Nx module-boundaries lint hits.
// We rely on the workspace root jest.preset.cjs for ts-jest + path mapping.

import type { Config } from 'jest';

const config: Config = {
  displayName: 'server-core',
  preset: '../../../jest.preset.cjs',
  testEnvironment: 'node',

  // Keep it simple; the preset handles ts-jest + tsconfig paths
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],

  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        // Use this project's test tsconfig
        tsconfig: '<rootDir>/tsconfig.spec.json',
        // No `isolatedModules` here; it’s not required and is deprecated in ts-jest v30.
      },
    ],
  },

  moduleFileExtensions: ['ts', 'js', 'json', 'html'],

  // Reasonable defaults; adjust if you need different coverage gates
  collectCoverageFrom: ['src/**/*.ts', '!src/**/index.ts', '!src/**/*.module.ts'],
  coverageThreshold: {
    global: { statements: 80, branches: 80, functions: 80, lines: 80 },
  },
  coverageDirectory: '../../../coverage/libs/server/core',
};

export default config;
