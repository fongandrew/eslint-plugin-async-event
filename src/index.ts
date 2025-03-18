import noAsyncCurrentTarget from './rules/no-async-current-target';

export = {
	rules: {
		'no-async-current-target': noAsyncCurrentTarget,
	},
	configs: {
		recommended: {
			plugins: ['no-async-current-target'],
			rules: {
				'no-async-current-target/no-async-current-target': 'error',
			},
		},
	},
};
