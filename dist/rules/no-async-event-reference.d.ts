import type { Rule } from 'eslint';
/**
 * Rule to detect usage of event objects inside an async function after an await expression
 * or inside promise chain methods (.then, .catch, .finally).
 *
 * This is important because event objects may not be valid or reliable when used asynchronously.
 * Using event objects after an await or in a promise chain can lead to incorrect behavior or errors.
 */
declare const noAsyncEventReference: Rule.RuleModule;
export default noAsyncEventReference;
