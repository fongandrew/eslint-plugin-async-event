import noAsyncCurrentTarget from './rules/no-async-current-target';
import noAsyncEventMethods from './rules/no-async-event-methods';
import noAsyncEventReference from './rules/no-async-event-reference';

export = {
	rules: {
		'no-async-current-target': noAsyncCurrentTarget,
		'no-async-event-methods': noAsyncEventMethods,
		'no-async-event-reference': noAsyncEventReference,
	},
	configs: {
		recommended: {
			plugins: ['async-event'],
			rules: {
				'async-event/no-async-current-target': 'error',
				'async-event/no-async-event-methods': 'error',
				'async-event/no-async-event-reference': 'error',
			},
		},
	},
};
