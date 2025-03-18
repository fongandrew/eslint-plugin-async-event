"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const async_context_1 = require("../utils/async-context");
/**
 * Rule to detect usage of `.currentTarget` inside an async function after an await expression
 * or inside promise chain methods (.then, .catch, .finally).
 *
 * This is important because in delegated event handlers, the value of `.currentTarget` is
 * redefined as the event synchronously bubbles. Using `.currentTarget` after an await or
 * in a promise chain can lead to incorrect values or errors.
 */
const noAsyncCurrentTarget = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Disallow using .currentTarget after an await expression or in promise chains',
            recommended: true,
            url: 'https://github.com/eslint-community/eslint-plugin-async-event',
        },
        messages: {
            noAsyncCurrentTarget: "Don't use .currentTarget after an await or in promise chains. Store its value in a variable before async operations.",
        },
        schema: [],
    },
    create(context) {
        // Create a tracker for managing async context
        const tracker = (0, async_context_1.createAsyncContextTracker)();
        // Get the base listeners for tracking async context
        const baseListeners = tracker.createListeners(context);
        // Add our specific listener for checking .currentTarget access
        const listeners = {
            ...baseListeners,
            // Check .currentTarget access
            MemberExpression: (node) => {
                const property = node.property;
                // Only check for .currentTarget access
                if (property.type === 'Identifier' &&
                    property.name === 'currentTarget' &&
                    !node.computed // Ensure it's a dot notation and not obj['currentTarget']
                ) {
                    // We need to check if this is an event.currentTarget reference
                    // or it could be some other object with a currentTarget property
                    let isEventObject = false;
                    let objectName = null;
                    // Try to determine if this object is likely an event object (like event.currentTarget)
                    if (node.object.type === 'Identifier') {
                        objectName = node.object.name;
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
                        tracker.isInAsyncContext(objectName, 'noAsyncCurrentTarget', node, context);
                    }
                }
            },
        };
        return listeners;
    },
};
exports.default = noAsyncCurrentTarget;
