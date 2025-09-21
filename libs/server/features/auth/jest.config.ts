import type { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';
import tsconfig from '../../../../tsconfig.base.json';

const compilerOptions = tsconfig.compilerOptions ?? {};
const moduleNameMapper = pathsToModuleNameMapper(compilerOptions.paths ?? {}, {
  prefix: '<rootDir>/../../../../',
});

const config: Config = {
  displayName: 'server-feature-auth',
  preset: '../../../../jest.preset.cjs',
  testEnvironment: 'node',
  // testMatch is intentionally left undefined.
  // It is defined in jest.unit.config.ts and jest.int.config.ts respectively.
  globalSetup: '<rootDir>/../../server-testing-utils/src/lib/global-setup.ts',
  globalTeardown: '<rootDir>/../../server-testing-utils/src/lib/global-teardown.ts',
  testTimeout: 30000,
  moduleNameMapper,
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../../coverage/libs/server/features/auth',
  coveragePathIgnorePatterns: ['[/\\]dto[/\\]'],
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
