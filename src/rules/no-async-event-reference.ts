import type { Rule } from 'eslint';
import type { Identifier, Node, CallExpression } from 'estree';
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

		// Track nodes that have already been reported to avoid duplicates
		const reportedNodes = new WeakSet<Node>();
		// Track function calls that have already been reported
		const reportedCalls = new WeakSet<CallExpression>();

		// Add our specific listener for checking event object references
		const listeners = {
			...baseListeners,

			// Detect usage of event objects
			Identifier: (node: Identifier & Rule.NodeParentExtension) => {
				// Skip if this node has already been reported
				if (reportedNodes.has(node)) {
					return;
				}

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

				// Skip if this variable is known not to be a DOM event (e.g., a custom event created in the function)
				if (tracker.nonEventVariables.has(varName)) {
					return;
				}

				// Only proceed if this is a function parameter or derived from one
				// This is the key change to only look for actual parameters, not globals
				if (
					tracker.isParameterInScope(varName) ||
					tracker.isDerivedFromEventParam(varName)
				) {
					// Special handling for function calls to avoid multiple reports for the same call
					if (node.parent?.type === 'CallExpression') {
						const callExpr = node.parent as CallExpression;

						// If we're in a function argument and not the first argument, skip
						// This prevents double reporting on processEvent(event)
						if (callExpr.arguments.indexOf(node) > 0) {
							return;
						}

						// If we've already reported this call expression, skip
						if (reportedCalls.has(callExpr)) {
							return;
						}

						// Check if we're in an async context and should report
						const shouldReport = tracker.isInAsyncContext(
							varName,
							'noAsyncEventReference',
							node,
							context,
						);

						// If reported, mark the whole call expression as reported
						if (shouldReport) {
							reportedCalls.add(callExpr);
							reportedNodes.add(node);
						}
					} else {
						// Regular case - check if we're in an async context and report if necessary
						const shouldReport = tracker.isInAsyncContext(
							varName,
							'noAsyncEventReference',
							node,
							context,
						);
						if (shouldReport) {
							reportedNodes.add(node);
						}
					}
				}
			},
		};

		return listeners;
	},
};

export default noAsyncEventReference;
