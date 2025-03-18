# eslint-plugin-async-event

ESLint plugin to detect unsafe event handling patterns in asynchronous contexts.

## Problem

In JavaScript event handlers, event objects and their properties have specific behaviors that can lead to bugs when used in asynchronous contexts:

1. **Event object lifecycle**: Event objects may be recycled by the JavaScript engine after an event completes.
2. **Event methods timing**: Methods like `preventDefault()` and `stopPropagation()` only work when called synchronously.
3. **currentTarget references**: The `event.currentTarget` property is only valid during synchronous event handling.

When using `async` event handlers or promises in event callbacks, accessing these objects or methods after an `await` or in promise chains can lead to unexpected behavior or errors.

## Solution

This plugin provides three rules to catch common mistakes with event handling in async contexts:

- **no-async-current-target**: Prevents accessing `.currentTarget` after await expressions
- **no-async-event-methods**: Prevents calling event methods like `preventDefault()` after await expressions
- **no-async-event-reference**: Prevents referencing event objects after await expressions

## Installation

This plugin is not published yet.

## Usage

### ESLint Configuration

Add the plugin to your `.eslintrc.js` or `eslint.config.js`:

```js
// For flat config (eslint.config.js)
import asyncEventPlugin from 'eslint-plugin-async-event';

export default [
  // ... other configs
  {
    plugins: {
      'async-event': asyncEventPlugin,
    },
    rules: {
      'async-event/no-async-current-target': 'error',
      'async-event/no-async-event-methods': 'error',
      'async-event/no-async-event-reference': 'error',
    },
  },
];
```

```js
// For .eslintrc.js
module.exports = {
  plugins: ['async-event'],
  rules: {
    'async-event/no-async-current-target': 'error',
    'async-event/no-async-event-methods': 'error',
    'async-event/no-async-event-reference': 'error',
  },
};
```

### Using the recommended configuration

This plugin exports a recommended configuration that turns on all rules with sensible defaults:

```js
// For flat config (eslint.config.js)
import asyncEventPlugin from 'eslint-plugin-async-event';

export default [
  // ... other configs
  asyncEventPlugin.configs.recommended,
];
```

```js
// For .eslintrc.js
module.exports = {
  extends: ['plugin:async-event/recommended'],
};
```

## Rules

### no-async-current-target

Prevents accessing `.currentTarget` after an await expression or in promise chains.

In JavaScript event handlers, the `event.currentTarget` property refers to the element that the event handler is attached to. When using event delegation, this value changes as the event bubbles through the DOM.

However, when using `async` event handlers, using `event.currentTarget` after an `await` can lead to errors because:
1. The event may have already completed bubbling
2. The event object might be recycled by the browser/engine
3. The reference to the original target may no longer be valid

#### Examples of incorrect code:

```js
// ❌ Accessing currentTarget after await
async function handleClick(event) {
  await fetchData();
  console.log(event.currentTarget); // Error: currentTarget may no longer be valid
}

// ❌ Accessing currentTarget after await in arrow function
const handleClick = async (event) => {
  await updateUI();
  return event.currentTarget.dataset.id; // Error
};

// ❌ Accessing currentTarget in promise chain
function handleClick(event) {
  fetchData().then(() => {
    console.log(event.currentTarget); // Error
  });
}
```

#### Examples of correct code:

```js
// ✅ Storing currentTarget in a variable before await
async function handleClick(event) {
  const target = event.currentTarget;
  await fetchData();
  console.log(target); // Safe: using stored reference
}

// ✅ Using currentTarget before any await
async function handleClick(event) {
  console.log(event.currentTarget);
  await updateUI();
}

// ✅ Using currentTarget in synchronous code is fine
function handleClick(event) {
  console.log(event.currentTarget);
}
```

### no-async-event-methods

Prevents calling event methods like `preventDefault()`, `stopPropagation()`, and `stopImmediatePropagation()` after await expressions or in promise chains.

These methods need to be called synchronously during event handling to have the intended effect. Calling them after an await or in a promise chain is too late and won't work correctly.

#### Examples of incorrect code:

```js
// ❌ Using preventDefault after await
async function handleSubmit(event) {
  await validateForm();
  event.preventDefault(); // Too late, form already submitted
}

// ❌ Using stopPropagation in promise chain
function handleClick(event) {
  fetchData().then(() => {
    event.stopPropagation(); // Too late, event already propagated
  });
}
```

#### Examples of correct code:

```js
// ✅ Using preventDefault before await
async function handleSubmit(event) {
  event.preventDefault(); // Correct: called synchronously
  await validateForm();
  // Process form...
}

// ✅ Using stopPropagation before async operations
function handleClick(event) {
  event.stopPropagation(); // Correct: called synchronously
  fetchData().then(() => {
    // Handle data...
  });
}
```

### no-async-event-reference

Prevents referencing event objects after await expressions or in promise chains.

The event object itself may be recycled by the JavaScript engine after the event handling completes. Accessing any property or method on the event object after an await or in a promise chain can lead to unexpected behavior.

#### Examples of incorrect code:

```js
// ❌ Referencing event object after await
async function handleInput(event) {
  await saveData();
  console.log(event.target.value); // Error: event may no longer be valid
}

// ❌ Using event in promise chain
function handleChange(event) {
  fetchOptions().then(() => {
    updateUI(event.target.value); // Error: event may be recycled
  });
}
```

#### Examples of correct code:

```js
// ✅ Store needed values before await
async function handleInput(event) {
  const value = event.target.value;
  await saveData();
  console.log(value); // Safe: using stored value
}

// ✅ Capture necessary data before promise chain
function handleChange(event) {
  const value = event.target.value;
  fetchOptions().then(() => {
    updateUI(value); // Safe: using captured value
  });
}
```

## License

MIT