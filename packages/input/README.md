# @t007/input

> An advanced, highly customizable, and fully automated vanilla JavaScript form management system. Features floating labels, automatic validation, mutation observing, and native file-size enforcement.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![NPM Version](https://img.shields.io/npm/v/@t007/input.svg)](https://www.npmjs.com/package/@t007/input)

[Live Demo](https://tobi007-del.github.io/t007-tools/packages/input/src/index.html) | [Report Bug](https://github.com/Tobi007-del/t007-tools/issues)

---

## Table of contents

- [@t007/input](#t007input)
  - [Table of contents](#table-of-contents)
  - [Overview](#overview)
  - [Demo \& Screenshots](#demo--screenshots)
  - [Features](#features)
  - [Tech Stack](#tech-stack)
  - [Getting Started](#getting-started)
  - [Usage](#usage)
  - [API Reference](#api-reference)
  - [Advanced Usage](#advanced-usage)
  - [Customization](#customization)
  - [Author](#author)
  - [Acknowledgments](#acknowledgments)

---

## Overview

**@t007/input** is a powerful Form Manager (FM) designed to take the pain out of HTML5 forms. It automatically handles floating labels, injects custom icons, tracks password strength, and strictly enforces validation rules (including deep file-size and mime-type checks) without requiring a massive framework.

### Why @t007/input?

- ✅ **DOM Mutation Auto-Tracking:** Automatically initializes new inputs added to the DOM dynamically.
- ✅ **Advanced File Validation:** Built-in checks for `maxSize`, `minSize`, `maxTotalSize`, and specific MIME types.
- ✅ **Intelligent Password UX:** Ships with a built-in password strength meter, confirm-password matching, and toggleable visibility icons.
- ✅ **Zero Frameworks:** Pure vanilla JS. Drop it into React, Vue, or a static HTML site.
- ✅ **Global Injection:** Automatically attaches to `window.field` and `window.handleFormValidation` for instant legacy integration.

---

## Demo & Screenshots

### Standard Input Fields
Beautiful floating labels with native error state handling.
<img src="https://raw.githubusercontent.com/Tobi007-del/t007-tools/refs/heads/main/assets/images/input_library_desktop_preview.png" alt="Desktop Preview" width="600" />

### Mobile & Responsive State
<img src="https://raw.githubusercontent.com/Tobi007-del/t007-tools/refs/heads/main/assets/images/input_library_mobile_preview.png" alt="Mobile Preview" width="300" />

### Form Validation in Action
<img src="https://raw.githubusercontent.com/Tobi007-del/t007-tools/refs/heads/main/assets/images/input_library_sample_1.png" alt="Validation Example 1" width="600" />
<img src="https://raw.githubusercontent.com/Tobi007-del/t007-tools/refs/heads/main/assets/images/input_library_sample_2.png" alt="Validation Example 2" width="600" />

---

## Features

- **Programmatic Field Generation**: Create complex DOM inputs (with icons, meters, and helpers) via a single JS object.
- **Client & Server Sync**: Supports `form.validateOnServer()` hooks before allowing submission.
- **Automatic Error Shaking**: Visual feedback (shake animation) on invalid focus-out or submit.
- **Horizontal Scroll Assist**: Built-in helper for long error messages overflowing the container.
- **Tree-Shakeable**: Import only the utilities you need.

---

## Tech Stack

### Built with

- Vanilla JavaScript (ES6+)
- HTML5 Form Validation API
- MutationObserver API
- Bundled via `tsup` (ESM, CJS, IIFE outputs)

---

## Getting Started

### Installation

Install via your preferred package manager:

```bash
npm install @t007/input
# or
yarn add @t007/input
# or
pnpm add @t007/input
````

-----

## Usage

### Modern Bundlers (ESM)

```javascript
import '@t007/input/style.css';
import { field, handleFormValidation, formManager } from '@t007/input'; // also attached to window.t007

// 1. Create a complex input field programmatically
const emailInput = field({
  type: 'email',
  label: 'Email Address',
  placeholder: 'Enter your email',
  required: true,
  helperText: {
    info: "We'll never share your email.",
    typeMismatch: "Please enter a valid email address."
  }
});

// 2. Append to a form
const myForm = document.querySelector('.t007-input-form');
myForm.appendChild(emailInput);

// 3. Initialize the validation engine
handleFormValidation(myForm);
```

### CDN / Browser (Global)

When loaded via a `<script>` tag, the library automatically scans the DOM for forms with the class `.t007-input-form` and initializes them.

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@t007/input@latest/dist/index.min.css">
</head>
<body>
  
  <form class="t007-input-form" novalidate>
    <div class="t007-input-field">
      <label class="t007-input-wrapper">
        <span class="t007-input-outline">
          <span class="t007-input-outline-leading"></span>
          <span class="t007-input-outline-notch">
            <span class="t007-input-floating-label">Username</span>
          </span>
          <span class="t007-input-outline-trailing"></span>
        </span>
        <input type="text" class="t007-input" required minlength="3">
      </label>
    </div>
    <button type="submit">Submit</button>
  </form>

  <script src="https://cdn.jsdelivr.net/npm/@t007/input@latest"></script>
</body>
</html>
```

-----

## API Reference

### `field(config)`

Programmatically generates the complex DOM structure required for the floating labels, icons, and error states.

  - **`config.type`** *(String)*: Standard HTML input type, or `"select"`, `"textarea"`.
  - **`config.label`** *(String)*: The floating label text.
  - **`config.placeholder`** *(String)*: Standard placeholder.
  - **`config.options`** *(Array)*: Used only when `type="select"`. Array of strings or `{value, option}` objects.
  - **`config.helperText`** *(Object | Boolean)*: Maps native HTML5 validity states to custom error messages.
      - `info`: Default helper text.
      - `valueMissing`: Shown when `required` fails.
      - `typeMismatch`: Shown when email/url format fails.
      - *(Set to `false` to disable the helper line entirely).*
  - **`config.passwordMeter`** *(Boolean)*: Enables the 4-tier password strength bar.
  - **`config.eyeToggler`** *(Boolean)*: Enables the show/hide password icons.
  - **`...otherProps`**: Any standard HTML attributes (`required`, `minlength`, `disabled`) are passed directly to the input.

### `handleFormValidation(formElement)`

Attaches the event listeners to a specific form, preventing default submission if inputs are invalid, and triggering the `.t007-input-shake` animations on errors.

### `The Form Manager (t007.FM)`

The core object injected into the global namespace containing utility functions like `togglePasswordType`, `getFilesHelper`, and `observeDOMForFields()`.

-----

## Advanced Usage

### File Validation

The library extends native file inputs with custom attributes for strict size enforcement:

```javascript
const fileUploader = field({
  type: 'file',
  label: 'Upload Avatar',
  accept: 'image/png, image/jpeg',
  multiple: true,
  maxSize: 5000000, // 5MB max per file
  maxTotalSize: 15000000, // 15MB max total upload
  maxLength: 3 // Max 3 files allowed
});
```

### Password Management

Setting an input's custom attribute to `password` or `confirm_password` automatically links their validation states.

```javascript
// Master password
field({ type: 'password', custom: 'password', label: 'Password' });

// Confirmation (Automatically errors if it doesn't match the master)
field({ type: 'password', custom: 'confirm_password', label: 'Confirm Password' });
```

-----

## Customization

You can deeply customize the look and feel by overriding the built-in CSS variables or targeting the specific classes.

### Important Selectors

  - `.t007-input`: The actual `<input>` element.
  - `.t007-input-floating-label`: The label text.
  - `.t007-input-outline`: The border wrapper holding the label.
  - `[data-error]`: Attribute added dynamically on validation failure.
  - `.t007-input-password-strength-meter`: The container for the 4 strength bars.

-----

## Author

  - Developer - [Oketade Oluwatobiloba (Tobi007-del)](https://github.com/Tobi007-del)
  - Project - [t007-tools](https://github.com/Tobi007-del/t007-tools)

## Acknowledgments

Built to provide a robust, dependency-free form validation engine that rivals heavyweight frontend frameworks. Part of the `@t007` utility ecosystem.