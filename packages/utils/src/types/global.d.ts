import type { ScrollAssistControl } from "../quirks/scroll";

declare global {
  interface T007Namespace {
    /** Symbol used to mark virtual resources that should not load a real asset. */
    VIRTUAL_RESOURCE: symbol;
    /** Cache used to deduplicate resource loading promises. */
    _resourceCache: Partial<Record<string, Promise<HTMLElement | void>>>;
    /** Active scroll assist controllers keyed by element. */
    _scrollers?: WeakMap<HTMLElement, ScrollAssistControl>;
    /** Resize observer used by scroll assist controllers. */
    _scroller_r_observer?: ResizeObserver;
    /** Mutation observer used by scroll assist controllers. */
    _scroller_m_observer?: MutationObserver;
  }
  interface Window {
    /** Shared T007 namespace. */
    t007: T007Namespace;
    /** CDN entrypoint for @t007/toast. */
    T007_TOAST_JS_SRC?: string;
    /** CDN entrypoint for @t007/input. */
    T007_INPUT_JS_SRC?: string;
    /** CDN entrypoint for @t007/dialog. */
    T007_DIALOG_JS_SRC?: string;
    /** CDN stylesheet for @t007/toast. */
    T007_TOAST_CSS_SRC?: string;
    /** CDN stylesheet for @t007/input. */
    T007_INPUT_CSS_SRC?: string;
    /** CDN stylesheet for @t007/dialog. */
    T007_DIALOG_CSS_SRC?: string;
  }
  /** Shared T007 namespace on the global object. */
  var t007: T007Namespace;
}

export {};