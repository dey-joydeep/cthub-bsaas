/* eslint-disable */
export default {
  displayName: 'web-app-admin',
  preset: '../../../jest.preset.cjs',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setup-jest.ts'],
  coverageDirectory: '../../../coverage/apps/web/admin',
  moduleNameMapper: {
    '^@cthub-bsaas/web-admin$': '<rootDir>/../../../libs/web/admin/src/index.ts',
    '^@cthub-bsaas/web-admin/auth$': '<rootDir>/../../../libs/web/admin/src/lib/features/auth/index.ts',
    '^@cthub-bsaas/web-core/auth$': '<rootDir>/../../../libs/web/core/auth/src/index.ts',
    '^@cthub-bsaas/web-core-auth$': '<rootDir>/../../../libs/web/core/auth/src/index.ts',
    '^@cthub-bsaas/shared$': '<rootDir>/../../../libs/shared/src/index.ts',
  },
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
  snapshotSerializers: [
    'jest-preset-angular/build/serializers/no-ng-attributes',
    'jest-preset-angular/build/serializers/ng-snapshot',
    'jest-preset-angular/build/serializers/html-comment',
  ],
};
