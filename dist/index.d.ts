declare const _default: {
    rules: {
        'no-async-current-target': {
            meta: {
                deprecated: boolean;
                replacedBy: string[];
                docs?: import("@eslint/core").RulesMetaDocs | undefined;
                type?: import("@eslint/core").RuleType | undefined;
                schema?: import("json-schema").JSONSchema4 | import("json-schema").JSONSchema4[] | false | undefined;
                defaultOptions?: unknown[];
                messages?: Record<string, string> | undefined;
                fixable?: import("@eslint/core").RuleFixType | undefined;
                hasSuggestions?: boolean | undefined;
                language?: string;
                dialects?: string[];
            };
            create(context: import("@eslint/core").RuleContext<{
                LangOptions: import("eslint").Linter.LanguageOptions;
                Code: import("eslint").SourceCode;
                RuleOptions: any[];
                Node: import("estree").Node;
                MessageIds: string;
            }>): import("eslint").Rule.NodeListener;
        };
        'no-async-event-methods': {
            meta: {
                deprecated: boolean;
                replacedBy: string[];
                docs?: import("@eslint/core").RulesMetaDocs | undefined;
                type?: import("@eslint/core").RuleType | undefined;
                schema?: import("json-schema").JSONSchema4 | import("json-schema").JSONSchema4[] | false | undefined;
                defaultOptions?: unknown[];
                messages?: Record<string, string> | undefined;
                fixable?: import("@eslint/core").RuleFixType | undefined;
                hasSuggestions?: boolean | undefined;
                language?: string;
                dialects?: string[];
            };
            create(context: import("@eslint/core").RuleContext<{
                LangOptions: import("eslint").Linter.LanguageOptions;
                Code: import("eslint").SourceCode;
                RuleOptions: any[];
                Node: import("estree").Node;
                MessageIds: string;
            }>): import("eslint").Rule.NodeListener;
        };
        'no-async-event-properties': import("eslint").Rule.RuleModule;
        'no-async-event-reference': import("eslint").Rule.RuleModule;
    };
    configs: {
        recommended: {
            plugins: string[];
            rules: {
                'async-event/no-async-event-properties': string;
                'async-event/no-async-event-reference': string;
                'async-event/no-async-current-target': string;
                'async-event/no-async-event-methods': string;
            };
        };
    };
};
export = _default;
