import type { Rule } from 'eslint';
import type {
	CallExpression,
	FunctionDeclaration,
	FunctionExpression,
	ArrowFunctionExpression,
	Node,
	Pattern,
	VariableDeclarator,
} from 'estree';

// Types for the async context tracker
export interface AsyncContextTracker {
	functionsWithAwait: WeakMap<Node, boolean>;
	functionStack: Node[];
	functionsInPromise: WeakSet<Node>;
	functionParams: WeakMap<Node, Set<string>>;
	nonEventVariables: Set<string>;

	// Method to check if we're in an async context (after await or in promise chain)
	isInAsyncContext(
		objectName: string,
		messageId: string,
		node: Node,
		context: Rule.RuleContext,
	): boolean;

	// Method to check if name is a common event parameter name
	isLikelyEventParam(name: string): boolean;

	// Register all the common listeners for tracking async context
	createListeners(context: Rule.RuleContext): Rule.RuleListener;
}

/**
 * Creates a tracker to manage async context for event-related linting rules.
 * This handles tracking functions, await statements, promise chains, and determining
 * when event references are being used after asynchronous operations.
 */
export function createAsyncContextTracker(): AsyncContextTracker {
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

	// Helper to check if a variable name is likely an event parameter
	const isLikelyEventParam = (name: string): boolean => {
		return (
			name === 'event' ||
			name === 'e' ||
			name === 'ev' ||
			name === 'event' ||
			name.endsWith('Event')
		);
	};

	// Method to check if we're in an async context and report if necessary
	const isInAsyncContext = (
		objectName: string,
		messageId: string,
		node: Node,
		context: Rule.RuleContext,
	): boolean => {
		// Check for async function with await
		if (functionStack.length > 0) {
			const currentFunction = functionStack[functionStack.length - 1];
			const hasAwait = functionsWithAwait.get(currentFunction);

			if (hasAwait) {
				context.report({
					node,
					messageId,
				});
				return true;
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
				messageId,
			});
			return true;
		}

		return false;
	};

	// Create all the common listeners for tracking async context
	const createListeners = (): Rule.RuleListener => {
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
				// If we see something like 'const event = { ... }'
				// then this is not a DOM event
				if (
					node.id &&
					node.id.type === 'Identifier' &&
					node.init &&
					(node.init.type === 'ObjectExpression' ||
						node.init.type === 'NewExpression' ||
						node.init.type === 'CallExpression')
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
		};
	};

	return {
		functionsWithAwait,
		functionStack,
		functionsInPromise,
		functionParams,
		nonEventVariables,
		isInAsyncContext,
		isLikelyEventParam,
		createListeners,
	};
}
