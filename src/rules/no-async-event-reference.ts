import type { Rule } from 'eslint';
import type { Identifier } from 'estree';
import { createAsyncContextTracker } from '../utils/async-context';

/**
 * Rule to detect usage of event objects inside an async function after an await expression
 * or inside promise chain methods (.then, .catch, .finally).
 *
 * This is important because event objects may not be valid or reliable when used asynchronously.
 * Using event objects after an await or in a promise chain can lead to incorrect behavior or errors.
 */
const noAsyncEventReference: Rule.RuleModule = {
	meta: {
		type: 'problem',
		docs: {
			description:
				'Disallow referencing event objects after an await expression or in promise chains',
			recommended: true,
			url: 'https://github.com/eslint-community/eslint-plugin-async-event',
		},
		messages: {
			noAsyncEventReference:
				"Don't reference event objects after an await or in promise chains. Store needed values in variables before async operations.",
		},
		schema: [],
	},

	create(context) {
		// Create a tracker for managing async context
		const tracker = createAsyncContextTracker();
		// Get the base listeners for tracking async context
		const baseListeners = tracker.createListeners(context);

		// Add our specific listener for checking event object references
		const listeners = {
			...baseListeners,

			// Detect usage of event objects
			Identifier: (node: Identifier & Rule.NodeParentExtension) => {
				// Skip if not a variable reference
				if (node.parent?.type === 'VariableDeclarator' && node.parent.id === node) {
					return;
				}

				// Skip if not a function parameter
				if (
					node.parent?.type === 'FunctionDeclaration' ||
					node.parent?.type === 'FunctionExpression' ||
					node.parent?.type === 'ArrowFunctionExpression'
				) {
					return;
				}

				// Skip if this is a property access (obj.event)
				if (node.parent?.type === 'MemberExpression' && node.parent.property === node) {
					return;
				}

				const varName = node.name;

				// Skip if this variable is known not to be a DOM event
				if (tracker.nonEventVariables.has(varName)) {
					return;
				}

				// Only check common event parameter names
				if (tracker.isLikelyEventParam(varName)) {
					// Check if we're in an async context and report if necessary
					tracker.isInAsyncContext(varName, 'noAsyncEventReference', node, context);
				}
			},
		};

		return listeners;
	},
};

export default noAsyncEventReference;
