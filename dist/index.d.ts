declare const _default: {
    rules: {
        'no-async-event-properties': import("eslint").Rule.RuleModule;
        'no-async-event-reference': import("eslint").Rule.RuleModule;
    };
    configs: {
        recommended: {
            plugins: string[];
            rules: {
                'async-event/no-async-event-properties': string;
                'async-event/no-async-event-reference': string;
            };
        };
    };
};
export = _default;
