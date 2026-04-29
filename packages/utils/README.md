# @t007/utils

> The foundational utility belt and central nervous system for the `@t007` UI ecosystem. A collection of highly optimized, JavaScript helpers for DOM manipulation, async resource loading, and math operations.

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

- JavaScript (ES6+)
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
await loadResource('https://cdn.example.com/styles.css', 'link');
```

### Built-in Hooks

| React Hook      | Vanilla Counterpart |
| --------------- | ------------------- |
| useRipple       | rippleHandler       |
| useScrollAssist | initScrollAssist    |
| useFocusTrap    | initFocusTrap       |
| useOutsideClick | initOutsideClick    |
| useHighlight    | N/A                 |
| N/A             | initVScrollerator   |

### Built-in Components
| React Component | Vanilla Counterpart |
| --------------- | ------------------- |
| HighlightText   | N/A                 |

### Code  Sample

```tsx
import { useRef } from "react";
import { useScrollAssist, useRipple } from "@t007/utils/hooks/react";
import { HighlightText } from "@t007/utils/components/react";
import '@t007/utils/styles/ripple.css';
import "@t007/utils/styles/scroll-assist.css";

export function HelperTextScroller() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollAssist(ref, { vertical: false, assistClassName: "scroll-assist" });
  const rippleHandler = useRipple();

  return (
    <div className="text-wrapper">
      <p ref={ref} className="text">
        <HighlightText query="helper" className="highlight">
          Long helper text to demonstrate highlighting and scroll assistance.
        </HighlightText>
      </p>
      <button onPointerDown={rippleHandler}>Click Me</button>
    </div>
  );
}
```

### Styles

It includes:
- `.t007-ripple-wrapper`, `.t007-ripple`, `.t007-ripple-hold`, `.t007-ripple-fade` (default ripple classes)
- `.t007-scroll-assist` (default assist class)

All defaults are exposed as root-level, `t007`-prefixed variables:

```css
:root {
  /** default ripple values */
  --t007-ripple-initial-opacity: 0.4;
  --t007-ripple-initial-scale: 0.5;
  --t007-ripple-expand-scale: 2.05;
  --t007-ripple-color: rgb(0 0 0 / 0.24);
  --t007-ripple-expand-duration: 350ms;
  --t007-ripple-fade-duration: 350ms;
  /** default scroll assist values */
  --t007-scroll-assist-color: rgb(0 0 0 / 1);
  --t007-scroll-assist-opacity: 0.07;
  --t007-scroll-assist-min-width: 2rem;
  --t007-scroll-assist-height: 2rem;
  --t007-scroll-assist-inline-offset: -0.35rem;
  --t007-scroll-assist-block-offset: 0;
}

/** custom pre-requisites */
.highlight {
  background-color: yellow;
}
.text-wrapper {
  position: relative;
  flex: 1;
  min-width: 2rem;
}
.text {
  white-space: nowrap;
  overflow: auto hidden;
  scrollbar-width: none;
}
.text::-webkit-scrollbar {
  display: none;
}
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