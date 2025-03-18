"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const eslint_1 = require("eslint");
const no_async_event_reference_1 = __importDefault(require("./no-async-event-reference"));
// Configure Rule Tester for ESLint 9+
const ruleTester = new eslint_1.RuleTester({
    languageOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
    },
});
ruleTester.run('no-async-event-reference', no_async_event_reference_1.default, {
    valid: [
        // Regular function with event reference is fine
        `function handler(event) {
      console.log(event);
      doSomethingWith(event);
    }`,
        // Async function with event reference before await is fine
        `async function handler(event) {
      console.log(event);
      doSomethingWith(event);
      await fetch('/api');
    }`,
        // Store event properties before await and use them after is fine
        `async function handler(event) {
      const target = event.target;
      const value = event.target.value;
      await fetch('/api');
      console.log(target, value);
    }`,
        // Async arrow function with event reference before await is fine
        `const handler = async (event) => {
      doSomethingWith(event);
      await Promise.resolve();
    }`,
        // Async method with event reference before await is fine
        `class Component {
      async handleEvent(event) {
        console.log(event);
        await this.doSomething();
      }
    }`,
        // Regular function with event passed to another function is fine
        `function handler(event) {
      processEvent(event);
    }`,
        // Other parameter names are not flagged
        `async function handler(data) {
      await fetch('/api');
      console.log(data);
    }`,
        // Using the event parameter in a callback inside an event handler but before await is fine
        `async function handler(event) {
      [1, 2, 3].forEach(num => {
        console.log(event, num);
      });
      await fetch('/api');
    }`,
        // Storing the event in a variable and using that after await is still valid
        // (though the event object itself might be stale, this is up to the developer)
        `async function handler(event) {
      const savedEvent = event;
      await fetch('/api');
      console.log(savedEvent);
    }`,
        // Variable called event but not an actual DOM event is fine
        `async function handler() {
      const event = { type: 'custom' };
      await fetch('/api');
      console.log(event);
    }`,
        // Variable called event returned from function is fine
        `async function handler() {
      const event = createCustomEvent();
      await fetch('/api');
      console.log(event);
    }`,
        // Using 'event' parameter in promise chain that is NOT from outside scope is fine
        `function handler() {
      fetchData().then((event) => {
        console.log(event);
      });
    }`,
        // Using the event in a callback to an immediately invoked function is fine
        `function handler(event) {
      (function() {
        console.log(event);
      })();
    }`,
    ],
    invalid: [
        // Basic case - using event after await
        {
            code: `async function handler(event) {
        await fetch('/api');
        console.log(event);
      }`,
            errors: [{ messageId: 'noAsyncEventReference' }],
        },
        // Using event in function call after await
        {
            code: `async function handler(event) {
        await fetch('/api');
        doSomethingWith(event);
      }`,
            errors: [{ messageId: 'noAsyncEventReference' }],
        },
        // Arrow function - using event after await
        {
            code: `const handler = async (event) => {
        await Promise.resolve();
        return event;
      }`,
            errors: [{ messageId: 'noAsyncEventReference' }],
        },
        // Method - using event after await
        {
            code: `class Component {
        async handleEvent(event) {
          await this.doSomething();
          console.log(event);
        }
      }`,
            errors: [{ messageId: 'noAsyncEventReference' }],
        },
        // Multiple awaits - using event after any await
        {
            code: `async function handler(event) {
        await Promise.resolve();
        await Promise.resolve();
        console.log(event);
      }`,
            errors: [{ messageId: 'noAsyncEventReference' }],
        },
        // Using in nested block after await
        {
            code: `async function handler(event) {
        await Promise.resolve();
        if (true) {
          console.log(event);
        }
      }`,
            errors: [{ messageId: 'noAsyncEventReference' }],
        },
        // Using in another function call after await
        {
            code: `async function handler(event) {
        await Promise.resolve();
        processEvent(event);
      }`,
            errors: [{ messageId: 'noAsyncEventReference' }],
        },
        // Promise chain .then - using event inside .then
        {
            code: `function handler(event) {
        fetchData().then(() => {
          console.log(event);
        });
      }`,
            errors: [{ messageId: 'noAsyncEventReference' }],
        },
        // Promise chain .catch - using event inside .catch
        {
            code: `function handler(event) {
        fetchData()
          .then(() => {
            // Some code
          })
          .catch(() => {
            console.log(event);
          });
      }`,
            errors: [{ messageId: 'noAsyncEventReference' }],
        },
        // Promise chain .finally - using event inside .finally
        {
            code: `function handler(event) {
        fetchData()
          .then(() => {
            // Some code
          })
          .finally(() => {
            console.log(event);
          });
      }`,
            errors: [{ messageId: 'noAsyncEventReference' }],
        },
        // Nested promise chain - using event inside nested .then
        {
            code: `function handler(event) {
        fetchData().then(() => {
          return anotherFetch().then(() => {
            console.log(event);
          });
        });
      }`,
            errors: [{ messageId: 'noAsyncEventReference' }],
        },
        // Using with e param name
        {
            code: `function handler(e) {
        fetchData().then(() => {
          console.log(e);
        });
      }`,
            errors: [{ messageId: 'noAsyncEventReference' }],
        },
        // Using with ev param name
        {
            code: `function handler(ev) {
        fetchData().then(() => {
          processEvent(ev);
        });
      }`,
            errors: [{ messageId: 'noAsyncEventReference' }],
        },
        // Multiple references to the event in a single function should each be reported
        {
            code: `async function handler(event) {
        await fetch('/api');
        console.log(event);
        processEvent(event);
        return event;
      }`,
            errors: [
                { messageId: 'noAsyncEventReference' },
                { messageId: 'noAsyncEventReference' },
                { messageId: 'noAsyncEventReference' },
            ],
        },
    ],
});
