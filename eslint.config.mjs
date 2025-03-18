import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	{
		ignores: ['dist/**/*', 'node_modules/**/*', '.*/**/*'],
	},

	{
		files: ['**/*.ts'],
		linterOptions: {
			reportUnusedDisableDirectives: true,
		},
	},

	{
		files: ['**/*.js'],
		languageOptions: {
			globals: {
				module: 'readonly',
				require: 'readonly',
				process: 'readonly',
				__dirname: 'readonly',
			},
		},
	},

	eslint.configs.recommended,
	tseslint.configs.recommended,
	tseslint.configs.stylistic,
	eslintConfigPrettier,

	{
		plugins: {
			prettier: prettierPlugin,
		},
		rules: {
			'prettier/prettier': [
				'error',
				{
					// So this doesn't blow up on Windows CI
					endOfLine: 'auto',
				},
			],
			'no-console': ['error', { allow: ['warn', 'error'] }],
			'@typescript-eslint/consistent-type-imports': [
				'error',
				{
					prefer: 'type-imports',
					fixStyle: 'inline-type-imports',
				},
			],
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
				},
			],
		},
	},
);
