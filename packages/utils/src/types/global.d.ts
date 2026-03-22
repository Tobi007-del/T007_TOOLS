import type { ScrollAssistControl } from "../quirks/scroll";

declare global {
  interface T007Namespace {
    _resourceCache: Partial<Record<string, Promise<HTMLElement | void>>>;
    _scrollers?: WeakMap<HTMLElement, ScrollAssistControl>;
    _scroller_r_observer?: ResizeObserver;
    _scroller_m_observer?: MutationObserver;
  }

  interface Window {
    t007: T007Namespace;

    T007_TOAST_JS_SRC?: string;
    T007_INPUT_JS_SRC?: string;
    T007_DIALOG_JS_SRC?: string;
    
    T007_TOAST_CSS_SRC?: string;
    T007_INPUT_CSS_SRC?: string;
    T007_DIALOG_CSS_SRC?: string;
  }

  var t007: T007Namespace;
}

export {};