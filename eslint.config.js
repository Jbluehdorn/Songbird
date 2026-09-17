import js from '@eslint/js';
import globals from 'globals';
import ts from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';
import refresh from 'eslint-plugin-react-refresh';
import accessibility from 'eslint-plugin-jsx-a11y';

export default ts.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      'test-results/**',
      'playwright-report/**',
      'songbird-specs/**',
      'songbird-kickoff/**',
      'second-voice-mockup/**',
      '**/public/**',
      '**/assets/**',
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    files: ['**/*.tsx'],
    plugins: {
      'react-hooks': hooks,
      'react-refresh': refresh,
      'jsx-a11y': accessibility,
    },
    rules: {
      ...hooks.configs.recommended.rules,
      ...accessibility.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    files: ['packages/song-core/src/**/*.ts'],
    rules: {
      'no-restricted-globals': ['error', 'window', 'document', 'navigator', 'indexedDB'],
      'no-restricted-imports': [
        'error',
        { paths: ['react', 'react-dom', 'dexie', 'tone'] },
      ],
    },
  },
);
