import type { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';
import tsconfig from '../../../tsconfig.base.json';

const compilerOptions = tsconfig.compilerOptions ?? {};
const moduleNameMapper = pathsToModuleNameMapper(compilerOptions.paths ?? {}, {
  prefix: '<rootDir>/../../../',
});

const config: Config = {
  displayName: 'server-core',
  preset: '../../../jest.preset.cjs',
  testEnvironment: 'node',
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],
  moduleNameMapper,
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },

  clearMocks: true,
  resetMocks: true,
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/index.ts', '!src/**/*.module.ts'],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
  coverageDirectory: '../../../coverage/libs/server/core',
};

export default config;
