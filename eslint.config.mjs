import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import prettier from 'eslint-config-prettier';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  jsxA11y.flatConfigs.recommended,
  prettier,
  {
    files: ['**/*.astro'],
    languageOptions: {
      parser: astro.parser,
    },
  },
  {
    ignores: ['dist/', 'node_modules/', '.astro/'],
  },
];
