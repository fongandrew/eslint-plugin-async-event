# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Fix false positive in `no-async-event-reference` when multiple sibling
  callbacks use the same event parameter name (e.g., `e`) inside an async
  function after an `await`. Stale entries in `parameterScopes` for exited
  callbacks caused `functionStack.indexOf()` to return `-1`, which compared
  less than the async parent's index and incorrectly triggered a report.

## [1.0.0] - 2025-01-01

### Added

- `no-async-event-properties` rule to detect unsafe access to event
  properties/methods (`preventDefault`, `stopPropagation`,
  `stopImmediatePropagation`, `currentTarget`) after async operations.
- `no-async-event-reference` rule to detect unsafe references to event objects
  after async operations.
- Configurable event parameter name patterns via `eventPatterns` option.
- Configurable disallowed properties via `properties` option
  (`no-async-event-properties`).
- Detection of async contexts: `await` expressions and promise chains
  (`.then`, `.catch`, `.finally`).
- Event alias tracking (e.g., `const savedEvent = event`).
- Filtering of non-DOM event variables (object literals, `new` expressions,
  function call results).
