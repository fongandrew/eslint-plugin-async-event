import type { Rule } from 'eslint';
import type { MemberExpression, Node } from 'estree';

/**
 * Rule to detect usage of `.currentTarget` inside an async function after an await expression.
 *
 * This is important because in delegated event handlers, the value of `.currentTarget` is
 * redefined as the event synchronously bubbles. Using `.currentTarget` after an await can lead
 * to incorrect values or errors.
 */
const noAsyncCurrentTarget: Rule.RuleModule = {
	meta: {
		type: 'problem',
		docs: {
			description:
				'Disallow using .currentTarget after an await expression in async functions',
			recommended: true,
			url: 'https://github.com/eslint-community/eslint-plugin-no-async-current-target',
		},
		messages: {
			noAsyncCurrentTarget:
				"Don't use .currentTarget after an await. Store its value in a variable before awaiting.",
		},
		schema: [],
	},
	create(context) {
		// Track functions and whether they have encountered an await
		const functionsWithAwait = new WeakMap<Node, boolean>();
		// Current function stack
		const functionStack: Node[] = [];

		return {
			// Enter an async function or method
			'FunctionDeclaration[async=true]': (node) => {
				functionStack.push(node);
				functionsWithAwait.set(node, false);
			},
			'FunctionExpression[async=true]': (node) => {
				functionStack.push(node);
				functionsWithAwait.set(node, false);
			},
			'ArrowFunctionExpression[async=true]': (node) => {
				functionStack.push(node);
				functionsWithAwait.set(node, false);
			},

			// Exit a function
			'FunctionDeclaration:exit': (node) => {
				if (functionStack[functionStack.length - 1] === node) {
					functionStack.pop();
				}
			},
			'FunctionExpression:exit': (node) => {
				if (functionStack[functionStack.length - 1] === node) {
					functionStack.pop();
				}
			},
			'ArrowFunctionExpression:exit': (node) => {
				if (functionStack[functionStack.length - 1] === node) {
					functionStack.pop();
				}
			},

			// Detect await expressions
			AwaitExpression: () => {
				if (functionStack.length > 0) {
					const currentFunction = functionStack[functionStack.length - 1];
					functionsWithAwait.set(currentFunction, true);
				}
			},

			// Check .currentTarget access
			MemberExpression: (node: MemberExpression) => {
				const property = node.property;

				// Only check for .currentTarget access
				if (
					property.type === 'Identifier' &&
					property.name === 'currentTarget' &&
					!node.computed // Ensure it's a dot notation and not obj['currentTarget']
				) {
					// We need to check if this is an event.currentTarget reference
					// or it could be some other object with a currentTarget property
					let isEventObject = false;

					// Try to determine if this object is likely an event object (like event.currentTarget)
					if (node.object.type === 'Identifier') {
						const name = node.object.type === 'Identifier' && node.object.name;
						// Common event parameter naming patterns
						if (name === 'event' || name === 'e' || name === 'ev') {
							isEventObject = true;
						}
					}

					// Only check if we're in an async function that has encountered an await
					// and it's likely an event object
					if (functionStack.length > 0 && isEventObject) {
						const currentFunction = functionStack[functionStack.length - 1];
						const hasAwait = functionsWithAwait.get(currentFunction);

						if (hasAwait) {
							context.report({
								node,
								messageId: 'noAsyncCurrentTarget',
							});
						}
					}
				}
			},
		};
	},
};

export default noAsyncCurrentTarget;
