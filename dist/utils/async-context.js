"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAsyncContextTracker = createAsyncContextTracker;
/**
 * Creates a tracker to manage async context for event-related linting rules.
 * This handles tracking functions, await statements, promise chains, and determining
 * when event references are being used after asynchronous operations.
 */
function createAsyncContextTracker() {
    // Track functions and whether they have encountered an await
    const functionsWithAwait = new WeakMap();
    // Current function stack
    const functionStack = [];
    // Track functions that are inside promise chain methods
    const functionsInPromise = new WeakSet();
    // Track parameters of functions to know which variables are defined within a function
    const functionParams = new WeakMap();
    // Track variables that are not DOM events (e.g., custom events created within the function)
    const nonEventVariables = new Set();
    // Track variables that are aliases of event parameters (e.g., const savedEvent = event)
    const eventAliases = new Map();
    // Helper function to collect parameter names
    const collectParamNames = (params) => {
        const paramNames = new Set();
        params.forEach((param) => {
            if (param.type === 'Identifier') {
                paramNames.add(param.name);
            }
        });
        return paramNames;
    };
    // Helper to check if a variable name is likely an event parameter
    const isLikelyEventParam = (name) => {
        return (name === 'event' ||
            name === 'e' ||
            name === 'ev' ||
            name.endsWith('Event'));
    };
    // Helper to check if a variable is derived from an event parameter
    const isDerivedFromEventParam = (name) => {
        // Check if this is an alias of an event parameter
        let current = name;
        let visited = new Set();
        while (eventAliases.has(current) && !visited.has(current)) {
            visited.add(current);
            current = eventAliases.get(current);
            // If we found an event parameter in the chain, return true
            if (isLikelyEventParam(current)) {
                // Check if this is a parameter in any function in the stack
                for (const func of functionStack) {
                    const params = functionParams.get(func) || new Set();
                    if (params.has(current)) {
                        return true;
                    }
                }
            }
        }
        return false;
    };
    // Method to check if we're in an async context and report if necessary
    const isInAsyncContext = (objectName, messageId, node, context) => {
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
    const createListeners = () => {
        return {
            // Enter an async function or method
            'FunctionDeclaration[async=true]': (node) => {
                functionStack.push(node);
                functionsWithAwait.set(node, false);
                // Track parameter names
                const params = collectParamNames(node.params);
                functionParams.set(node, params);
            },
            'FunctionExpression[async=true]': (node) => {
                functionStack.push(node);
                functionsWithAwait.set(node, false);
                // Track parameter names
                const params = collectParamNames(node.params);
                functionParams.set(node, params);
            },
            'ArrowFunctionExpression[async=true]': (node) => {
                functionStack.push(node);
                functionsWithAwait.set(node, false);
                // Track parameter names
                const params = collectParamNames(node.params);
                functionParams.set(node, params);
            },
            // Track non-async functions as well, for promise chains
            FunctionDeclaration: (node) => {
                if (!node.async) {
                    functionStack.push(node);
                    // Track parameter names
                    const params = collectParamNames(node.params);
                    functionParams.set(node, params);
                }
            },
            FunctionExpression: (node) => {
                if (!node.async) {
                    functionStack.push(node);
                    // Track parameter names
                    const params = collectParamNames(node.params);
                    functionParams.set(node, params);
                }
            },
            ArrowFunctionExpression: (node) => {
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
            // Track variable declarations
            VariableDeclarator: (node) => {
                if (node.id && node.id.type === 'Identifier' && node.init) {
                    const varName = node.id.name;
                    // Track non-DOM events (objects, new expressions, function calls)
                    if (node.init.type === 'ObjectExpression' ||
                        node.init.type === 'NewExpression' ||
                        node.init.type === 'CallExpression') {
                        nonEventVariables.add(varName);
                    }
                    // Track event aliases (savedEvent = event)
                    if (node.init.type === 'Identifier') {
                        const sourceName = node.init.name;
                        if (isLikelyEventParam(sourceName) || eventAliases.has(sourceName)) {
                            // Record this as an alias pointing to the source
                            eventAliases.set(varName, sourceName);
                        }
                    }
                }
            },
            // Detect callback functions in promise chains (.then, .catch, .finally)
            CallExpression: (node) => {
                if (node.callee.type === 'MemberExpression' &&
                    node.callee.property.type === 'Identifier' &&
                    ['then', 'catch', 'finally'].includes(node.callee.property.name)) {
                    // Mark all callback functions as being in a promise chain
                    node.arguments.forEach((arg) => {
                        if (arg.type === 'FunctionExpression' ||
                            arg.type === 'ArrowFunctionExpression') {
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
        eventAliases,
        isInAsyncContext,
        isLikelyEventParam,
        isDerivedFromEventParam,
        createListeners,
    };
}
