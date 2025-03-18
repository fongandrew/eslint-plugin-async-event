import type { Rule } from 'eslint';
import type { Node } from 'estree';
export interface AsyncContextTracker {
    functionsWithAwait: WeakMap<Node, boolean>;
    functionStack: Node[];
    functionsInPromise: WeakSet<Node>;
    functionParams: WeakMap<Node, Set<string>>;
    nonEventVariables: Set<string>;
    eventAliases: Map<string, string>;
    isInAsyncContext(objectName: string, messageId: string, node: Node, context: Rule.RuleContext): boolean;
    isLikelyEventParam(name: string): boolean;
    isDerivedFromEventParam(name: string): boolean;
    createListeners(context: Rule.RuleContext): Rule.RuleListener;
}
/**
 * Creates a tracker to manage async context for event-related linting rules.
 * This handles tracking functions, await statements, promise chains, and determining
 * when event references are being used after asynchronous operations.
 */
export declare function createAsyncContextTracker(): AsyncContextTracker;
