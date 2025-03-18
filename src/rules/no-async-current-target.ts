import type { Rule } from 'eslint';
import type {
	CallExpression,
	FunctionDeclaration,
	FunctionExpression,
	ArrowFunctionExpression,
	MemberExpression,
	Node,
	Pattern,
	VariableDeclarator,
} from 'estree';

/**
 * Rule to detect usage of `.currentTarget` inside an async function after an await expression
 * or inside promise chain methods (.then, .catch, .finally).
 *
 * This is important because in delegated event handlers, the value of `.currentTarget` is
 * redefined as the event synchronously bubbles. Using `.currentTarget` after an await or
 * in a promise chain can lead to incorrect values or errors.
 */
const noAsyncCurrentTarget: Rule.RuleModule = {
	meta: {
		type: 'problem',
		docs: {
			description:
				'Disallow using .currentTarget after an await expression or in promise chains',
			recommended: true,
			url: 'https://github.com/eslint-community/eslint-plugin-no-async-current-target',
		},
		messages: {
			noAsyncCurrentTarget:
				"Don't use .currentTarget after an await or in promise chains. Store its value in a variable before async operations.",
		},
		schema: [],
	},

	create(context) {
		// Track functions and whether they have encountered an await
		const functionsWithAwait = new WeakMap<Node, boolean>();
		// Current function stack
		const functionStack: Node[] = [];
		// Track functions that are inside promise chain methods
		const functionsInPromise = new WeakSet<Node>();
		// Track parameters of functions to know which variables are defined within a function
		const functionParams = new WeakMap<Node, Set<string>>();
		// Track variables that are not DOM events
		const nonEventVariables = new Set<string>();

		// Helper function to collect parameter names
		const collectParamNames = (params: Pattern[]): Set<string> => {
			const paramNames = new Set<string>();
			params.forEach((param) => {
				if (param.type === 'Identifier') {
					paramNames.add(param.name);
				}
			});
			return paramNames;
		};

		return {
			// Enter an async function or method
			'FunctionDeclaration[async=true]': (node: FunctionDeclaration) => {
				functionStack.push(node);
				functionsWithAwait.set(node, false);

				// Track parameter names
				const params = collectParamNames(node.params);
				functionParams.set(node, params);
			},
			'FunctionExpression[async=true]': (node: FunctionExpression) => {
				functionStack.push(node);
				functionsWithAwait.set(node, false);

				// Track parameter names
				const params = collectParamNames(node.params);
				functionParams.set(node, params);
			},
			'ArrowFunctionExpression[async=true]': (node: ArrowFunctionExpression) => {
				functionStack.push(node);
				functionsWithAwait.set(node, false);

				// Track parameter names
				const params = collectParamNames(node.params);
				functionParams.set(node, params);
			},

			// Track non-async functions as well, for promise chains
			FunctionDeclaration: (node: FunctionDeclaration) => {
				if (!node.async) {
					functionStack.push(node);

					// Track parameter names
					const params = collectParamNames(node.params);
					functionParams.set(node, params);
				}
			},
			FunctionExpression: (node: FunctionExpression) => {
				if (!node.async) {
					functionStack.push(node);

					// Track parameter names
					const params = collectParamNames(node.params);
					functionParams.set(node, params);
				}
			},
			ArrowFunctionExpression: (node: ArrowFunctionExpression) => {
				if (!node.async) {
					functionStack.push(node);

					// Track parameter names
					const params = collectParamNames(node.params);
					functionParams.set(node, params);
				}
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

			// Track variables that are explicitly not DOM events
			VariableDeclarator: (node: VariableDeclarator & Rule.NodeParentExtension) => {
				// If we see something like 'const event = { currentTarget: ... }'
				// then this is not a DOM event
				if (
					node.id &&
					node.id.type === 'Identifier' &&
					node.init &&
					node.init.type === 'ObjectExpression'
				) {
					nonEventVariables.add(node.id.name);
				}
			},

			// Detect callback functions in promise chains (.then, .catch, .finally)
			CallExpression: (node: CallExpression) => {
				if (
					node.callee.type === 'MemberExpression' &&
					node.callee.property.type === 'Identifier' &&
					['then', 'catch', 'finally'].includes(node.callee.property.name)
				) {
					// Mark all callback functions as being in a promise chain
					node.arguments.forEach((arg) => {
						if (
							arg.type === 'FunctionExpression' ||
							arg.type === 'ArrowFunctionExpression'
						) {
							functionsInPromise.add(arg);
						}
					});
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
					let objectName: string | null = null;

					// Try to determine if this object is likely an event object (like event.currentTarget)
					if (node.object.type === 'Identifier') {
						objectName = node.object.name;
						// Common event parameter naming patterns
						if (objectName === 'event' || objectName === 'e' || objectName === 'ev') {
							// Skip if this variable is known not to be a DOM event
							if (!nonEventVariables.has(objectName)) {
								isEventObject = true;
							}
						}
					}

					if (isEventObject && objectName) {
						// Check for async function with await
						if (functionStack.length > 0) {
							const currentFunction = functionStack[functionStack.length - 1];
							const hasAwait = functionsWithAwait.get(currentFunction);

							if (hasAwait) {
								context.report({
									node,
									messageId: 'noAsyncCurrentTarget',
								});
								return;
							}
						}

						// Check if we're inside a promise chain callback
						let inPromiseChain = false;
						let isDefinedInCurrentFunction = false;

						// Find if we're in a promise chain and if the event is defined in the current scope
						for (const func of functionStack) {
							if (functionsInPromise.has(func)) {
								inPromiseChain = true;
								const params = functionParams.get(func) || new Set();
								if (params.has(objectName)) {
									isDefinedInCurrentFunction = true;
								}
							}
						}

						// If we're in a promise chain and the variable isn't defined in the current function,
						// it's coming from the outer scope and should be reported
						if (inPromiseChain && !isDefinedInCurrentFunction) {
							context.report({
								node,
								messageId: 'noAsyncCurrentTarget',
							});
							return;
						}
					}
				}
			},
		};
	},
};

export default noAsyncCurrentTarget;
