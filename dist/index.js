"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const no_async_current_target_1 = __importDefault(require("./rules/no-async-current-target"));
const no_async_event_methods_1 = __importDefault(require("./rules/no-async-event-methods"));
const no_async_event_properties_1 = __importDefault(require("./rules/no-async-event-properties"));
const no_async_event_reference_1 = __importDefault(require("./rules/no-async-event-reference"));
module.exports = {
    rules: {
        // Deprecated rules (will be removed in a future version)
        'no-async-current-target': {
            ...no_async_current_target_1.default,
            meta: {
                ...no_async_current_target_1.default.meta,
                deprecated: true,
                replacedBy: ['no-async-event-properties'],
            },
        },
        'no-async-event-methods': {
            ...no_async_event_methods_1.default,
            meta: {
                ...no_async_event_methods_1.default.meta,
                deprecated: true,
                replacedBy: ['no-async-event-properties'],
            },
        },
        // Active rules
        'no-async-event-properties': no_async_event_properties_1.default,
        'no-async-event-reference': no_async_event_reference_1.default,
    },
    configs: {
        recommended: {
            plugins: ['async-event'],
            rules: {
                // Use the new combined rule instead of the individual ones
                'async-event/no-async-event-properties': 'error',
                'async-event/no-async-event-reference': 'error',
                // Keep old rules but mark as 'off' for backward compatibility
                'async-event/no-async-current-target': 'off',
                'async-event/no-async-event-methods': 'off',
            },
        },
    },
};
