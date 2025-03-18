import { RuleTester } from 'eslint';
import noAsyncCurrentTarget from './no-async-current-target';

// Configure Rule Tester for ESLint 9+
const ruleTester = new RuleTester({
	languageOptions: {
		ecmaVersion: 2020,
		sourceType: 'module',
	},
});

ruleTester.run('no-async-current-target', noAsyncCurrentTarget, {
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
	],
});
