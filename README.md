# eslint-plugin-async-event

ESLint rule to block unsafe access of `.currentTarget` inside async portions of a function.

## Problem

In JavaScript event handlers, the `event.currentTarget` property refers to the element that the event handler is attached to. When using event delegation, this value is redefined as the event synchronously bubbles up through the DOM.

However, when using `async` event handlers, using `event.currentTarget` after an `await` can lead to errors or unexpected behavior because:

1. The event may have already completed bubbling
2. The event object might be reused by the browser/engine
3. The reference to the original target may no longer be valid

## Solution

This rule detects when `event.currentTarget` (or any `.currentTarget` property) is accessed in an async function after an await statement. It suggests storing the value in a variable before the first await.

## Installation

This plugin is not published yet.

## Usage

### ESLint Configuration

Add the plugin to your `.eslintrc.js` or `eslint.config.js`:

```js
// For flat config (eslint.config.js)
import noAsyncCurrentTarget from 'eslint-plugin-no-async-current-target';

export default [
  // ... other configs
  {
    plugins: {
      'no-async-current-target': noAsyncCurrentTarget,
    },
    rules: {
      'no-async-current-target/no-async-current-target': 'error',
    },
  },
];
```

```js
// For .eslintrc.js
module.exports = {
  plugins: ['no-async-current-target'],
  rules: {
    'no-async-current-target/no-async-current-target': 'error',
  },
};
```

### Using the recommended configuration

This plugin exports a recommended configuration that turns on the rule with sensible defaults:

```js
// For flat config (eslint.config.js)
import noAsyncCurrentTarget from 'eslint-plugin-no-async-current-target';

export default [
  // ... other configs
  noAsyncCurrentTarget.configs.recommended,
];
```

```js
// For .eslintrc.js
module.exports = {
  extends: ['plugin:no-async-current-target/recommended'],
};
```

## Rule Details

This rule aims to prevent bugs related to accessing `event.currentTarget` after an `await` statement in async functions.

### Examples of incorrect code:

```js
// ❌ Accessing currentTarget after await
async function handleClick(event) {
  await fetchData();
  console.log(event.currentTarget); // Error: currentTarget may no longer be valid
}
```

```js
// ❌ Accessing currentTarget after await in arrow function
const handleClick = async (event) => {
  await updateUI();
  return event.currentTarget.dataset.id; // Error
};
```

### Examples of correct code:

```js
// ✅ Storing currentTarget in a variable before await
async function handleClick(event) {
  const target = event.currentTarget;
  await fetchData();
  console.log(target); // Safe: using stored reference
}
```

```js
// ✅ Using currentTarget before any await
async function handleClick(event) {
  console.log(event.currentTarget);
  await updateUI();
}
```

```js
// ✅ Using currentTarget in synchronous code is fine
function handleClick(event) {
  console.log(event.currentTarget);
}
```

## License

MIT