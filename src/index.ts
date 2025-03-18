import noAsyncEventProperties from './rules/no-async-event-properties';
import noAsyncEventReference from './rules/no-async-event-reference';

export = {
	rules: {
		'no-async-event-properties': noAsyncEventProperties,
		'no-async-event-reference': noAsyncEventReference,
	},
	configs: {
		recommended: {
			plugins: ['async-event'],
			rules: {
				// Use the new combined rule instead of the individual ones
				'async-event/no-async-event-properties': 'error',
				'async-event/no-async-event-reference': 'error',
			},
		},
	},
};
