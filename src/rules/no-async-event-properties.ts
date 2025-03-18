import type { Rule } from 'eslint';
import type { MemberExpression, CallExpression } from 'estree';
import { createAsyncContextTracker } from '../utils/async-context';

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
const noAsyncEventProperties: Rule.RuleModule = {
	meta: {
		type: 'problem',
		docs: {
			description:
				'Disallow using specified event properties/methods after an await expression or in promise chains',
			recommended: true,
			url: 'https://github.com/eslint-community/eslint-plugin-async-event',
		},
		messages: {
			noAsyncEventProperties:
				"Don't access event.{{property}} after an await or in promise chains. Access event properties or call methods before async operations.",
		},
		schema: [
			{
				type: 'object',
				properties: {
					properties: {
						type: 'array',
						items: {
							type: 'string',
						},
					},
					eventPatterns: {
						type: 'array',
						items: {
							type: 'string',
						},
					},
				},
				additionalProperties: false,
			},
		],
	},

	create(context) {
		// Default disallowed event properties/methods
		const DEFAULT_DISALLOWED_PROPS = [
			'preventDefault',
			'stopPropagation',
			'stopImmediatePropagation',
			'currentTarget',
		];

		// Get user-configured properties or use defaults
		const options = context.options[0] || {};
		const disallowedProps: string[] = options.properties || DEFAULT_DISALLOWED_PROPS;

		// Create a tracker for managing async context
		const tracker = createAsyncContextTracker();

		// Configure event detection if provided
		if (options.eventPatterns) {
			const patterns: string[] = options.eventPatterns;

			// Only update if we have at least one pattern
			if (patterns.length > 0) {
				tracker.setEventDetectionConfig({ patterns });
			}
		}

		// Get the base listeners for tracking async context
		const baseListeners = tracker.createListeners(context);

		// Track nodes that have already been reported to avoid duplicates
		const reportedNodes = new WeakSet<MemberExpression>();

		// Add our specific listeners for checking event property access
		const listeners = {
			...baseListeners,

			// Check for event property access or method calls like event.currentTarget or event.preventDefault()
			MemberExpression: (node: MemberExpression) => {
				// Skip if this node has already been reported
				if (reportedNodes.has(node)) {
					return;
				}

				const property = node.property;

				// Only check for specified property/method access
				if (
					property.type === 'Identifier' &&
					disallowedProps.includes(property.name) &&
					!node.computed // Ensure it's a dot notation and not obj['property']
				) {
					// We need to check if this is an event property reference
					// or it could be some other object with the same property
					let isEventObject = false;
					let objectName: string | null = null;

					// Try to determine if this object is likely an event object (like event.currentTarget)
					if (node.object.type === 'Identifier') {
						objectName = node.object.name;

						// Only proceed if this is a function parameter or derived from one
						if (
							tracker.isParameterInScope(objectName) ||
							tracker.isDerivedFromEventParam(objectName)
						) {
							// Check if it's likely an event parameter
							if (
								tracker.isLikelyEventParam(objectName) ||
								tracker.isDerivedFromEventParam(objectName)
							) {
								// Skip if this variable is known not to be a DOM event
								if (!tracker.nonEventVariables.has(objectName)) {
									isEventObject = true;
								}
							}
						}
					}

					if (isEventObject && objectName) {
						// Check if we're in an async context and report if necessary
						const reported = tracker.isInAsyncContext(
							objectName,
							'noAsyncEventProperties',
							node,
							context,
							{ property: property.name },
						);

						if (reported) {
							reportedNodes.add(node);
						}
					}
				}
			},

			// Also check method calls to catch event.preventDefault(), etc.
			CallExpression: (node: CallExpression & Rule.NodeParentExtension) => {
				// Run the base CallExpression handler to track promise chains
				if (baseListeners.CallExpression) {
					// Call the base listener
					baseListeners.CallExpression(node);
				}

				// We only check if the callee is a MemberExpression
				if (node.callee.type === 'MemberExpression') {
					// Delegate to the MemberExpression handler since that's where
					// we need to check for event.preventDefault() etc.
					// This avoids duplicating logic
					const memberExpr = node.callee;

					// Skip if this MemberExpression has already been reported
					if (reportedNodes.has(memberExpr)) {
						return;
					}

					// We will handle it in the MemberExpression case above
					listeners.MemberExpression(memberExpr);
				}
			},
		};

		return listeners;
	},
};

export default noAsyncEventProperties;
