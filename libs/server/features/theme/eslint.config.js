import baseConfig from '../../../../eslint.base.js';

export default [
  ...baseConfig,
  {
    files: ['**/*.ts'],
    rules: {},
  },
  {
    files: ['**/*.spec.ts', '**/*.test.ts'],
    rules: {},
  },
];
