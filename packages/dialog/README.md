# @t007/dialog

> A lightweight, promise-based vanilla JavaScript dialog system providing modern, accessible replacements for native `alert`, `confirm`, and `prompt` windows.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![NPM Version](https://img.shields.io/npm/v/@t007/dialog.svg)](https://www.npmjs.com/package/@t007/dialog)

[Live Demo](https://tobi007-del.github.io/t007-tools/packages/dialog/src/index.html) | [Report Bug](https://github.com/Tobi007-del/t007-tools/issues)

---

## Table of contents

- [@t007/dialog](#t007dialog)
  - [Table of contents](#table-of-contents)
  - [Overview](#overview)
  - [Demo \& Screenshots](#demo--screenshots)
  - [Features](#features)
  - [Tech Stack](#tech-stack)
  - [Getting Started](#getting-started)
  - [Usage](#usage)
  - [API Reference](#api-reference)
  - [Customization](#customization)
  - [Author](#author)
  - [Acknowledgments](#acknowledgments)
  - [Star History](#star-history)

---

## Overview

**@t007/dialog** is a lightweight UI library that completely overrides the "ugly", thread-blocking native browser dialogs with beautiful, non-blocking, Promise-based alternatives.

### Why @t007/dialog?

- ✅ **Non-Blocking Promises:** Awaits user input asynchronously without freezing the main thread.
- ✅ **Native Accessibility:** Built on top of the modern HTML5 `<dialog>` element.
- ✅ **Smart Loading:** The `prompt` dialog dynamically lazy-loads the `@t007/input` dependency only when needed.
- ✅ **Zero Frameworks:** Pure vanilla JS, meaning it works flawlessly in React, Vue, Angular, or raw HTML.
- ✅ **Global Injection:** Automatically attaches to `window.Alert`, `window.Confirm`, and `window.Prompt` for drop-in legacy code replacement.

---

## Demo & Screenshots

### Alert Dialog
A clean, single-action notification window.
![](https://raw.githubusercontent.com/Tobi007-del/t007-tools/refs/heads/main/assets/images/dialog_library_alert_preview.png)

### Confirm Dialog
A dual-action window returning a strict boolean based on user choice.
![](https://raw.githubusercontent.com/Tobi007-del/t007-tools/refs/heads/main/assets/images/dialog_library_confirm_preview.png)

### Prompt Dialog
Integrates with the `t007.FM` (Form Manager) to capture, validate, and return user input.
![](https://raw.githubusercontent.com/Tobi007-del/t007-tools/refs/heads/main/assets/images/dialog_library_prompt_preview.png)

---

## Features

- **Promise-Based API**: Use `async/await` for incredibly clean control flow.
- **Form Validation**: Native form validation built directly into the prompt modal.
- **Keyboard Navigation**: Native `Esc` key cancellation and auto-focusing capabilities.
- **Highly Customizable**: Clean DOM structure with distinct CSS classes for easy overriding.

---

## Tech Stack

### Built with

- Semantic HTML5 `<dialog>` API
- CSS Custom Properties & Flexbox
- Vanilla JavaScript (ES6+)
- Bundled via `tsup` (ESM, CJS, IIFE outputs)

---

## Getting Started

### Installation

Install via your preferred package manager:

```bash
npm install @t007/dialog
# or
yarn add @t007/dialog
# or
pnpm add @t007/dialog
````

-----

## Usage

### Modern Bundlers (ESM)

If you are using Vite, Webpack, Next.js, or any modern build tool:

```javascript
import '@t007/dialog/style.css';
import { alert, confirm, prompt } from '@t007/dialog'; // also attached to window.t007

// 1. Alert
async function triggerAlert() {
  await alert('Operation completed successfully!');
  console.log('User dismissed the alert.');
}

// 2. Confirm
async function triggerConfirm() {
  const isSure = await confirm('Are you sure you want to delete this file?');
  if (isSure) {
    console.log('Deleting...');
  } else {
    console.log('Action cancelled.');
  }
}

// 3. Prompt
async function triggerPrompt() {
  const username = await prompt('Enter your new username:', 'guest_user');
  if (username !== null) {
    console.log(`Username changed to: ${username}`);
  }
}
```

### CDN / Browser (Global)

If you are not using a bundler, the IIFE build automatically injects the dialogs into the global `t007` object and provides convenient capitalized window fallbacks (`window.Alert`, `window.Confirm`, `window.Prompt`).

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@t007/dialog@latest/dist/index.css">
</head>
<body>
  
  <script src="https://cdn.jsdelivr.net/npm/@t007/dialog@latest"></script>
  
  <script>
    // The library automatically maps to window.Confirm!
    document.getElementById('deleteBtn').addEventListener('click', async () => {
      const proceed = await Confirm("Proceed with formatting?"); // or use `t007.confirm()`
      if(proceed) doFormat();
    });
  </script>
</body>
</html>
```
-----

## API Reference

### `alert(message, options)`

Displays a simple message and a confirmation button.

  - **`message`** *(String)*: The text to display.
  - **`options`** *(Object)*: Optional configuration.
      - `options.id` *(String)*: Unique identifier for the dialog for programmatic dismissal.
      - `options.confirmText` *(String)*: Custom text for the button (Default: `"OK"`).
      - `options.closedBy` *(String)*: Browser behavior for handling dialog closure.
      - `options.rootElement` *(HTMLElement)*: Render dialog inside this element.
      - `options.scoped` *(Boolean)*: Whether to restrict interactions to `rootElement` if provided. Defaults to `true`.
  - **Returns**: `Promise<true>`

### `confirm(question, options)`

Displays a question with confirm and cancel buttons.

  - **`question`** *(String)*: The question to ask the user.
  - **`options`** *(Object)*: Optional configuration.
      - `options.id` *(String)*: Unique identifier for the dialog for programmatic dismissal.
      - `options.confirmText` *(String)*: Custom text for the confirm button (Default: `"OK"`).
      - `options.cancelText` *(String)*: Custom text for the cancel button (Default: `"Cancel"`).
      - `options.closedBy` *(String)*: Browser behavior for handling dialog closure.
      - `options.rootElement` *(HTMLElement)*: Render dialog inside this element.
      - `options.scoped` *(Boolean)*: Whether to restrict interactions to `rootElement` if provided. Defaults to `true`.
  - **Returns**: `Promise<boolean>` (`true` if confirmed, `false` if cancelled).

### `prompt(question, defaultValue, options)`

Displays an input field to collect data from the user. Note: This automatically loads the `@t007/input` dependency if required.

  - **`question`** *(String)*: The prompt instructions.
  - **`defaultValue`** *(String)*: The initial value placed inside the input.
  - **`options`** *(Object)*: Optional @t007/input configuration passed directly to the input field generation.
      - `options.id` *(String)*: Unique identifier for the dialog for programmatic dismissal, also used as the input's ID.
      - `options.confirmText` *(String)*: Custom text for the submit button.
      - `options.cancelText` *(String)*: Custom text for the cancel button.
      - `options.closedBy` *(String)*: Browser behavior for handling dialog closure.
      - `options.rootElement` *(HTMLElement)*: Render dialog inside this element.
      - *Accepts standard HTML input attributes (type, required, placeholder, etc.)*
      - `options.scoped` *(Boolean)*: Whether to restrict interactions to `rootElement` if provided. Defaults to `true`.
  - **Returns**: `Promise<String | null>` (Returns the string value, or `null` if cancelled).

### `dismiss(id, response)`
Programatically dismiss a dialog by id or all dialogs when no id is provided.

  - **`id`** *(String)*: Optional unique identifier of the dialog to dismiss. If not provided, all dialogs will be dismissed.
  - **`response`** *(Any)*: Optional value to resolve the dialog's promise with. If not provided, defaults to `true` for confirm and alert dialogs, and `null` for prompt dialogs.

#### Backdrop behavior

- Default mode uses native `<dialog>.showModal()` and native `::backdrop`.
- Scoped mode (`rootElement`) uses `<dialog>.show()` with a pseudo backdrop.

-----

## Customization

The dialogs are built with semantic, easily targetable CSS classes. You can easily override these in your own stylesheet to match your application's theme.

### CSS Selectors & Variables

  - `.t007-dialog`: The main `<dialog>` container.
  - `.t007-dialog-top-section`: The wrapper for the text content.
  - `.t007-dialog-question`: The actual message/question text.
  - `.t007-dialog-bottom-section`: The wrapper for the action buttons.
  - `.t007-dialog-confirm-button`: The primary action button.
  - `.t007-dialog-cancel-button`: The secondary/cancel button.
  - `.t007-input-form`: The form wrapper used exclusively in the `prompt` dialog.

#### Override Starter (Chrome like)

```css
:root {
  --t007-dialog-backdrop-background: rgba(0, 0, 0, 0.6);
  --t007-dialog-backdrop-filter: none;
  --t007-cancel-button-color: dodgerblue;
  /* ...check source code for all variables... */
}
.t007-dialog {
  margin-top: 0;
}
```

#### Specificity Note

- Start with `:root` for shared dialog tokens.
- If a token does not apply, override directly on `.t007-dialog`.
- For targeted styling, use child selectors like `.t007-dialog-question`, `.t007-dialog-confirm-button`, and `.t007-dialog-cancel-button`.
- For strong app themes (e.g. `html[data-theme="dark"]`), use equal/stronger selectors like `html[data-theme="dark"] .t007-dialog`.
- Check source code for more details.

-----

## Author

  - Developer - [Oketade Oluwatobiloba (Tobi007-del)](https://github.com/Tobi007-del)
  - Project - [t007-tools](https://github.com/Tobi007-del/t007-tools/)

## Acknowledgments

Built to support modern web applications requiring non-blocking, highly customizable UI interfaces. Part of the `@t007` utility ecosystem.

## Star History

If you find this project useful, please consider giving it a star! ⭐

[![Star History Chart](https://api.star-history.com/svg?repos=Tobi007-del/t007-tools&type=Date)](https://github.com/Tobi007-del/t007-tools)