import baseConfig from '../../../eslint.base.js';
import nxEslintPlugin from '@nx/eslint-plugin';

export default [
  ...baseConfig,
  {
    files: ['**/*.json'],
    plugins: {
      '@nx': nxEslintPlugin,
    },
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredFiles: ['{projectRoot}/eslint.config.{js,cjs,mjs,ts,cts,mts}'],
        },
      ],
    },
    languageOptions: {
      parser: await import('jsonc-eslint-parser'),
    },
  },
];
