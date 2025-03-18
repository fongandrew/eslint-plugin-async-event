"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const no_async_current_target_1 = __importDefault(require("./rules/no-async-current-target"));
const no_async_event_methods_1 = __importDefault(require("./rules/no-async-event-methods"));
const no_async_event_reference_1 = __importDefault(require("./rules/no-async-event-reference"));
module.exports = {
    rules: {
        'no-async-current-target': no_async_current_target_1.default,
        'no-async-event-methods': no_async_event_methods_1.default,
        'no-async-event-reference': no_async_event_reference_1.default,
    },
    configs: {
        recommended: {
            plugins: ['async-event'],
            rules: {
                'async-event/no-async-current-target': 'error',
                'async-event/no-async-event-methods': 'error',
                'async-event/no-async-event-reference': 'error',
            },
        },
    },
};
