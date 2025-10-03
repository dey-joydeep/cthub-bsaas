import base from './jest.config';

export default {
  ...base,
  testMatch: ['<rootDir>/tests/**/*.spec.ts', '<rootDir>/tests/**/*.it-spec.ts'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/tests/',
    '<rootDir>/src/lib/types/',
    '<rootDir>/src/lib/auth.module.ts',
    '<rootDir>/src/lib/dto/',
  ],
  collectCoverageFrom: [
    '<rootDir>/src/lib/controllers/**/*.ts',
    '<rootDir>/src/lib/services/**/*.ts',
    '<rootDir>/src/lib/utils/**/*.ts',
    '<rootDir>/src/lib/strategies/**/*.ts',
    '!<rootDir>/src/lib/**/*.spec.ts',
    '!<rootDir>/src/lib/**/index.ts',
  ],
  setupFiles: ['reflect-metadata'],
};
