"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const no_async_event_properties_1 = __importDefault(require("./rules/no-async-event-properties"));
const no_async_event_reference_1 = __importDefault(require("./rules/no-async-event-reference"));
module.exports = {
    rules: {
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
            },
        },
    },
};
