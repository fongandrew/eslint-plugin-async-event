import type { Rule } from 'eslint';
/**
 * Rule to detect usage of event methods (preventDefault, stopPropagation, stopImmediatePropagation)
 * inside an async function after an await expression or inside promise chain methods (.then, .catch, .finally).
 *
 * This is important because event methods don't perform as expected when called asynchronously.
 * Using these methods after an await or in a promise chain can lead to incorrect behavior or errors.
 */
declare const noAsyncEventMethods: Rule.RuleModule;
export default noAsyncEventMethods;
