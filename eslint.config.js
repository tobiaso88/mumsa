import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const DEXIE = { group: ['dexie'], message: 'Databasen nås bara via data/.' }

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'playwright-report', 'test-results']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
    },
  },
  {
    // domain/ ska vara rent: ingen React och ingen I/O
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: ['react', 'react-dom', 'dexie', '**/data/**', '**/ui/**'] },
      ],
    },
  },
  {
    // ui/ pratar aldrig direkt med lagringen, all I/O går via data/
    files: ['src/ui/**/*.{ts,tsx}'],
    ignores: ['src/ui/**/*.test.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-restricted-imports': ['error', { patterns: [DEXIE] }],
    },
  },
  {
    // Komponenter och skärmar når data/ via hooks. Typer får importeras.
    files: ['src/ui/**/*.{ts,tsx}'],
    ignores: ['src/ui/hooks/**', 'src/ui/DbProvider.tsx', 'src/ui/**/*.test.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            DEXIE,
            {
              regex: '(^|/)data/',
              allowTypeImports: true,
              message: 'Komponenter når data/ via en hook i ui/hooks/.',
            },
          ],
        },
      ],
    },
  },
])
