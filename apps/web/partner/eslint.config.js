import webBase from '../../../eslint.base.web.js';

export default [
  ...webBase,
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: ['app', 'lib'],
          style: 'kebab-case',
        },
      ],
      '@angular-eslint/prefer-inject': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-implied-eval': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: [
      'src/app/app.component.ts',
      'src/app/app.config.ts',
      'src/app/app.config.server.ts',
      'apps/web/partner/src/app/app.component.ts',
      'apps/web/partner/src/app/app.config.ts',
      'apps/web/partner/src/app/app.config.server.ts',
    ],
    rules: {
      '@nx/enforce-module-boundaries': 'off',
    },
  },
];
