"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const eslint_1 = require("eslint");
const no_async_event_methods_1 = __importDefault(require("./no-async-event-methods"));
// Configure Rule Tester for ESLint 9+
const ruleTester = new eslint_1.RuleTester({
    languageOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
    },
});
ruleTester.run('no-async-event-methods', no_async_event_methods_1.default, {
    valid: [
        // Regular function with event methods is fine
        `function handler(event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }`,
        // Async function with event methods before await is fine
        `async function handler(event) {
      event.preventDefault();
      await fetch('/api');
      console.log('Done');
    }`,
        // Async function with event methods before await is fine (multiple methods)
        `async function handler(event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      await fetch('/api');
      console.log('Done');
    }`,
        // Async arrow function with event methods before await is fine
        `const handler = async (event) => {
      event.preventDefault();
      await Promise.resolve();
    }`,
        // Async method with event methods before await is fine
        `class Component {
      async handleEvent(event) {
        event.preventDefault();
        await this.doSomething();
      }
    }`,
        // Call similar methods on other objects is fine
        `async function handler(event) {
      const obj = { preventDefault: () => {}, stopPropagation: () => {} };
      await fetch('/api');
      obj.preventDefault();
      obj.stopPropagation();
    }`,
        // Calling event methods before promise chain is fine
        `function handler(event) {
      event.preventDefault();
      fetchData().then(() => {
        console.log('Done');
      });
    }`,
        // Using 'event' parameter in promise chain that is NOT from outside scope is fine
        `function handler() {
      fetchData().then((event) => {
        event.preventDefault();
      });
    }`,
        // Using an object called 'event' with similar methods in promise chain is fine
        `function handler() {
      const event = { preventDefault: () => {}, stopPropagation: () => {} };
      fetchData().then(() => {
        event.preventDefault();
      });
    }`,
        // External event variable (not a parameter) used after await is fine
        `async function handler() {
      await Promise.resolve();
      event.preventDefault();
    }`,
        // External event variable used in promise chain is fine
        `function handler() {
      fetchData().then(() => {
        event.stopPropagation();
      });
    }`,
    ],
    invalid: [
        // Basic case - calling preventDefault after await
        {
            code: `async function handler(event) {
        await fetch('/api');
        event.preventDefault();
      }`,
            errors: [{ messageId: 'noAsyncEventMethods' }],
        },
        // Basic case - calling stopPropagation after await
        {
            code: `async function handler(event) {
        await fetch('/api');
        event.stopPropagation();
      }`,
            errors: [{ messageId: 'noAsyncEventMethods' }],
        },
        // Basic case - calling stopImmediatePropagation after await
        {
            code: `async function handler(event) {
        await fetch('/api');
        event.stopImmediatePropagation();
      }`,
            errors: [{ messageId: 'noAsyncEventMethods' }],
        },
        // Arrow function - calling event method after await
        {
            code: `const handler = async (event) => {
        await Promise.resolve();
        event.preventDefault();
      }`,
            errors: [{ messageId: 'noAsyncEventMethods' }],
        },
        // Method - calling event method after await
        {
            code: `class Component {
        async handleEvent(event) {
          await this.doSomething();
          event.preventDefault();
        }
      }`,
            errors: [{ messageId: 'noAsyncEventMethods' }],
        },
        // Multiple awaits - calling event method after any await
        {
            code: `async function handler(event) {
        await Promise.resolve();
        await Promise.resolve();
        event.preventDefault();
      }`,
            errors: [{ messageId: 'noAsyncEventMethods' }],
        },
        // Multiple event method calls after await - should report each
        {
            code: `async function handler(event) {
        await Promise.resolve();
        event.preventDefault();
        event.stopPropagation();
      }`,
            errors: [{ messageId: 'noAsyncEventMethods' }, { messageId: 'noAsyncEventMethods' }],
        },
        // Using in nested block after await
        {
            code: `async function handler(event) {
        await Promise.resolve();
        if (true) {
          event.preventDefault();
        }
      }`,
            errors: [{ messageId: 'noAsyncEventMethods' }],
        },
        // Promise chain .then - calling event method inside .then
        {
            code: `function handler(event) {
        fetchData().then(() => {
          event.preventDefault();
        });
      }`,
            errors: [{ messageId: 'noAsyncEventMethods' }],
        },
        // Promise chain .catch - calling event method inside .catch
        {
            code: `function handler(event) {
        fetchData()
          .then(() => {
            // Some code
          })
          .catch(() => {
            event.preventDefault();
          });
      }`,
            errors: [{ messageId: 'noAsyncEventMethods' }],
        },
        // Promise chain .finally - calling event method inside .finally
        {
            code: `function handler(event) {
        fetchData()
          .then(() => {
            // Some code
          })
          .finally(() => {
            event.preventDefault();
          });
      }`,
            errors: [{ messageId: 'noAsyncEventMethods' }],
        },
        // Nested promise chain - calling event method inside nested .then
        {
            code: `function handler(event) {
        fetchData().then(() => {
          return anotherFetch().then(() => {
            event.preventDefault();
          });
        });
      }`,
            errors: [{ messageId: 'noAsyncEventMethods' }],
        },
        // Using with e param name
        {
            code: `function handler(e) {
        fetchData().then(() => {
          e.preventDefault();
        });
      }`,
            errors: [{ messageId: 'noAsyncEventMethods' }],
        },
        // Using with ev param name
        {
            code: `function handler(ev) {
        fetchData().then(() => {
          ev.stopPropagation();
        });
      }`,
            errors: [{ messageId: 'noAsyncEventMethods' }],
        },
        // Using event parameter in embedded function after await is NOT valid
        {
            code: `async function handler(event) {
        await Promise.resolve();
        (() => {
          event.stopPropagation();
        })();
      }`,
            errors: [{ messageId: 'noAsyncEventMethods' }],
        },
    ],
});
