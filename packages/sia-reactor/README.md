# sia-reactor

> The Programmable Data DOM. A high-performance State & Intent Architecture (S.I.A.) Engine featuring zero-allocation loops, DOM-style event propagation, microtask batching, and structural sharing.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![NPM Version](https://img.shields.io/npm/v/sia-reactor.svg)](https://www.npmjs.com/package/sia-reactor)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/sia-reactor)](https://bundlephobia.com/package/sia-reactor)

[Live Demo & Benchmarks](https://tobi007-del.github.io/t007-tools/packages/sia-reactor/src/index.html) | [Report Bug](https://github.com/Tobi007-del/t007-tools/issues)

[Chronicles](https://github.com/Tobi007-del/tmg-media-player/blob/main/CHRONICLES.md) | [Interaction Folklore](https://github.com/Tobi007-del/tmg-media-player/blob/main/FOLKLORE.md)

---

## Table of contents

- [sia-reactor](#sia-reactor)
  - [Table of contents](#table-of-contents)
  - [Why sia-reactor?](#why-sia-reactor)
  - [Getting Started](#getting-started)
  - [Usage](#usage)
  - [API Reference](#api-reference)
  - [Notification Physics](#notification-physics)
  - [Architectural Tricks](#architectural-tricks)
  - [Inspirations](#inspirations)
  - [Benchmarks](#benchmarks)
  - [Author](#author)
  - [Acknowledgments](#acknowledgments)
  - [Star History](#star-history)

---

## Why sia-reactor?

Most state libraries react to changes.

`sia-reactor` lets you:

- intercept changes BEFORE they happen
- approve or reject user intent
- observe changes AFTER they settle
- treat your state like a programmable event system

```js
const player = reactive({
  intent: intent({ playing: false }),
  state: { playing: false }
});

// Logic layer (capture phase)
player.on("intent.playing", (e) => {
  if (!ready) return e.reject();
  player.state.playing = true;
}, { capture: true });

// UI layer
player.on("state.playing", (e) => {
  console.log("Now playing:", e.value);
});

// User action
player.intent.playing = true;
```
***"This is the entire system."***

Choose your reading mode:

- **I want to understand the architecture shift first**:
Read [Chronicles](https://github.com/Tobi007-del/tmg-media-player/blob/main/CHRONICLES.md) and [Interaction Folklore](https://github.com/Tobi007-del/tmg-media-player/blob/main/FOLKLORE.md), then continue here.
- **I just need to use this fast**:
Jump directly to [Getting Started](#getting-started) and [API Reference](#api-reference).

---

## Getting Started

### Installation

Install via your preferred package manager:

```bash
npm install sia-reactor
# or
yarn add sia-reactor
# or
pnpm add sia-reactor
```

```javascript
// 1. Core Engine
import { reactive, Reactor, TERMINATOR } from "sia-reactor";

// 2. Deep Object Utilities
import { setAny, getAny, mergeObjs } from "sia-reactor/utils";
```

---

## Usage

### Modern Bundlers (ESM)

```javascript
import { reactive, Reactor } from "sia-reactor";
import "sia-reactor/utils"; // deep object helpers (setAny/getAny/deleteAny/inAny/parseAnyObj/fanout/mergeObjs/deepClone/nuke...) take note of `fanout`!
import "sia-reactor/modules"; // built-in modules + storage adapters
import "sia-reactor/adapters/vanilla"; // Autotracker + effect API + TimeTravelOverlay class
import "sia-reactor/adapters/react"; // useReactor/useSelector/usePath hooks
import "sia-reactor/styles/time-travel-overlay.css"; // TimeTravelOverlay CSS
```

### CDN / Browser (Global)

```html
<!DOCTYPE html>
<html>
<body>
  <script src="https://cdn.jsdelivr.net/npm/sia-reactor@latest"></script>
  <script>
    const { reactive, Reactor } = window.sia;
    window.sia.utils;
    window.sia.modules;
    window.sia.adapters.vanilla;    
  </script>
</body>
</html>
```

## API Reference

### Initialization (`reactive` & `Reactor`)

The primary way to use the reactor is to wrap an object using `reactive(target, build, preferences)`, which directly mixes the reactor methods into your target object for a pristine, flat API.

*NOTE: `.` and `*` are engine reserved so don't use them as object keys*

```javascript
const state = reactive({ player: { volume: 50 } }, { smartCloning: true, referenceTracking: true });

// Public API Methods are attached directly to the object with `reactive()`!
state.set("player.volume", (val) => Math.min(val, 100));
state.on("player.volume", (e) => console.log(e.value));

state.player.volume = 150; // Triggers mediation, clamps to 100, fires listener.
getReactor(state); state.__Reactor__; // Reference to the underlying reactor
```

Alternatively, you can instantiate the `Reactor` class directly to keep the API from interfering with your data or [try this](#reactive-preferences-method-naming):
```javascript
const reactor = new Reactor({ player: { volume: 50 } }, { debug: true });
reactor.core.player.volume = 100; // re-assign core if desired
```

### Core Methods

All methods are available on `Reactor` instances or objects wrapped in `reactive()`.

#### **Mediators (Synchronous Gatekeepers)**
- **`set(path, callback, options)` <-> `noset(path, callback)`**: Intercept memory writes. Return a value to modify it, or return `TERMINATOR` to block the write entirely.
- **`get(path, callback, options)` <-> `noget(path, callback)`**: Intercept and format data during retrieval.
- **`delete(path, callback, options)` <-> `nodelete(path, callback)`**: Intercept property deletion.

#### **Watchers (Synchronous Observers)**
- **`watch(path, callback, options)` <-> `nowatch(path, callback)`**: Fires instantly after a mutation. Use strictly for critical internal engine syncing on leaf paths preferably, sees only direct operations.

#### **Listeners (Asynchronous/Batched UI Observers)**
- **`on(path, callback, options)` <-> `off(path, callback, options)`**: Attach DOM-style event listeners that respect `depth`. Supports `{ capture: true, depth: 1, once: true, immediate: true }`.
- **`once(path, callback, options)`**: Fires once and self-destructs, others have too: `sonce(...)`, `gonce(...)`, `donce(...)`, `wonce(...)`.

#### **Lifecycle & Utilities**
- **`tick(path)`**: Forces a synchronous flush of the batch queue for a specific path.
- **`stall(task)` <-> `nostall(task)`**: Manually stall the queue to wait for calculations before rendering.
- **`snapshot(raw)`**: Generates a strict, structurally-shared, un-proxied clone of the current state tree.
- **`use(new ReactorModule(config), id)`**: Allows extended behaviour with external logic.
- **`reset()`**: Clears all records bringing everything back to a clean slate.
- **`destroy()`**: Last resort destruction, nukes everything by nullifying it's properties for full disposal, lives on every class.

### Memory & Granular Control Flags

You can wrap properties in special flags *before* initializing the reactor to dictate exactly how the Proxy treats them. e.g. `reactive(volatile(intent({ behavior: "auto" })))`, e.t.c.

- **`intent(obj)` <-> `state(obj)`**: Marks an object as rejectable. Allows listeners to call `e.reject()` during the Capture phase.
- **`inert(obj)` <-> `live(obj)`**: Tells the proxy to completely ignore an object. It will not be deeply tracked.
- **`volatile(obj)` <-> `stable(obj)`**: Forces the reactor to fire event waves even if the new value is identical to the old value (bypassing the Proxy's unchanged performance check).

```javascript
import { reactive, intent, volatile, inert } from "sia-reactor";

const data = reactive({
  apiResponse: inert({ heavy: "data" }), // Proxy won't traverse this
  userWish: intent({ flying: false }),  // Can be rejected by a Handler or a Higher Power
  trigger: volatile({ clickCount: 0 })  // Fires events even if set to 0 again
});
```

### React Hooks & Effects

The engine provides native React bindings utilizing `useSyncExternalStore` and an internal `Autotracker` for concurrent-safe, surgically precise component re-renders. All hooks natively accept a `Reactor` instance, a `reactive()` proxy, or a plain object (which will be auto-wrapped on the fly). Just import, your editor will reveal more details.

```javascript
import { reactive } from "sia-reactor";
import { useReactor, useAnyReactor, useSelector, useAnySelector, usePath, effect } from "sia-reactor/adapters/react"; 

const state = reactive({ user: { name: "Kosi", age: 25 }, theme: "dark" });

// 1. The Tracked State (Valtio-style)
function Profile() {
  const sameState = useReactor(state); // `useReactorSnapshot()` if mutable issues arise
  useAnyReactor(); // when you just want state from any reactor
  // Only re-renders if state.user.name mutates. Completely ignores age and theme!
  return <div>{sameState.user.name + otherState.user.name}</div>;
} // no snapshots like Valtio, you can read or write to anything

// 2. The Slice Selector (Zustand-style)
function Theme() {
  const theme = useSelector(state, (s) => s.theme); // `useSelectorSnapshot()` if mutable issues arise
  const newName = useAnySelector(() => state.user.name + spouseState.user.name); // when you just want to derive any state from any reactor
  return <div>Theme: {theme}</div>;
}

// 3. The Direct Path Observer
function AgeObserver() {
  const age = usePath(state, "user.age"); // pass in a normal object for an auto-scoped instance
  return <div>Age: {age}</div>;
}

// 4. Vanilla Side Effects (Runs anywhere, framework agnostic)
const stopTracking = effect(() => console.log("User name changed to:", state.user.name)); // read or write as you wish
```

### Modules: The Extension Port

The `Reactor` is designed to be a lightweight core. Extended capabilities are attached via Modules. It ships with a suite of powerful modules for common architectural needs.

#### The Persistence Module
Automatically syncs your State to LocalStorage, SessionStorage, Memory or IndexedDB. Always use this module first to avoid re-initialization issues.

```javascript
import { reactive, Reactor, getReactor } from "sia-reactor";
import { PersistModule, LocalStorageAdapter, IndexedDBAdapter, SessionStorageAdapter, CookieAdapter, MemoryAdapter } from "sia-reactor/modules";

const state = reactive({ theme: "dark", settings: { volume: 50, brightness: 30 } });
const persist = new PersistModule({ // Plug it in. State is now automatically hydrated and throttled-saved.
  key: "APP_PREFS",
  paths: ["theme", "settings.brightness"],
  throttle: 5000, 
  fanout: true, // async hydration should use leaf writes to sync already initialized listeners.
  adapter: new IndexedDBAdapter({ dbName: "Session", version: 1, onversionchange: () => location.reload(), useSnapshot: true }) // or `LocalStorageAdapter` (instance or signature)
};
state.use(persist, getReactor(state)));  // Put `Reactor` as second constructor arg if you want type inference, e.g. for the paths in the array.
```

#### The Time Travel Module
Record state frames, step through history, and optionally attach a ready-to-use vanilla debug overlay.

```javascript
import { TimeTravelModule } from "sia-reactor/modules";
import { effect, TimeTravelOverlay } from "sia-reactor/adapters/vanilla";
import "sia-reactor/css/time-travel-overlay.css";

const time = new TimeTravelModule({ maxHistory: 300, loop: false, rate: 150 });
state.use(time);

// If persist uses an async adapter (e.g. IndexedDB), wait till after hydration:
persist.state.once("hydrated", () => state.use(time)); // starts `false`, one-time stall until it flips
effect(() => persist.state.hydrated && state.use(time), { once: true }) // same logic, different look :)

const overlay = new TimeTravelOverlay(time, { color: "#e26e02", startOpen: false, devOnly: true, container: document.body }); // optional debug interface for visulazation
```
```jsx
import { TimeTravelOverlay } from "sia-reactor/adapters/react";

<TimeTravelOverlay time={time} color="#e26e02" startOpen devOnly /> // react-safe instance lifecycle management, e.g. for HMR predictability.
```

Useful methods: `play()`, `pause()`, `rewind()`, `clear()`, `undo()`, `redo()`, `step(n, forward)`, `jumpTo(frame)`, `export(replacer)`, `import(json, reviver)`.

### Reactor Build Options

These are some core build options accepted by `new Reactor(core, build)` and `reactive(core, build, preferences)` configurable via `Reactor.config`.

- **`debug?`**: 1-time set. Enables debug logging and diagnostics of core operations. (default: `false`)
- **`crossRealms?`**: Enables cross-realm object detection support by using slower but safer type checks. (e.g. iframes) (default: `false`).
- **`smartCloning?`**: Enables structural-sharing snapshot behavior (requires `referenceTracking: true`) (default: `false`).
- **`eventBubbling?`**: Enables event bubbling across ancestor paths (default: `true`) (default: `true`).
- **`lineageTracing?`**: Enables path lineage tracing for reference lookups on property access (requires `referenceTracking: true`) (default: `false`).
- **`preserveContext?`**: Preserves Reflect trap context; safer with ~8x slowdown in hot paths, allows more types to be proxied (e.g. classes) (default: `false`).
- **`equalityFunction?`**: Custom equality used by setters and adapter comparisons (default: `Object.is`).
- **`batchingFunction?`**: Custom batching scheduler for listener notification flushes (default: `queueMicrotask`)
- **`referenceTracking?`**: Enables identity/reference tracking features in the runtime. (default: `false`).

### Reactive Preferences (Method Naming)

`reactive(core, build, preferences)` also accepts method naming preferences so you can expose Reactor APIs with custom names.

- **`prefix?`**: Adds a prefix to exposed method names.
- **`suffix?`**: Adds a suffix to exposed method names.
- **`whitelist?`**: Keeps specific methods on their original names while others get affixed.

```javascript
import { reactive } from "sia-reactor";

const state = reactive(
  { count: 0 },
  { debug: false },
  {
    prefix: '$',
    suffix: 'Now',
    whitelist: ['set', 'get', 'on', 'off'] // keys you're sure won't interfere with your own key names
  }
);
// Whitelisted methods keep original names
state.set('count', (v) => v + 1);
state.get('count', (v) => v);
// Non-whitelisted methods are affixed
state.$watchNow('count', (v) => console.log(v));
state.$snapshotNow();
```

### Migration: Method API to State/Event Protocol

If you are moving from command-style APIs (`play()`, `pause()`, `setVolume(x)`), map them into intent/state flows.

- `player.play()` -> `player.intent.playing = true`
- `player.pause()` -> `player.intent.playing = false`
- `player.setVolume(80)` -> `player.intent.volume = 80`
- tech/system confirmation -> `player.state.playing = true`, `player.state.volume = 80`

```javascript
// old style
player.play();
player.setVolume(80);

// S.I.A protocol
player.intent.playing = true;
player.intent.volume = 80;

player.set("intent.volume", (v) => Math.max(0, Math.min(100, v))); // gatekeeper
player.on("intent.playing", (e) => {
  if (!player.status.ready) return e.reject("media not ready");
  player.state.playing = true; // factual mirror
}, { capture: true });
```

### Troubleshooting

- Listener timing feels late: `on(path, ...)` is microtask-batched by design; use `watch(path, ...)` only for strict immediate engine sync on leaf paths preferably.
- Listeners don't react to changes: use `fanout(target, object, { depth: n })` instead of direct object sets to keep immutable semantics.
- `reject()` appears ignored: call it in capture phase and ensure branch is wrapped in `intent(...)`, also remember it's the listener's choice to comply.
- Snapshot behavior feels stale: enable `referenceTracking: true` with `smartCloning: true`, also use these when persisting to environments that don't take proxies, e.g. IndexedDB.
- Cross-frame data is skipped: enable `crossRealms: true` for iframe/other realm objects.
- Class/prototype behavior is odd: enable `preserveContext: true` (tradeoff: slower hot paths).
- Working with symbol keys and you want blind writes/reads: unwrap first with `getRaw` or `RAW` and operate on the raw object.

---

## Notification Physics

The S.I.A. Reactor operates in two distinct dimensions: **The Synchronous Dimension** (Gatekeepers & Watchers) and **The Asynchronous Dimension** (Listeners). Because they intercept data at entirely different points in time, they receive different objects and possess different capabilities.

### 1. The Synchronous Dimension: The `Payload`
When you use `.get()`, `.set()`, `.delete()`, or `.watch()`, you are sitting *directly inside the Javascript Proxy Trap*. The memory has not been written yet (or is being written right at that exact millisecond). 

Because there is no "bubbling" or "event wave" yet, these methods do not receive an event object. They receive a lightweight, factual `Payload`.

#### The `Payload` Anatomy
```javascript
rtr.set("user.age", (value, terminated, payload) => {
  console.log(payload.type);       // "set" | "get" | "delete"
  console.log(payload.target);     // The exact anatomy of the mutation (see below)
  console.log(payload.root);       // Reference to the entire `state` tree
  console.log(payload.terminated); // Boolean: Did a previous mediator kill this action?
  console.log(payload.rejectable); // Boolean: Is this target wrapped in `intent()`?
}); // you could use external callbacks but typed with `Payload<T, "user.age">`
rtr.get("user.age", (value, payload) => {});
rtr.delete("user.age", (terminated, payload) => {});
rtr.watch("user.age", (value, payload) => {});
```

#### The `Target` Anatomy (Inside the Payload)
The `target` and `currentTarget` objects give you absolute surgical awareness of the memory reference:
```javascript
{
  path: "user.age",          // The full dot-path being accessed
  value: 26,                 // The NEW value attempting to be written
  oldValue: 25,              // The CURRENT value sitting in memory
  key: "age",                // The specific property key
  hadKey: true,              // If the key existed on the parent object
  object: { age: 25 }        // The actual memory reference of the parent object
}
```

#### The Power of the `TERMINATOR` (Symbol.for("S.I.A_TERMINATOR"))
Because `set` and `delete` mediators execute *before* the memory is written, you have the power to alter reality or stop it entirely using the `TERMINATOR` symbol.

```javascript
import { TERMINATOR } from "sia-reactor";

// Example: Data Sanitization & Blocking
rtr.set("user.age", (value) => {
  if (typeof value !== "number") return TERMINATOR; // 🛡️ Kills the memory write entirely!
  return Math.max(0, value); // Modifies the value before it hits memory
});
```

### 2. The Asynchronous Dimension: The S.I.A. Event Loop
When you use `.on()` or `.once()` (Listeners), you are sitting in the **Microtask Queue**. The memory has already been safely written, the Proxy traps have closed, and the engine is now broadcasting a DOM-Style "Mutation Wave" across the state tree.

If you mutate `state.user.profile.name = "Kosi"`, the event wave travels like this:
1. **Capture Phase:** `*` (Root) ➔ `user` ➔ `user.profile`
2. **Target Phase:** `user.profile.name`
3. **Bubble Phase:** `user.profile` ➔ `user` ➔ `*` (Root)

*NOTE: Only `on` does this since it is batched to stay within recursive limits.*

#### The Event Anatomy (`REvent` type)
Listeners receive a `ReactorEvent` (`REvent`). This object *inherits* everything from the `Payload`, but adds **Political Event Routing**, providing absolute surgical awareness of what is happening in the tree.

```javascript
rtr.on("user.profile", (e) => {
  // 1. Inherited Facts
  console.log(e.type);          // "update" (Because a child mutated)
  console.log(e.staticType);    // "set" (The original action)
  console.log(e.path);          // "user.profile.name" (The actual property changed)
  console.log(e.currentTarget); // { path: "user.profile", value: {...} } (Where we are listening)
  console.log(e.value);         // "Kosi" (The new value)
  console.log(e.oldValue);      // "John" (The previous value)
  // 2. Political Routing
  console.log(e.eventPhase);    // 3 (Bubbling Phase)
  console.log(e.bubbles);       // true/false 
  // 3. Misc
  console.log(e.composedPath()); // ["Kosi", { name: "Kosi", age: 26 }, { profile: { name: "Kosi", age: 26 } }, { user: { profile: { name: "Kosi", age: 26 } } }] (refs, target -> root)
}); // you could use external callbacks but typed with `REvent<T, "user.age">`
```

#### Event Control Flow

Just like the browser DOM, you have absolute political control over the event wave:

* **`e.stopPropagation()`**: Stops the wave from traveling to the next node in the chain.
* **`e.stopImmediatePropagation()`**: Stops the wave instantly, preventing even other listeners on the *current* node from hearing it.
* **`e.reject("Reason")`**: Used exclusively during the Capture Phase on `intent()` objects to formally deny a state request.
* **`e.resolve("Message")`**: Formally grants an intent (optional, as intents naturally resolve if unrejected).

```javascript
// A Higher Power blocking an intent
rtr.on("intent.playing", (e) => {
  if (!user.isLoggedIn) {
    e.reject("User must be logged in to play media.");
    e.stopPropagation(); // Kill the wave here
  }
}, { capture: true }); // Must listen on the Capture Phase!
```

#### The Magic of `e.type === "update"`

When you listen to a parent object (like `"user.profile"`), you will naturally catch all mutations to its children. 

To help you instantly differentiate between the object *itself* being replaced, versus a *child* property mutating deep inside of it, the Reactor intelligently morphs the `e.type`:
* If `state.user.profile = {}` happens, the listener receives `e.type === "set"`.
* If `state.user.profile.name = "Kosi"` happens, the parent listener receives `e.type === "update"`.

This allows for highly fine-grained syncing bridges across your application without writing heavy for-loop diffing algorithms! Use `{ depth: n }` to control how deep the path bubbles you see are, i.e. 

```javascript
rtr.on("todos", (e) => console.log(e), { depth : 1 }); // only sees updates on direct children
```

Typing tip (for depth-aware `update` narrowing): `depth` mainly affects inferred `target.key` unions. To preserve type narrowing where desired, avoid destructuring in the callback signature. Types can be too accurate thereby causing issues, cast where necessary. e.g. `e.value as any`.

```javascript
// Less reliable inference for depth-aware unions
rtr.on("todos", ({ type, target: { path, key } }) => {
  if (type === "update") console.log(path, key);
}, { depth: 1 });
// Better: narrow first, then destructure inside
rtr.on("todos", (e: REvent<User, "todos", 1>) => {
  if (e.type === "update") {
    const { path, key } = e.target;
    console.log(path, key); // or e.target.path, e.target.key
  }
}, { depth: 1 }); // you need the generic for external callbacks only
```

---

## Architectural Tricks

### The CSS Black Box

Imagine you have 50 different CSS variables in your state (`settings.css.containerWidth`, `settings.css.themeColor`, etc.). Registering 50 individual `watch()` or `on()` listeners would need manual css crawling that will be blind to dynamically added variables.

Instead, we use the **Root Wildcard** (`"*"`) for both Reading (`get`) and Writing (`watch`).

#### 1. The Write (State -> DOM)

```javascript
// Intercept EVERY mutation, but quickly filter for our CSS namespace
this.ctlr.config.watch("*", (val, { target: { key, path } }) => {
  if (path.startsWith("settings.css.")) this.updateActualCSSVariable(key, val); // Paint to the DOM instantly
}, { signal: this.signal });
```

#### 2. The Read (DOM -> State)
```javascript
this.ctlr.config.get("*", (val, { target: { key, path } }) => {
  if (!path.startsWith("settings.css.")) return val;
  // Intercept the read, and return it. store in a CSSOM cache once if you want to reset later.
  return ((this._cache[key] ||= val = this.getActualCSSVariable(key)), val);
});
```
#### Why this pattern is elite:
1. **Synchronous Execution (`watch`):** CSSOM needs immediate updates. If you used an `.on()` listener, a slow browser might paint the old frame before the microtask resolves, causing UI flicker. `.watch()` executes synchronously during the proxy trap.
2. **The Wildcard Tradeoff:** By listening to `*`, this callback runs synchronously on *every single mutation* in the entire reactor. This is the only synchronous way to catch deep nested updates.
3. **The Ultimate Illusion:** A developer writes `console.log(state.settings.css.themeColor)`. To them, it looks like a standard plain object property access. In reality, the Reactor just executed a surgical DOM read. It is a true black box.

---

## Inspirations

S.I.A. Reactor synthesizes core concepts from the heavyweights of web and media engineering into a single, zero-allocation engine:

* **The Native JavaScript Proxy API:** Arguably the most powerful, slept-on feature in the ECMAScript specification. The Reactor is essentially a love letter to the Proxy API, packaging its raw, interception-level power into a structured and safe Data DOM so the community can finally use what it's truly capable of.
* **Video.js (VJS):** The philosophy of "Intent vs. State" MEDIATION, ensuring UI actions only commit when the underlying engine allows it.
* **The Browser DOM:** Treating a raw JSON state tree like HTML nodes, complete with deep, path-based event bubbling.
* **Vue, MobX & Valtio:** Leveraging native ES6 Proxies for instant, deep reactivity without forcing clunky `get()` or `set()` wrapper functions.
 
---

## Benchmarks

No fancy screenshots here. True engineers look at performance metrics.

To see the Reactor handle deep DAG mutations, DOM-style event routing, and microtask batching in real-time, visit the **[Live Demo](https://tobi007-del.github.io/t007-tools/packages/sia-reactor/src/index.html)**, open your DevTools console, and run the built-in Grand Master Stress Suite directly on your own CPU.

*NOTE: The reactor is progressively enhanced so it's performance depends on how you use it and the options you toggle, it's base form is incredibly light.*

---

## Author

- Architect & Developer - [Oketade Oluwatobiloba (Tobi007-del)](https://github.com/Tobi007-del)
- Project - [t007-tools](https://github.com/Tobi007-del/t007-tools)

## Acknowledgments

Designed to bring absolute architectural dominance and rendering efficiency to complex front-end systems. The foundational data layer of the `@t007` and `tmg` ecosystem.

## Star History

If you find this project useful, please consider giving it a star! ⭐

[![Star History Chart](https://api.star-history.com/svg?repos=Tobi007-del/t007-tools&type=Date)](https://github.com/Tobi007-del/t007-tools)

**[⬆ Back to Top](#sia-reactor)**