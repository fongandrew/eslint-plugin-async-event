"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const eslint_1 = require("eslint");
const no_async_event_properties_1 = __importDefault(require("./no-async-event-properties"));
// Configure Rule Tester for ESLint 9+
const ruleTester = new eslint_1.RuleTester({
    languageOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
    },
});
ruleTester.run('no-async-event-properties', no_async_event_properties_1.default, {
    valid: [
        // Regular function with event methods and properties is fine
        `function handler(event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      console.log(event.currentTarget);
    }`,
        // Async function with event methods and properties before await is fine
        `async function handler(event) {
      event.preventDefault();
      console.log(event.currentTarget);
      await fetch('/api');
      console.log('Done');
    }`,
        // Async function with accessing non-disallowed properties after await is fine
        `async function handler(event) {
      await fetch('/api');
      console.log(event.target);
      console.log(event.type);
    }`,
        // Async arrow function with event methods and properties before await is fine
        `const handler = async (event) => {
      event.preventDefault();
      console.log(event.currentTarget);
      await Promise.resolve();
    }`,
        // Async method with event methods and properties before await is fine
        `class Component {
      async handleEvent(event) {
        event.preventDefault();
        console.log(event.currentTarget);
        await this.doSomething();
      }
    }`,
        // Call similar methods on other objects is fine
        `async function handler(event) {
      const obj = { preventDefault: () => {}, stopPropagation: () => {}, currentTarget: 'test' };
      await fetch('/api');
      obj.preventDefault();
      obj.stopPropagation();
      console.log(obj.currentTarget);
    }`,
        // Calling event methods and accessing properties before promise chain is fine
        `function handler(event) {
      event.preventDefault();
      console.log(event.currentTarget);
      fetchData().then(() => {
        console.log('Done');
      });
    }`,
        // Using 'event' parameter in promise chain that is NOT from outside scope is fine
        `function handler() {
      fetchData().then((event) => {
        event.preventDefault();
        console.log(event.currentTarget);
      });
    }`,
        // Using an object called 'event' with similar methods and properties is fine
        `function handler() {
      const event = { 
        preventDefault: () => {}, 
        stopPropagation: () => {}, 
        currentTarget: 'test' 
      };
      fetchData().then(() => {
        event.preventDefault();
        console.log(event.currentTarget);
      });
    }`,
        // External event variable (not a parameter) used after await is fine
        `async function handler() {
      await Promise.resolve();
      event.preventDefault();
      console.log(event.currentTarget);
    }`,
        // External event variable used in promise chain is fine
        `function handler() {
      fetchData().then(() => {
        event.stopPropagation();
        console.log(event.currentTarget);
      });
    }`,
        // Custom configuration - only checking specific properties
        {
            code: `async function handler(event) {
        event.preventDefault();
        console.log(event.currentTarget);
        await fetch('/api');
        // After await is fine with custom config:
        console.log(event.currentTarget); // This shouldn't report with custom config that excludes currentTarget
      }`,
            options: [{ properties: ['preventDefault', 'stopPropagation'] }],
        },
    ],
    invalid: [
        // Basic case - accessing disallowed property/method after await
        {
            code: `async function handler(event) {
        await fetch('/api');
        event.preventDefault();
      }`,
            errors: [
                {
                    messageId: 'noAsyncEventProperties',
                    data: { property: 'preventDefault' },
                },
            ],
        },
        // Accessing currentTarget after await
        {
            code: `async function handler(event) {
        await fetch('/api');
        console.log(event.currentTarget);
      }`,
            errors: [
                {
                    messageId: 'noAsyncEventProperties',
                    data: { property: 'currentTarget' },
                },
            ],
        },
        // Multiple disallowed properties/methods after await
        {
            code: `async function handler(event) {
        await Promise.resolve();
        event.preventDefault();
        event.stopPropagation();
        console.log(event.currentTarget);
      }`,
            errors: [
                { messageId: 'noAsyncEventProperties', data: { property: 'preventDefault' } },
                { messageId: 'noAsyncEventProperties', data: { property: 'stopPropagation' } },
                { messageId: 'noAsyncEventProperties', data: { property: 'currentTarget' } },
            ],
        },
        // Arrow function - accessing disallowed property/method after await
        {
            code: `const handler = async (event) => {
        await Promise.resolve();
        event.preventDefault();
      }`,
            errors: [
                {
                    messageId: 'noAsyncEventProperties',
                    data: { property: 'preventDefault' },
                },
            ],
        },
        // Method - accessing disallowed property/method after await
        {
            code: `class Component {
        async handleEvent(event) {
          await this.doSomething();
          event.preventDefault();
        }
      }`,
            errors: [
                {
                    messageId: 'noAsyncEventProperties',
                    data: { property: 'preventDefault' },
                },
            ],
        },
        // Multiple awaits - accessing disallowed property/method after any await
        {
            code: `async function handler(event) {
        await Promise.resolve();
        await Promise.resolve();
        event.preventDefault();
      }`,
            errors: [
                {
                    messageId: 'noAsyncEventProperties',
                    data: { property: 'preventDefault' },
                },
            ],
        },
        // Using in nested block after await
        {
            code: `async function handler(event) {
        await Promise.resolve();
        if (true) {
          event.preventDefault();
        }
      }`,
            errors: [
                {
                    messageId: 'noAsyncEventProperties',
                    data: { property: 'preventDefault' },
                },
            ],
        },
        // Promise chain .then - accessing disallowed property/method inside .then
        {
            code: `function handler(event) {
        fetchData().then(() => {
          event.preventDefault();
        });
      }`,
            errors: [
                {
                    messageId: 'noAsyncEventProperties',
                    data: { property: 'preventDefault' },
                },
            ],
        },
        // Promise chain with property access
        {
            code: `function handler(event) {
        fetchData().then(() => {
          console.log(event.currentTarget);
        });
      }`,
            errors: [
                {
                    messageId: 'noAsyncEventProperties',
                    data: { property: 'currentTarget' },
                },
            ],
        },
        // Using with different event parameter names
        {
            code: `function handler(e) {
        fetchData().then(() => {
          e.preventDefault();
        });
      }`,
            errors: [
                {
                    messageId: 'noAsyncEventProperties',
                    data: { property: 'preventDefault' },
                },
            ],
        },
        // Using event parameter in embedded function after await
        {
            code: `async function handler(event) {
        await Promise.resolve();
        (() => {
          event.preventDefault();
          console.log(event.currentTarget);
        })();
      }`,
            errors: [
                { messageId: 'noAsyncEventProperties', data: { property: 'preventDefault' } },
                { messageId: 'noAsyncEventProperties', data: { property: 'currentTarget' } },
            ],
        },
        // Custom configuration with properties not in default list
        {
            code: `async function handler(event) {
        await fetch('/api');
        event.bubbles(); // Not in the default list, but in our custom list
      }`,
            options: [{ properties: ['bubbles'] }],
            errors: [
                {
                    messageId: 'noAsyncEventProperties',
                    data: { property: 'bubbles' },
                },
            ],
        },
        // Custom configuration excluding some default properties
        {
            code: `async function handler(event) {
        await fetch('/api');
        event.preventDefault(); // Should be reported - in custom list
        console.log(event.currentTarget); // Should not be reported - not in custom list
      }`,
            options: [{ properties: ['preventDefault', 'stopPropagation'] }],
            errors: [
                {
                    messageId: 'noAsyncEventProperties',
                    data: { property: 'preventDefault' },
                },
            ],
        },
    ],
});
