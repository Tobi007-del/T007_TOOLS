// Global Types
export type * from "./types/global.d.ts";
// Core
export * from "./core/num";
export * from "./core/str";
export * from "./core/dom";
// Mixins
export * from "./mixins/methodist";
// Quirks
export * from "./quirks/scroll";

if (typeof window !== "undefined") {
  window.t007 ??= {} as any;

  window.T007_TOAST_JS_SRC ??= `https://cdn.jsdelivr.net/npm/@t007/toast@latest`;
  window.T007_INPUT_JS_SRC ??= `https://cdn.jsdelivr.net/npm/@t007/input@latest`;
  window.T007_DIALOG_JS_SRC ??= `https://cdn.jsdelivr.net/npm/@t007/dialog@latest`;
  
  window.T007_TOAST_CSS_SRC ??= `https://cdn.jsdelivr.net/npm/@t007/toast@latest/dist/style.css`;
  window.T007_INPUT_CSS_SRC ??= `https://cdn.jsdelivr.net/npm/@t007/input@latest/dist/style.css`;
  window.T007_DIALOG_CSS_SRC ??= `https://cdn.jsdelivr.net/npm/@t007/dialog@latest/dist/style.css`;
}