# eslint-plugin-async-event

ESLint plugin to detect unsafe event handling patterns in asynchronous contexts.

## Problem

In JavaScript event handlers, event objects and their properties have specific behaviors that can lead to bugs when used in asynchronous contexts:

1. **Event methods timing**: Methods like `preventDefault()` and `stopPropagation()` only work when called synchronously.
2. **Event property references**: When working with delegated events, frameworks may replace the `event.currentTarget` property as the event bubbles.

When using `async` event handlers or promises in event callbacks, accessing these objects or methods after an `await` or in promise chains can lead to unexpected behavior or errors.

## Solution

This plugin provides two rules to catch common mistakes with event handling in async contexts:

- **no-async-event-properties**: Prevents accessing specific event properties or calling methods after await expressions
- **no-async-event-reference**: Prevents referencing event objects after await expressions

## Installation

This isn't published on NPM yet, so you'll have to install directly from the repo:

```
npm install https://github.com/fongandrew/eslint-plugin-async-event.git
```

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
      // no-async-event-reference is a stronger version of
      // no-async-event-properties, so really no need to
      // include both, but do what works for you
      'async-event/no-async-event-properties': 'error',
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
    // no-async-event-reference is a stronger version of
    // no-async-event-properties, so really no need to
    // include both, but do what works for you
    'async-event/no-async-event-properties': 'error',
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

### no-async-event-properties

Prevents accessing specific event properties or calling methods after await expressions or in promise chains.

By default, this rule disallows accessing the following properties after an await or in a promise chain:
- `currentTarget` - This usually references the element to which an event listener is attached, but when working with event delegation, a single handler may be attached to the document that redefines `currentTarget` as the event bubbles.
- `preventDefault` - Doesn't work if called asynchronously.
- `stopPropagation` - Doesn't work if called asynchronously.
- `stopImmediatePropagation` - Doesn't work if called asynchronously.

#### Rule Options

You can customize which properties are disallowed by providing a properties array:

```js
{
  'async-event/no-async-event-properties': ['error', {
    properties: ['currentTarget', 'preventDefault', 'target', 'bubbles']
  }]
}
```

You can also customize how variables are identified as event parameters:

```js
{
  'async-event/no-async-event-properties': ['error', {
    // Standard properties to check
    properties: ['currentTarget', 'preventDefault', 'target', 'bubbles'],

    // Configure event parameter detection
    eventPatterns: [
      'event',
      'e',
      'ev',
      'evt',
      'mouseEvent',
      '*Event',  // wildcard pattern for anything ending with "Event"
      '_event*'  // wildcard pattern for anything starting with "_event"
    ]
  }]
}
```

By default, the plugin identifies event parameters using:
- Exact matches for: `event`, `e`, `ev`
- Wildcard pattern: `*Event` (anything ending with "Event")

Wildcard patterns use `*` to match any string (including empty string). The `*` can appear anywhere in the pattern.

#### Examples of incorrect code:

```js
// ❌ Accessing currentTarget after await
async function handleClick(event) {
  await fetchData();
  console.log(event.currentTarget); // Error: currentTarget may no longer be valid
}

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
// ✅ Storing currentTarget in a variable before await
async function handleClick(event) {
  const target = event.currentTarget;
  await fetchData();
  console.log(target); // Safe: using stored reference
}

// ✅ Using preventDefault before await
async function handleSubmit(event) {
  event.preventDefault(); // Correct: called synchronously
  await validateForm();
  // Process form...
}

// ✅ Using stopPropagation before promise chain
function handleClick(event) {
  event.stopPropagation(); // Correct: called synchronously
  fetchData().then(() => {
    // Handle data...
  });
}

// ✅ Accessing properties that aren't in the disallowed list
async function handleInput(event) {
  await fetchData();
  console.log(event.type); // Safe if 'type' is not in the disallowed properties list
}
```

### no-async-event-reference

Prevents referencing event objects after await expressions or in promise chains. This is essentially a stronger version of `no-async-event-properties` to prevent, e.g., asynchronously passing the `event` object to some helper function which then calls `preventDefault`.

#### Rule Options

You can customize how variables are identified as event parameters:

```js
{
  'async-event/no-async-event-reference': ['error', {
    // Configure event parameter detection
    eventPatterns: [
      'event',
      'e',
      'ev',
      'evt',
      'mouseEvent',
      '*Event',  // wildcard pattern for anything ending with "Event"
      '_event*'  // wildcard pattern for anything starting with "_event"
    ]
  }]
}
```

By default, the plugin identifies event parameters using:
- Exact matches for: `event`, `e`, `ev`, `evt`
- Wildcard pattern: `*Event` (anything ending with "Event")

Wildcard patterns use `*` to match any string (including empty string). The `*` can appear anywhere in the pattern.

#### Examples of incorrect code:

```js
// ❌ Referencing event object after await
async function handleInput(event) {
  await saveData();
  // Error: `doSomethingWith` might do something unsafe with event
  doSomethingWith(event);
}

// ❌ Using event in promise chain
function handleChange(event) {
  fetchOptions().then(() => {
    // Error: `updateUI` might do something unsafe with event
    updateUI(event);
  });
}
```

#### Examples of correct code:

```js
// ✅ Store needed values before await
async function handleInput(event) {
  const target = event.target;
  await saveData();
  doSomethingWith(target); // Safe: using stored property
}

// ✅ Capture necessary data before promise chain
function handleChange(event) {
  const target = event.target;
  fetchOptions().then(() => {
    updateUI(target); // Safe: using captured property
  });
}
```

## License

MIT