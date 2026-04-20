import "@t007/utils";

/** Toast severity level. */
export type ToastType = "info" | "success" | "error" | "warning";
/** Screen anchor for toast placement. */
export type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right"
  | "center-left"
  | "center-center"
  | "center-right";
/** Motion preset used when a toast enters or leaves the screen. */
export type ToastAnimation =
  | "fade"
  | "zoom"
  | "slide"
  | "slide-left"
  | "slide-right"
  | "slide-up"
  | "slide-down"
  | boolean;
/** Allowed drag directions for dismiss gestures. */
export type ToastDragDir =
  | "x"
  | "y"
  | "xy"
  | "x|y"
  | "x||y"
  | "x+"
  | "x-"
  | "y+"
  | "y-"
  | "xy+"
  | "xy-"
  | "x|y+"
  | "x|y-"
  | "x||y+"
  | "x||y-";

/** Configuration object for creating and updating a toast. */
export interface ToastOptions {
  /** Explicit toast id. */
  id?: string;
  /** Prefix used when ids are generated automatically. */
  idPrefix?: string;
  /** Delay before the toast is initialized. */
  delay?: number | null;
  /** Container element used to host toast stacks. */
  rootElement?: HTMLElement;
  /** Text rendered as the toast body. */
  render?: string | (() => string);
  /** Rich HTML rendered as the toast body. */
  bodyHTML?: string | (() => string);
  /** Severity variant for default styling and icons. */
  type?: ToastType;
  /** Custom icon HTML or a boolean that selects the default icon. */
  icon?: string | boolean;
  /** Optional image url shown beside the message. */
  image?: string | false;
  /** Auto-close delay in milliseconds, or false to keep open. */
  autoClose?: number | boolean;
  /** Where the toast stack should appear. */
  position?: ToastPosition;
  /** Loading state used by promise flows and deferred updates. */
  isLoading?: boolean | string;
  /** Show or hide the close button. */
  closeButton?: boolean;
  /** Close the toast when the body is clicked. */
  closeOnClick?: boolean;
  /** Hide the progress bar. */
  hideProgressBar?: boolean;
  /** Pause auto-close while the pointer is over the toast. */
  pauseOnHover?: boolean;
  /** Pause auto-close while the document is hidden. */
  pauseOnFocusLoss?: boolean;
  /** Enable drag-to-dismiss gestures and optionally limit pointer types. */
  dragToClose?: boolean | "mouse" | "pen" | "touch";
  /** Percentage threshold needed to dismiss by drag. */
  dragToClosePercent?: number | { x?: number; y?: number };
  /** Axis or direction filter used by the drag gesture system. */
  dragToCloseDir?: ToastDragDir;
  /** Remove other toasts with the same tag before showing this one. */
  renotify?: boolean;
  /** Arbitrary tag used for grouping, filtering, and renotify matching. */
  tag?: string | number;
  /** Trigger vibration when the toast appears. */
  vibrate?: boolean | number[];
  /** Entry/exit animation preset. */
  animation?: ToastAnimation;
  /** Put new toasts at the front of the stack. */
  newestOnTop?: boolean;
  /** Maximum number of toasts allowed in a container. */
  maxToasts?: number;
  /** Action buttons rendered under the message body. */
  actions?: Record<string, (e: MouseEvent, toast: ToastInstance) => void> | false;
  /** Callback fired when the toast closes. */
  onClose?: (timeElapsed?: boolean | false) => void;
  /** Callback fired as the toast auto-close timer advances. */
  onTimeUpdate?: (timeVisible: number) => void;
  [key: string]: any; // To allow arbitrary overrides internally if needed
}

/** Live toast instance returned by the runtime. */
export interface ToastInstance {
  /** Unique toast id. */
  id: string;
  /** Current option bag applied to the instance. */
  opts: ToastOptions;
  /** Pending timeouts waiting to apply queued updates. */
  queue: number[];
  /** Whether the toast has been removed from the DOM. */
  destroyed: boolean;
  /** Root DOM node for the toast. */
  toastElement: HTMLElement;
  /** Build the DOM node and attach it to the stack. */
  init(): void;
  /** Apply new options and return the toast id.
   * @param options Options to apply.
   * @returns Toast id.
   */
  update(options: ToastOptions): string;
  /** Resume auto-close progress. */
  play(): void;
  /** Pause auto-close progress. */
  pause(): void;
  /** Remove the toast from view.
   * @param manner Removal mode.
   * @param timeElapsed Whether the auto-close timer already elapsed.
   */
  _remove(manner?: "smooth" | "instant", timeElapsed?: boolean): void;
}

/** Promise state configuration used by toast.promise. */
export interface ToastPromiseState<T = any> extends Omit<ToastOptions, "render" | "bodyHTML"> {
  /** Render text for the promise state. */
  render?: string | ((response: T) => string);
  /** Render HTML for the promise state. */
  bodyHTML?: string | ((response: T) => string);
}

/** Configuration object accepted by toast.promise. */
export interface ToastPromiseConfig<T = any> {
  /** Pending-state text or options. */
  pending?: string | ToastOptions;
  /** Success-state text or options. */
  success?: string | ToastPromiseState<T>;
  /** Error-state text or options. */
  error?: string | ToastPromiseState<any>;
}

/** Public toast API exposed to consumers. */
export interface Toast {
  /** Create a default toast.
   * @param render Body text for the toast.
   * @param options Toast configuration.
   * @returns Toast id.
   */
  (render?: string, options?: ToastOptions): string;
  /** Update an existing toast by id.
   * @param id Toast id.
   * @param options Options to apply.
   * @returns Updated toast id or false when no toast was found.
   */
  update(id: string, options: ToastOptions): string | false;
  /** Show an info toast.
   * @param render Body text.
   * @param options Toast configuration.
   * @returns Toast id.
   */
  info(render?: string, options?: ToastOptions): string;
  /** Show a success toast.
   * @param render Body text.
   * @param options Toast configuration.
   * @returns Toast id.
   */
  success(render?: string, options?: ToastOptions): string;
  /** Show a warning toast.
   * @param render Body text.
   * @param options Toast configuration.
   * @returns Toast id.
   */
  warn(render?: string, options?: ToastOptions): string;
  /** Show an error toast.
   * @param render Body text.
   * @param options Toast configuration.
   * @returns Toast id.
   */
  error(render?: string, options?: ToastOptions): string;
  /** Show a loading toast.
   * @param render Body text.
   * @param options Toast configuration.
   * @returns Toast id.
   */
  loading(render?: string, options?: ToastOptions): string;
  /** Bind a promise to the toast lifecycle.
   * @param promise Promise to observe.
   * @param options Pending, success, and error states.
   * @returns The original promise.
   */
  promise<T>(promise: Promise<T>, options?: ToastPromiseConfig<T>): Promise<T>;
  /** Dismiss a single toast or the whole stack.
   * @param id Toast id to dismiss.
   * @param manner Removal mode.
   * @param timeElapsed Whether the auto-close timer already elapsed.
   */
  dismiss(id?: string, manner?: "smooth" | "instant", timeElapsed?: boolean): void;
  /** Dismiss every toast that matches an optional prefix.
   * @param idPrefix Optional id prefix filter.
   */
  dismissAll(idPrefix?: string): void;
  /** Run an action against every matching toast instance.
   * @param action Instance method to invoke.
   * @param options Options forwarded to the instance method.
   * @param idPrefix Optional id prefix filter.
   */
  doForAll(action: string, options?: any, idPrefix?: string): void;
  /** Return every matching toast instance.
   * @param idPrefix Optional id prefix filter.
   * @returns Matching toast instances.
   */
  getAll(idPrefix?: string): ToastInstance[];
}

/** Helper methods used internally by toaster() and promise flows. */
export interface Toasting {
  /** Update an existing toast or recreate it if needed.
   * @param base Toast factory to use.
   * @param id Toast id.
   * @param options Options to apply.
   * @returns Updated id or false when no toast exists.
   */
  update(base: Toast, id: string, options: ToastOptions): boolean | string;
  /** Attach a helper like info/success/warn/error to the base toast function.
   * @param base Toast factory to extend.
   * @param defaults Default option factory.
   * @param action Helper name to create.
   */
  message(base: Toast, defaults: () => ToastOptions, action: string): void;
  /** Create a loading toast from an id or a message.
   * @param base Toast factory to use.
   * @param renderOrId Toast id or loading text.
   * @param options Loading options.
   * @returns Toast id.
   */
  loading(base: Toast, renderOrId: string, options?: ToastOptions): string;
  /** Bind promise resolution states to an active toast.
   * @param base Toast factory to use.
   * @param promise Promise to observe.
   * @param config Promise state configuration.
   * @returns The original promise.
   */
  promise<T>(base: Toast, promise: Promise<T>, config?: ToastPromiseConfig<T>): Promise<T>;
  /** Dismiss a toast by id or clear all matching toasts.
   * @param base Toast factory to use.
   * @param id Toast id.
   * @param manner Removal mode.
   * @param timeElapsed Whether the auto-close timer already elapsed.
   */
  dismiss(base: Toast, id?: string, manner?: string, timeElapsed?: boolean): void;
  /** Dismiss all matching toasts.
   * @param base Toast factory to use.
   * @param idPrefix Optional id prefix filter.
   */
  dismissAll(base: Toast, idPrefix?: string): void;
  /** Run a method on every matching toast instance.
   * @param base Toast factory to use.
   * @param action Instance method to invoke.
   * @param options Options forwarded to the instance method.
   * @param idPrefix Optional id prefix filter.
   */
  doForAll(base: Toast, action: string, options?: any, idPrefix?: string): void;
  /** Return every matching toast instance.
   * @param base Toast factory to use.
   * @param idPrefix Optional id prefix filter.
   * @returns Matching toast instances.
   */
  getAll(base: Toast, idPrefix?: string): ToastInstance[];
}

// BUNDLE EXPORTS & GLOBAL DECLARATIONS

/** Internal helper methods used by the toast factory. */
export const toasting: Toasting;
/** Create a toast factory with custom defaults.
 * @param defOptions Default options merged into every toast.
 * @param idPrefix Prefix applied to generated ids.
 * @returns Toast factory.
 */
export function toaster(defOptions?: ToastOptions, idPrefix?: string): Toast;
/** Default toast factory instance attached by the bundle. */
declare const toast: Toast;
export default toast;

declare global {
  interface T007Namespace {
    /** Default toast factory instance. */
    toast: Toast;
    /** Lower-level helper methods used by the toast factory. */
    toasting: Toasting;
    /** Factory used to create isolated toast instances. */
    toaster: typeof toaster;
    /** Registry of live toast instances. */
    toasts: Map<string, ToastInstance>;
    /** Default runtime options merged into every toast. */
    TOAST_DEFAULT_OPTIONS: ToastOptions;
    /** Default auto-close durations by toast type. */
    TOAST_DURATIONS: Record<ToastType, number>;
    /** Default vibration patterns by toast type. */
    TOAST_VIBRATIONS: Record<ToastType, number[]>;
    /** Default SVG icons by toast type. */
    TOAST_ICONS: Record<ToastType | "loading", string>;
  }
  interface Window {
    Toast?: Toast;
  }
}
