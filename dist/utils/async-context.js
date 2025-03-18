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
    // Track parameter names and their function scopes
    const parameterScopes = new Map();
    // Track parent-child relationships between functions
    const parentFunctions = new WeakMap();
    // Helper function to collect parameter names
    const collectParamNames = (params, functionNode) => {
        const paramNames = new Set();
        params.forEach((param) => {
            if (param.type === 'Identifier') {
                paramNames.add(param.name);
                // Track this parameter and its function scope
                if (!parameterScopes.has(param.name)) {
                    parameterScopes.set(param.name, []);
                }
                const scopes = parameterScopes.get(param.name) || [];
                scopes.push(functionNode);
                parameterScopes.set(param.name, scopes);
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
    // Check if a variable name is a parameter in any function in the current scope
    const isParameterInScope = (name) => {
        // If not tracked as a parameter anywhere, return false
        if (!parameterScopes.has(name)) {
            return false;
        }
        // Get all function nodes where this is a parameter
        const paramScopes = parameterScopes.get(name) || [];
        // Check if any of those function nodes are in our current scope
        for (const func of functionStack) {
            if (paramScopes.includes(func)) {
                return true;
            }
        }
        // For nested functions, check for parameter inheritance from parent scopes
        if (functionStack.length > 0) {
            const currentFunc = functionStack[functionStack.length - 1];
            // Check if any of the parameter's scopes are ancestors of the current function
            for (const paramFunc of paramScopes) {
                // Check if the parameter function is an ancestor of the current function
                // This is a simple approximation - in a real implementation we'd traverse the AST
                if (functionStack.includes(paramFunc)) {
                    return true;
                }
            }
        }
        return false;
    };
    // Helper to check if a variable is derived from an event parameter
    const isDerivedFromEventParam = (name) => {
        // Check if this is an alias of an event parameter
        let current = name;
        const visited = new Set();
        while (eventAliases.has(current) && !visited.has(current)) {
            visited.add(current);
            current = eventAliases.get(current);
            // If we found an event parameter in the chain, check if it's a parameter in scope
            if (isLikelyEventParam(current) && isParameterInScope(current)) {
                return true;
            }
        }
        return false;
    };
    // Method to check if we're in an async context and report if necessary
    const isInAsyncContext = (objectName, messageId, node, context, data) => {
        // First check if this is actually a parameter or derived from a parameter
        // If it's not a parameter, we don't want to report it regardless of async context
        if (!isParameterInScope(objectName) && !isDerivedFromEventParam(objectName)) {
            return false;
        }
        // Also check if this looks like an event parameter name - if not, don't report
        // This prevents flagging non-event parameters like "data" in async functions
        if (!isLikelyEventParam(objectName) && !isDerivedFromEventParam(objectName)) {
            return false;
        }
        // Look for an async function with await in the stack
        let foundAsyncAwait = false;
        let asyncAwaitFunction = null;
        // Check each function in the stack, starting from the outermost
        for (let i = 0; i < functionStack.length; i++) {
            const func = functionStack[i];
            if (functionsWithAwait.get(func)) {
                foundAsyncAwait = true;
                asyncAwaitFunction = func;
                break;
            }
        }
        // If we found an async function with await
        if (foundAsyncAwait && asyncAwaitFunction) {
            // Check if the event parameter comes from this function or an outer scope
            const paramScopes = parameterScopes.get(objectName) || [];
            // The event param could be:
            // 1. Directly from the async function with await
            // 2. From a parent function of the async function
            // 3. From a parent function of the current function
            for (const paramFunc of paramScopes) {
                // If the parameter is from the async function or a parent, report it
                if (paramFunc === asyncAwaitFunction ||
                    functionStack.indexOf(paramFunc) < functionStack.indexOf(asyncAwaitFunction)) {
                    context.report({
                        node,
                        messageId,
                        data,
                    });
                    return true;
                }
            }
            // If the variable is derived from an event parameter, also report it
            if (isDerivedFromEventParam(objectName)) {
                context.report({
                    node,
                    messageId,
                    data,
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
            // Again, only report if it's actually an event parameter
            const paramScopes = parameterScopes.get(objectName) || [];
            if (paramScopes.length > 0 || isDerivedFromEventParam(objectName)) {
                context.report({
                    node,
                    messageId,
                    data,
                });
                return true;
            }
        }
        return false;
    };
    // Create all the common listeners for tracking async context
    const createListeners = () => {
        return {
            // Enter an async function or method
            'FunctionDeclaration[async=true]': (node) => {
                // Track parent-child relationship if we're inside another function
                if (functionStack.length > 0) {
                    const parentFunction = functionStack[functionStack.length - 1];
                    parentFunctions.set(node, parentFunction);
                }
                functionStack.push(node);
                functionsWithAwait.set(node, false);
                // Track parameter names
                const params = collectParamNames(node.params, node);
                functionParams.set(node, params);
            },
            'FunctionExpression[async=true]': (node) => {
                // Track parent-child relationship if we're inside another function
                if (functionStack.length > 0) {
                    const parentFunction = functionStack[functionStack.length - 1];
                    parentFunctions.set(node, parentFunction);
                }
                functionStack.push(node);
                functionsWithAwait.set(node, false);
                // Track parameter names
                const params = collectParamNames(node.params, node);
                functionParams.set(node, params);
            },
            'ArrowFunctionExpression[async=true]': (node) => {
                // Track parent-child relationship if we're inside another function
                if (functionStack.length > 0) {
                    const parentFunction = functionStack[functionStack.length - 1];
                    parentFunctions.set(node, parentFunction);
                }
                functionStack.push(node);
                functionsWithAwait.set(node, false);
                // Track parameter names
                const params = collectParamNames(node.params, node);
                functionParams.set(node, params);
            },
            // Track non-async functions as well, for promise chains
            FunctionDeclaration: (node) => {
                if (!node.async) {
                    // Track parent-child relationship if we're inside another function
                    if (functionStack.length > 0) {
                        const parentFunction = functionStack[functionStack.length - 1];
                        parentFunctions.set(node, parentFunction);
                    }
                    functionStack.push(node);
                    // Track parameter names
                    const params = collectParamNames(node.params, node);
                    functionParams.set(node, params);
                }
            },
            FunctionExpression: (node) => {
                if (!node.async) {
                    // Track parent-child relationship if we're inside another function
                    if (functionStack.length > 0) {
                        const parentFunction = functionStack[functionStack.length - 1];
                        parentFunctions.set(node, parentFunction);
                    }
                    functionStack.push(node);
                    // Track parameter names
                    const params = collectParamNames(node.params, node);
                    functionParams.set(node, params);
                }
            },
            ArrowFunctionExpression: (node) => {
                if (!node.async) {
                    // Track parent-child relationship if we're inside another function
                    if (functionStack.length > 0) {
                        const parentFunction = functionStack[functionStack.length - 1];
                        parentFunctions.set(node, parentFunction);
                    }
                    functionStack.push(node);
                    // Track parameter names
                    const params = collectParamNames(node.params, node);
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
                        // Only consider it an alias if it's a parameter in scope or derived from one
                        if ((isLikelyEventParam(sourceName) && isParameterInScope(sourceName)) ||
                            eventAliases.has(sourceName)) {
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
        parameterScopes,
        isInAsyncContext,
        isLikelyEventParam,
        isDerivedFromEventParam,
        isParameterInScope,
        createListeners,
    };
}
