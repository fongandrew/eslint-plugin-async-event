import type { Rule } from 'eslint';
/**
 * Rule to detect usage of `.currentTarget` inside an async function after an await expression
 * or inside promise chain methods (.then, .catch, .finally).
 *
 * This is important because in delegated event handlers, the value of `.currentTarget` is
 * redefined as the event synchronously bubbles. Using `.currentTarget` after an await or
 * in a promise chain can lead to incorrect values or errors.
 */
declare const noAsyncCurrentTarget: Rule.RuleModule;
export default noAsyncCurrentTarget;
