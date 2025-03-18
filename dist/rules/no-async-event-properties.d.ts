import type { Rule } from 'eslint';
/**
 * Rule to detect usage of problematic event properties and methods
 * (like currentTarget, preventDefault, stopPropagation, stopImmediatePropagation)
 * inside an async function after an await expression or inside promise chain
 * methods (.then, .catch, .finally).
 *
 * This is important because event objects and their methods may not behave as expected
 * when used asynchronously. Using these features after an await or in a promise chain
 * can lead to incorrect behavior or errors.
 */
declare const noAsyncEventProperties: Rule.RuleModule;
export default noAsyncEventProperties;
