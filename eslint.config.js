import nx from '@nx/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  // Ensure TS files are parsed with @typescript-eslint/parser in VSCode (flat config)
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        // Auto-discover the correct tsconfig per file and respect project references
        projectService: true,
        sourceType: 'module',
      },
    },
    plugins: {
      '@nx': nx,
      '@typescript-eslint': tsPlugin,
    },
    rules: {},
  },
  // Test-only relaxations (main boundary rules live in eslint.base.js)
  {
    files: ['**/*.spec.ts', '**/*.test.ts'],
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      '@typescript-eslint/require-await': 'warn',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-misused-promises': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
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
      '**/eslint.config.*',
      '**/vitest.config.*.timestamp*',
    ],
  },
];
