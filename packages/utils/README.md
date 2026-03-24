# @t007/utils

> The foundational utility belt and central nervous system for the `@t007` UI ecosystem. A collection of highly optimized, zero-dependency vanilla JavaScript helpers for DOM manipulation, async resource loading, and math operations.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/Tobi007-del/t007-tools/blob/main/LICENSE)
[![NPM Version](https://img.shields.io/npm/v/@t007/utils.svg)](https://www.npmjs.com/package/@t007/utils)

[Report Bug](https://github.com/Tobi007-del/t007-tools/issues)

---

## Table of contents

- [@t007/utils](#t007utils)
  - [Table of contents](#table-of-contents)
  - [Overview](#overview)
  - [Features](#features)
  - [Tech Stack](#tech-stack)
  - [Getting Started](#getting-started)
  - [Usage](#usage)
  - [Author](#author)
  - [Acknowledgments](#acknowledgments)
  - [Star History](#star-history)

---

## Overview

**@t007/utils** is the core engine that powers the rest of the `@t007` UI packages (`@t007/toast`, `@t007/dialog`, `@t007/input`). It abstracts away the heavy lifting of dynamic DOM creation, cross-browser event handling, and asynchronous resource injection.

### Why @t007/utils?

- ✅ **Tree-Shakeable:** Every utility is exported individually. Modern bundlers will only compile the exact code you import, resulting in zero bloat.
- ✅ **Shared Memory:** By acting as a peer dependency for the other `@t007` packages, it ensures that your application doesn't download duplicate helper functions.
- ✅ **Zero Frameworks:** 100% pure vanilla JavaScript. 

---

## Features

- **DOM Engineering**: High-performance element creation and attribute binding.
- **Resource Management**: Asynchronous script and stylesheet injection with duplicate-load prevention.
- **Class Management**: Automatic method binding for class-based UI components.
- **Math & Physics**: Clamping and coordinate tracking used by gesture-driven UI components.
- **Global Injection**: Safely initializes the global `t007` object across environments.

---

## Tech Stack

### Built with

- Vanilla JavaScript (ES6+)
- Bundled via `tsup` (ESM, CJS, IIFE outputs)
- Built for extreme execution speed and minimal byte size.

---

## Getting Started

### Installation

Install via your preferred package manager:

```bash
npm install @t007/utils
# or
yarn add @t007/utils
# or
pnpm add @t007/utils
````

-----

## Usage

### Modern Bundlers (ESM)

Because the library uses modern ECMAScript Modules, you can destruct exactly what you need.

```javascript
// Vite / Webpack / Next.js
import { createEl, loadResource, uid } from '@t007/utils';

// Generate a complex DOM element in one line
const myBtn = createEl('button', { className: 'my-custom-btn', textContent: 'Click Me' });

// Inject a stylesheet dynamically
await loadResource('https://cdn.example.com/styles.css, 'link');
```

-----

## Author

  - Developer - [Oketade Oluwatobiloba (Tobi007-del)](https://github.com/Tobi007-del)
  - Project - [t007-tools](https://github.com/Tobi007-del/t007-tools)

## Acknowledgments

The invisible backbone of the `@t007` ecosystem. Engineered to make complex DOM operations feel effortless.

## Star History

If you find this project useful, please consider giving it a star! ⭐

[![Star History Chart](https://api.star-history.com/svg?repos=Tobi007-del/t007-tools&type=Date)](https://github.com/Tobi007-del/t007-tools)