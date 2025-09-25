import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import nxEslintPlugin from '@nx/eslint-plugin';
import path from 'path';
import { fileURLToPath } from 'url';
import tsParser from '@typescript-eslint/parser';
import ts from 'typescript-eslint';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

// Scope type-aware TS-ESLint rules to source files by mapping configs
const typeCheckedScoped = ts.configs.recommendedTypeChecked.map((cfg) => ({
  ...cfg,
  files: ['**/src/**/*.{ts,tsx}'],
  // Do not apply type-aware rules to test/spec/e2e files; they are handled below
  ignores: ['**/*.{spec,test}.ts', '**/*.e2e-spec.ts', '**/jest*.ts'],
  languageOptions: {
    ...(cfg.languageOptions ?? {}),
    parser: tsParser,
    parserOptions: {
      ...((cfg.languageOptions && cfg.languageOptions.parserOptions) || {}),
      // Use the TS Project Service so ESLint auto-discovers the right tsconfig per file
      // and respects project references across libs. This avoids TS6307 during lint.
      projectService: true,
    },
  },
}));

export default [
  {
    plugins: { '@nx': nxEslintPlugin },
    files: ['**/*.{ts,tsx,js,jsx,mts,cts}'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [
            // Apps may only depend on libs
            { sourceTag: 'type:app', onlyDependOnLibsWithTags: ['type:lib'] },

            // Web cannot depend on server
            { sourceTag: 'platform:web', onlyDependOnLibsWithTags: ['platform:web', 'scope:ui', 'scope:shared', 'scope:web-config'] },

            // Shared only depends on shared
            { sourceTag: 'scope:shared', onlyDependOnLibsWithTags: ['scope:shared'] },

            // Backend layering (contracts -> core -> data -> infra -> features)
            { sourceTag: 'layer:contracts', onlyDependOnLibsWithTags: ['layer:contracts', 'scope:shared'] },
            { sourceTag: 'type:core',       onlyDependOnLibsWithTags: ['type:core', 'layer:contracts', 'scope:shared'] },
            { sourceTag: 'type:data',       onlyDependOnLibsWithTags: ['type:data', 'type:core', 'layer:contracts', 'scope:shared'] },
            { sourceTag: 'type:infra',      onlyDependOnLibsWithTags: ['type:infra', 'type:data', 'type:core', 'layer:contracts', 'scope:shared'] },
            { sourceTag: 'type:feature',    onlyDependOnLibsWithTags: ['type:feature', 'type:infra', 'type:data', 'type:core', 'layer:contracts', 'scope:shared'] },

            
          ],
        },
      ],
    },
  },
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/docs/**',
      '**/coverage/**',
      '**/.angular/**',
      '**/.nx/**',
      '**/tmp/**',
      // Do not lint ESLint config files themselves
      '**/eslint.config.js',
      '**/eslint.config.cjs',
      '**/eslint.config.mjs',
    ],
  },
  // Typescript-ESLint base (not type-aware) globally
  ...ts.configs.recommended,
  ...compat.extends('prettier'),
  // Type-aware rules only for source files; auto-discover tsconfig via project service
  ...typeCheckedScoped,
  // Strengthen async safety in source files
  {
    files: ['**/src/**/*.{ts,tsx}'],
    ignores: ['**/src/**/*.{spec,test}.ts', '**/src/**/*.e2e-spec.ts'],
    rules: {
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/no-floating-promises': ['error', { ignoreVoid: false, ignoreIIFE: false }],
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false }, checksConditionals: true },
      ],
    },
  },
  // Type-aware tests under src (leverage project service)
  {
    files: ['**/src/**/*.{spec,test}.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { projectService: true },
    },
    rules: {
      '@typescript-eslint/require-await': 'warn',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-misused-promises': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  // Non-source TS (other tests, scripts) use non-type-aware parsing
  {
    files: [
      '**/*.{spec,test}.ts',
      '**/*.scripts.ts',
      '**/*.e2e-spec.ts',
      '**/*.migration.ts',
      '**/tools/**/*.ts',
      '**/scripts/**/*.ts',
    ],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: false,
      },
      globals: {
        afterAll: true,
        afterEach: true,
        beforeAll: true,
        beforeEach: true,
        describe: true,
        expect: true,
        it: true,
        jest: true,
        test: true,
      },
    },
    rules: {},
  },
  // Jest config TS files: keep parsing simple, no typed rules
  {
    files: ['**/jest*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { project: false },
    },
    rules: {},
  },
  // Prevent deep relative imports to core from feature libs; enforce package-root imports
  {
    files: ['libs/server/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '../../core/**',
                '../../../core/**',
                '../../../../core/**',
                '../../lib/server/core/**',
                '../../../lib/server/core/**',
                '**/core/src/**',
              ],
              message: 'Import from @cthub-bsaas/server-core (package root), not deep relative paths into core.',
            },
            {
              group: ['@cthub-bsaas/server-core/*'],
              message: 'Import from @cthub-bsaas/server-core package root; deep subpath imports are not allowed.',
            },
          ],
        },
      ],
    },
  },
  // Prevent web -> server imports; web must only import web/* and shared/*
  {
    files: ['libs/web/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '../../server/**',
                '../../../server/**',
                '../../../../server/**',
                '@cthub-bsaas/server-*',
              ],
              message:
                'Web libraries must not import server libraries. Use @cthub-bsaas/shared or other web libs instead.',
            },
          ],
        },
      ],
    },
  },
];
