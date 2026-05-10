import base from './jest.config';

export default {
  ...base,
  testMatch: ['<rootDir>/tests/**/*.spec.ts', '<rootDir>/tests/**/*.it-spec.ts'],
  // For IT runs, exclude internal cookie plumbing helpers from coverage
  // (they are covered in UT; IT focuses on controller behavior/headers)
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/src/lib/services/auth-cookies.service.ts',
    '<rootDir>/tests/',
  ],
  collectCoverageFrom: [
    '<rootDir>/src/lib/controllers/**/*.ts',
    '!<rootDir>/src/lib/controllers/**/*.spec.ts',
  ],
};
