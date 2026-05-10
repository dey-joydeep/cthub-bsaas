// Frontend application Jest configuration
export default {
  preset: 'jest-preset-angular/presets/defaults',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setup-jest.ts'],
  testMatch: ['**/+(*.)+(spec|test).+(ts|js)'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@env/(.*)$': '<rootDir>/src/environments/$1',
    '^@shared/(.*)$': '<rootDir>/../../libs/shared/src/$1',
    '^@frontend/(.*)$': '<rootDir>/../../libs/frontend/src/$1',
    '^@cthub-bsaas/(.*)$': '<rootDir>/../../libs/frontend/src/app/$1',
    '^@cthub-bsaas/shared/(.*)$': '<rootDir>/../../libs/frontend/src/app/shared/$1',
  },
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.spec.json',
      stringifyContentPathRegex: '\\.(html|svg)$',
      isolatedModules: true,
    },
  },
  snapshotSerializers: [
    'jest-preset-angular/build/serializers/no-ng-attributes',
    'jest-preset-angular/build/serializers/ng-snapshot',
    'jest-preset-angular/build/serializers/html-comment',
  ],
};
