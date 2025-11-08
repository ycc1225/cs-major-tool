import globals from 'globals';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactRecommended from 'eslint-plugin-react/configs/recommended.js';
import reactHooks from 'eslint-plugin-react-hooks';
import prettierRecommended from 'eslint-plugin-prettier/recommended';

export default [
  {
    ignorePatterns: ['dist/', 'src/utils/', 'vite.config.ts'],
  },
  // 1. 全局设置
  {
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },

  js.configs.recommended,

  ...tseslint.configs.recommended,

  {
    ...reactRecommended,
    files: ['**/*.{jsx,tsx}'], // 仅应用于 JSX/TSX 文件
  },

  {
    files: ['**/*.{jsx,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: reactHooks.configs.recommended.rules,
  },

  prettierRecommended,
];
