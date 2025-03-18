"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const eslint_1 = require("eslint");
const no_async_current_target_1 = __importDefault(require("./no-async-current-target"));
// Configure Rule Tester for ESLint 9+
const ruleTester = new eslint_1.RuleTester({
    languageOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
    },
});
ruleTester.run('no-async-current-target', no_async_current_target_1.default, {
    valid: [
        // Regular function with currentTarget is fine
        `function handler(event) {
      console.log(event.currentTarget);
    }`,
        // Async function with currentTarget before await is fine
        `async function handler(event) {
      const target = event.currentTarget;
      await fetch('/api');
      console.log(target);
    }`,
        // Async arrow function with currentTarget before await is fine
        `const handler = async (event) => {
      console.log(event.currentTarget);
      await Promise.resolve();
    }`,
        // Async method with currentTarget before await is fine
        `class Component {
      async handleEvent(event) {
        console.log(event.currentTarget);
        await this.doSomething();
      }
    }`,
        // Any other property is fine even after await
        `async function handler(event) {
      await fetch('/api');
      console.log(event.target);
    }`,
        // Access other object with currentTarget property after await is fine
        `async function handler(event) {
      const obj = { currentTarget: 'test' };
      await fetch('/api');
      console.log(obj.currentTarget);
    }`,
        // Storing currentTarget before promise chain is fine
        `function handler(event) {
      const target = event.currentTarget;
      fetchData().then(() => {
        console.log(target);
      });
    }`,
        // Using 'event' parameter in promise chain that is NOT from outside scope is fine
        `function handler() {
      fetchData().then((event) => {
        console.log(event.currentTarget);
      });
    }`,
        // Using an object called 'event' with a property called 'currentTarget' in promise chain is fine
        `function handler() {
      const event = { currentTarget: 'test' };
      fetchData().then(() => {
        console.log(event.currentTarget);
      });
    }`,
        // External event variable (not a parameter) used after await is fine
        `async function handler() {
      await Promise.resolve();
      console.log(event.currentTarget);
    }`,
        // External event variable used in promise chain is fine
        `function handler() {
      fetchData().then(() => {
        console.log(event.currentTarget);
      });
    }`,
    ],
    invalid: [
        // Basic case - accessing currentTarget after await
        {
            code: `async function handler(event) {
        await fetch('/api');
        console.log(event.currentTarget);
      }`,
            errors: [{ messageId: 'noAsyncCurrentTarget' }],
        },
        // Arrow function - accessing currentTarget after await
        {
            code: `const handler = async (event) => {
        await Promise.resolve();
        return event.currentTarget;
      }`,
            errors: [{ messageId: 'noAsyncCurrentTarget' }],
        },
        // Method - accessing currentTarget after await
        {
            code: `class Component {
        async handleEvent(event) {
          await this.doSomething();
          console.log(event.currentTarget);
        }
      }`,
            errors: [{ messageId: 'noAsyncCurrentTarget' }],
        },
        // Multiple awaits - accessing currentTarget after any await
        {
            code: `async function handler(event) {
        await Promise.resolve();
        await Promise.resolve();
        console.log(event.currentTarget);
      }`,
            errors: [{ messageId: 'noAsyncCurrentTarget' }],
        },
        // Using in expression after await
        {
            code: `async function handler(event) {
        await Promise.resolve();
        const id = event.currentTarget.id;
      }`,
            errors: [{ messageId: 'noAsyncCurrentTarget' }],
        },
        // Using in nested block after await
        {
            code: `async function handler(event) {
        await Promise.resolve();
        if (true) {
          console.log(event.currentTarget);
        }
      }`,
            errors: [{ messageId: 'noAsyncCurrentTarget' }],
        },
        // Using in nested async function after outer function's await
        {
            code: `async function outer(event) {
        await Promise.resolve();
        console.log(event.currentTarget);
      }`,
            errors: [{ messageId: 'noAsyncCurrentTarget' }],
        },
        // NEW: Promise chain .then - accessing event.currentTarget inside .then
        {
            code: `function handler(event) {
        fetchData().then(() => {
          console.log(event.currentTarget);
        });
      }`,
            errors: [{ messageId: 'noAsyncCurrentTarget' }],
        },
        // NEW: Promise chain .catch - accessing event.currentTarget inside .catch
        {
            code: `function handler(event) {
        fetchData()
          .then(() => {
            // Some code
          })
          .catch(() => {
            console.log(event.currentTarget);
          });
      }`,
            errors: [{ messageId: 'noAsyncCurrentTarget' }],
        },
        // NEW: Promise chain .finally - accessing event.currentTarget inside .finally
        {
            code: `function handler(event) {
        fetchData()
          .then(() => {
            // Some code
          })
          .finally(() => {
            console.log(event.currentTarget);
          });
      }`,
            errors: [{ messageId: 'noAsyncCurrentTarget' }],
        },
        // NEW: Nested promise chain - accessing event.currentTarget inside nested .then
        {
            code: `function handler(event) {
        fetchData().then(() => {
          return anotherFetch().then(() => {
            console.log(event.currentTarget);
          });
        });
      }`,
            errors: [{ messageId: 'noAsyncCurrentTarget' }],
        },
        // NEW: Using in expression inside promise chain
        {
            code: `function handler(event) {
        fetchData().then(() => {
          const id = event.currentTarget.id;
        });
      }`,
            errors: [{ messageId: 'noAsyncCurrentTarget' }],
        },
        // NEW: Using in expression inside promise chain with e param name
        {
            code: `function handler(e) {
        fetchData().then(() => {
          const id = e.currentTarget.id;
        });
      }`,
            errors: [{ messageId: 'noAsyncCurrentTarget' }],
        },
        // Using event parameter in embedded function after await is NOT valid
        {
            code: `async function handler(event) {
        await Promise.resolve();
        (() => {
          console.log(event.currentTarget);
        })();
      }`,
            errors: [{ messageId: 'noAsyncCurrentTarget' }],
        },
    ],
});
