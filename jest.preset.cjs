const nxPreset = require('@nx/jest/preset').default;
const { join } = require('path');
const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.base.json');

const workspaceRoot = __dirname.replace(/\\/g, '/');

module.exports = {
  ...nxPreset,
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: `${workspaceRoot}/` }),
  testMatch: ['**/+(*.)+(spec|test).+(ts|js)?(x)'],
  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc/jest',
      {
        sourceMaps: 'inline',
        module: {
          type: 'commonjs',
        },
        jsc: {
          target: 'es2022',
          parser: {
            syntax: 'typescript',
            tsx: true,
            decorators: true,
          },
          transform: {
            legacyDecorator: true,
            decoratorMetadata: true,
          },
        },
      },
    ],
    '^.+\\.(html|svg)$': join(__dirname, 'tools', 'testing', 'jest', 'html-transform.cjs'),
  },
  moduleFileExtensions: ['ts', 'js', 'html', 'json'],
  collectCoverage: true,
  coverageReporters: ['html', 'text', 'lcov'],
  coverageDirectory: '<rootDir>/coverage',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  testEnvironment: 'node',
  testTimeout: 10000,
  testFailureExitCode: 1,
};
