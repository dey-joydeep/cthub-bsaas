import base from './jest.config';

export default {
  ...base,
  testMatch: ['<rootDir>/tests/**/*.spec.ts', '<rootDir>/tests/**/*.it-spec.ts'],
  coveragePathIgnorePatterns: ['/node_modules/', '<rootDir>/tests/', '<rootDir>/src/lib/dto/'],
  coverageThreshold: undefined,
  setupFiles: ['reflect-metadata'],
};
