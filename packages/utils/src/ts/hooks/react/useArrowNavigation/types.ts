export type KeyEvent = Partial<KeyboardEvent> & Pick<KeyboardEvent, "key">;

export type Config = {
  /** Enables or disables navigation logic. Defaults to `null`. */
  enabled?: boolean | null;
  /** CSS selector used to collect focusable nav items. Defaults to `"[data-arrow-item]"` */
  selector?: string;
  /** Whether hover should also move active selection. Defaults to `true`. */
  focusOnHover?: boolean;
  /** Whether directional movement wraps around edges. Defaults to `true`. */
  loop?: boolean;
  /** Enables virtual focus (aria-activedescendant) mode. Defaults to `false`. */
  virtual?: boolean;
  /** Enables alphanumeric type-ahead matching. Defaults to `false`. */
  typeahead?: boolean;
  /** Idle timeout before clearing type-ahead buffer (ms). Defaults to `500`. */
  resetMs?: number;
  /** Explicit RTL override; null auto-detects from computed style. Defaults to `null`. */
  rtl?: boolean | null;
  /** Enables roving tabindex when not in virtual mode. Defaults to `null`. */
  rovingTab?: boolean | null;
  /** Default tabbable index when no active item is selected. Defaults to `null`. */
  defaultTabbableIndex?: number | null;
  /** Base tabindex for non-active items, use `"-1"` to kill virtual list. Defaults to `"0"`. */
  baseTabIndex?: string;
  /** Class applied to active item in virtual mode. Defaults to `"focus-outlined"`. */
  activeClass?: string;
  /** Selector used for keyboard event source in virtual mode. Defaults to `"input[value],textarea,[contenteditable='true']"`. */
  inputSelector?: string;
  /** Scroll behavior options used when moving active item. Defaults to `{ block: "nearest", inline: "nearest" }`. */
  scrollIntoView?: ScrollIntoViewOptions;
  /** Focus behavior options used in non-virtual mode. Defaults to `{ preventScroll: false }`. */
  focusOptions?: FocusOptions;
  /** Explicit or computed grid dimensions for navigation math. Defaults to `{}`. */
  grid?: Partial<Record<"x" | "y" | "vY", number>>;
  /** Callback fired when an item becomes active/selected. */
  onSelect?: (el: HTMLElement, e: KeyEvent) => void;
  /** Callback fired when focus leaves the navigation container. */
  onFocusOut?: (e: FocusEvent) => void;
};

export type TargetIndexConfig = KeyEvent & {
  /** Current active or focused index. */
  currIndex: number;
  /** Total number of navigable items. */
  length: number;
  /** Horizontal grid span. */
  gridX: number;
  /** Vertical grid span. */
  gridY: number;
  /** Virtual vertical span for non-uniform layouts. */
  vGridY: number;
  /** Whether edge wrapping is enabled. */
  loop: boolean;
  /** Whether logical horizontal movement is RTL-aware. */
  rtl: boolean;
};
