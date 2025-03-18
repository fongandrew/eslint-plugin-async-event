import type { Rule } from 'eslint';
import type { CallExpression } from 'estree';
import { createAsyncContextTracker } from '../utils/async-context';

/**
 * Rule to detect usage of event methods (preventDefault, stopPropagation, stopImmediatePropagation)
 * inside an async function after an await expression or inside promise chain methods (.then, .catch, .finally).
 *
 * This is important because event methods don't perform as expected when called asynchronously.
 * Using these methods after an await or in a promise chain can lead to incorrect behavior or errors.
 */
const noAsyncEventMethods: Rule.RuleModule = {
	meta: {
		type: 'problem',
		docs: {
			description:
				'Disallow using event methods (preventDefault, stopPropagation, stopImmediatePropagation) after an await expression or in promise chains',
			recommended: true,
			url: 'https://github.com/eslint-community/eslint-plugin-async-event',
		},
		messages: {
			noAsyncEventMethods:
				"Don't use event methods like preventDefault(), stopPropagation(), or stopImmediatePropagation() after an await or in promise chains. Call these methods before async operations.",
		},
		schema: [],
	},

	create(context) {
		// Event methods we want to check
		const EVENT_METHODS = ['preventDefault', 'stopPropagation', 'stopImmediatePropagation'];

		// Create a tracker for managing async context
		const tracker = createAsyncContextTracker();
		// Get the base listeners for tracking async context
		const baseListeners = tracker.createListeners(context);

		// Add our specific listener for checking event method calls
		const listeners = {
			...baseListeners,

			CallExpression: (node: CallExpression & Rule.NodeParentExtension) => {
				// Run the base CallExpression handler to track promise chains
				if (baseListeners.CallExpression) {
					// Cast to 'any' to handle type mismatch between the base listener and this one
					baseListeners.CallExpression(node);
				}

				// Check for event method calls like event.preventDefault()
				if (node.callee.type === 'MemberExpression') {
					const memberExpr = node.callee;
					const property = memberExpr.property;

					if (
						property.type === 'Identifier' &&
						EVENT_METHODS.includes(property.name) &&
						!memberExpr.computed // Ensure it's a dot notation and not obj['preventDefault']
					) {
						// We need to check if this is an event method call
						// or it could be some other object with the same method name
						let isEventObject = false;
						let objectName: string | null = null;

						// Try to determine if this object is likely an event object (like event.preventDefault())
						if (memberExpr.object.type === 'Identifier') {
							objectName = memberExpr.object.name;
							// Check if it's likely an event parameter
							if (tracker.isLikelyEventParam(objectName)) {
								// Skip if this variable is known not to be a DOM event
								if (!tracker.nonEventVariables.has(objectName)) {
									isEventObject = true;
								}
							}
						}

						if (isEventObject && objectName) {
							// Check if we're in an async context and report if necessary
							tracker.isInAsyncContext(
								objectName,
								'noAsyncEventMethods',
								node,
								context,
							);
						}
					}
				}
			},
		};

		return listeners;
	},
};

export default noAsyncEventMethods;
