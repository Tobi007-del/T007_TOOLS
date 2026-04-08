/** Keyboard matching configuration used by utility helpers. */
export interface keysSettings {
  /** Disables key handling when true. */
  disabled?: boolean;
  /** Combos that should call preventDefault when matched. */
  overrides?: string[];
  /** Action map from action id to combo or combo list. */
  shortcuts?: Record<string, string | string[]>;
  /** Combos that should be rejected immediately. */
  blocks?: string[];
  /** Enables exact combo matching instead of subset matching. */
  strictMatches?: boolean;
  /** Combos that are allowed as pass-through key actions. */
  whitelist?: string[];
}

/** Canonical key-combo structure used by parser and serializer helpers. */
export type KeyStruct = Record<"ctrlKey" | "shiftKey" | "altKey" | "metaKey", boolean> & { key: string };

/**
 * Parses a combo string into modifier flags + terminal key.
 * @param combo Key combo string (for example: `"ctrl+shift+z"`).
 * @returns Parsed key structure with boolean modifier flags.
 * @example
 * parseKeyCombo("ctrl+shift+z")
 * // => { ctrlKey: true, shiftKey: true, altKey: false, metaKey: false, key: "z" }
 */
export function parseKeyCombo(combo: string): KeyStruct {
  const parts = cleanKeyCombo(combo).toLowerCase().split("+");
  return { ctrlKey: parts.includes("ctrl"), shiftKey: parts.includes("shift"), altKey: parts.includes("alt"), metaKey: parts.includes("meta") || parts.includes("cmd"), key: parts.find((p) => !["ctrl", "shift", "alt", "meta", "cmd"].includes(p)) || "" };
}

/**
 * Serializes a key structure or keyboard event into canonical combo form.
 * @param e KeyboardEvent-like object or parsed key structure.
 * @returns Canonical combo string (for example: `"ctrl+shift+z"`).
 */
export function stringifyKeyEvent(e: KeyStruct | KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey) parts.push("ctrl");
  if (e.altKey) parts.push("alt");
  if (e.shiftKey) parts.push("shift");
  if (e.metaKey) parts.push("meta");
  parts.push(e.key?.toLowerCase() ?? "");
  return parts.join("+");
}

/**
 * Normalizes combo(s) by:
 * - lowercasing,
 * - aliasing `cmd -> meta`, `space -> " "`,
 * - preserving literal space/plus edge cases,
 * - sorting modifiers as `ctrl, alt, shift, meta`.
 * @param combo Raw combo or list of combos.
 * @returns Canonical combo string or list.
 * @example
 * cleanKeyCombo(["Shift+Ctrl+Z", "cmd+y"])
 * // => ["ctrl+shift+z", "meta+y"]
 */
export function cleanKeyCombo(combo: string): string;
export function cleanKeyCombo(combo: string[]): string[];
export function cleanKeyCombo(combo: string | string[]): string | string[] {
  const clean = (combo: string): string => {
    const m = ["ctrl", "alt", "shift", "meta"],
      alias: Record<string, string> = { cmd: "meta", space: " " };
    if (combo === " " || combo === "+") return combo;
    combo = combo.replace(/\+\s*\+$/, "+plus");
    const p = combo
      .toLowerCase()
      .split("+")
      .filter((k) => k !== "")
      .map((k) => alias[k] || (k === "plus" ? "+" : k.trim() || " "));
    return [...p.filter((k) => m.includes(k)).sort((a, b) => m.indexOf(a) - m.indexOf(b)), ...(p.filter((k) => !m.includes(k)) || "")].join("+");
  };
  return Array.isArray(combo) ? combo.map(clean) : clean(combo);
}

/**
 * Determines if actual combo satisfies required combo rule(s).
 * Non-strict mode performs subset matching (required keys must all be present).
 * Strict mode requires exact canonical equality.
 * @param required Required combo or combo list.
 * @param actual Actual combo string.
 * @param strict Whether to require exact match.
 * @returns `true` when match succeeds.
 */
export function matchKeys(required: string | string[], actual: string, strict = false): boolean {
  actual = cleanKeyCombo(actual);
  const match = (required: string, actual: string): boolean => {
    required = cleanKeyCombo(required);
    if (strict) return required === actual;
    const reqKeys = required.split("+"),
      actKeys = actual.split("+");
    return reqKeys.every((k) => actKeys.includes(k));
  };
  return Array.isArray(required) ? required.some((req) => match(req, actual)) : match(required, actual);
}

/**
 * Resolves key-combo terms against settings:
 * - override, block, whitelist, and matched action id.
 * @param combo Canonical combo string.
 * @param settings Matching settings.
 * @returns Match resolution record.
 */
export function getTermsForKey(combo: string, settings: keysSettings): { override: boolean; block: boolean; whitelisted: boolean; action: string | null } {
  const terms = { override: false, block: false, whitelisted: false, action: null as string | null },
    { overrides = [], shortcuts = {}, blocks = [], strictMatches: s = false, whitelist = [] } = settings || {};
  combo = cleanKeyCombo(combo);
  if (matchKeys(overrides, combo, s)) terms.override = true;
  if (matchKeys(blocks, combo, s)) terms.block = true;
  if (matchKeys(whitelist as unknown as string[], combo)) terms.whitelisted = true;
  terms.action = Object.keys(shortcuts).find((key) => matchKeys(shortcuts[key] as string | string[], combo, s)) || null;
  return terms;
}

/**
 * Evaluates whether a keyboard event is allowed and maps it to an action id.
 * Behavior order:
 * 1. hard gate checks (`disabled`, focused editable, button-space/enter),
 * 2. blocked combos,
 * 3. override combos (`preventDefault`),
 * 4. shortcut action match,
 * 5. whitelist pass-through.
 * @param e Browser keyboard event.
 * @param settings Matching settings.
 * @returns Action id, pass-through key, or `false` when denied.
 */
export function keyEventAllowed(e: KeyboardEvent, settings: keysSettings): false | string {
  if (settings.disabled || ((e.key === " " || e.key === "Enter") && ((e.target as Node)?.ownerDocument || document).activeElement?.tagName === "BUTTON") || ((e.target as Node)?.ownerDocument || document).activeElement?.matches("input,textarea,[contenteditable='true']")) return false;
  const combo = stringifyKeyEvent(e),
    { override, block, action, whitelisted } = getTermsForKey(combo, settings);
  if (block) return false;
  if (override) e.preventDefault();
  if (action) return action;
  if (whitelisted) return e.key.toLowerCase();
  return false;
}

/**
 * Formats one or many combos for human-readable UI labels.
 * @param combo Combo or combo list.
 * @returns Display label (for example: `" (ctrl+z) or (meta+z)"`).
 */
export const formatKeyForDisplay = (combo: string | string[]): string => ` ${(Array.isArray(combo) ? combo : [combo]).map((c) => `(${cleanKeyCombo(c).replace(" ", "space")})`).join(" or ")}`;

/**
 * Formats an action-shortcuts map for display labels.
 * @param keyShortcuts Action to combo(s) map.
 * @returns Action to display-label map.
 */
export function formatKeyShortcutsForDisplay(keyShortcuts: Record<string, string | string[]>): Record<string, string> {
  const shortcuts: Record<string, string> = {};
  for (const action of Object.keys(keyShortcuts)) shortcuts[action] = formatKeyForDisplay(keyShortcuts[action]);
  return shortcuts;
}

/**
 * Converts combo text into WAI-ARIA `aria-keyshortcuts` format.
 * - When `formatted=true`, `s` is treated as already display-formatted text.
 * - When `formatted=false`, `s` is treated as raw combo(s) and is first formatted.
 * @param s Combo text or combo list.
 * @param formatted Whether `s` is already display-formatted.
 * @returns Normalized aria-keyshortcuts string.
 * @example
 * parseForARIAKS(" (ctrl+z) or (meta+z)")
 * // => "Control+z Meta+z"
 * @example
 * parseForARIAKS(["ctrl+z", "meta+z"], false)
 * // => "Control+z Meta+z"
 */
export function parseForARIAKS(s: string | string[], formatted = true) {
  const m = { ctrl: "Control", cmd: "Meta", space: "Space", plus: "+" };
  return (formatted && !Array.isArray(s) ? s : formatKeyForDisplay(s))
    .toLowerCase()
    .replace(/[()]/g, "") // 1. Remove parens
    .replace(/\bor\b/g, " ") // 2. Replace "or" with the REQUIRED space
    .replace(/\w+/g, (k: any) => m[k as keyof typeof m] || k) // 3. Map keys (ctrl -> Control)
    .replace(/\s+/g, " ")
    .trim(); // 4. Cleanup extra spaces
} // W3 ARIA Key Shortcut
