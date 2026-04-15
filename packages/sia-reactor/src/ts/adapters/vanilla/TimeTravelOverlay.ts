import { reactive } from "../../core/mixins";
import { CTX } from "../../core/consts";
import { TimeTravelModule } from "../../modules";
import { createEl, formatKeyForDisplay as formatKFD, keyEventAllowed, parseForARIAKS, type keysSettings, nuke } from "../../utils";
import { effect } from "./effect";

const keys: keysSettings = {
  overrides: ["Ctrl+z", "Cmd+z", "Ctrl+y", "Cmd+y", "Ctrl+Shift+z", "Cmd+Shift+z", "Home", "End", ",", ".", "ArrowLeft", "ArrowRight", "Space", "Alt+Space", "Escape", "Delete", "e", "i", "c"],
  shortcuts: { undo: ["Ctrl+z", "Cmd+z"], redo: ["Ctrl+y", "Cmd+y", "Ctrl+Shift+z", "Cmd+Shift+z"], genesis: "Home", ending: "End", prevFrame: ",", nextFrame: ".", skipBwd: "ArrowLeft", skipFwd: "ArrowRight", playPause: "Space", rewind: "Alt+Space", closeOverlay: "Escape", clrHistory: "Delete", export: "e", import: "i", clear: "c" },
};

/** Reactive options for the TimeTravel overlay instance. */
export interface TimeTravelConfig {
  /** Header text shown at the top of the overlay panel. */
  title: string;
  /** Accent color used to derive panel theme variables. */
  color: string;
  /** Shows the overlay only in development when true. */
  devOnly: boolean;
  /** Initial open state applied when the overlay is created. */
  startOpen: boolean;
  /** Container element that owns the overlay layer and dock. */
  container: HTMLElement;
}

/**
 * - Vanilla overlay controller for visual time-travel controls and timeline I/O.
 * - Mounts a docked HUD into the configured container, syncs its UI with module state, and forwards keyboard/button actions to the TimeTravelModule.
 * Supports reactive `config` updates (title/color/container/devOnly) and maintains local overlay UI state (`open` and `import` payload text).
 */
export class TimeTravelOverlay {
  public static count = 0;
  public index = TimeTravelOverlay.count;
  public config: TimeTravelConfig;
  public readonly state = reactive({ open: false, import: "" });
  public readonly time: TimeTravelModule;
  public readonly els: Record<string, HTMLElement>;
  private clups: Array<() => void> = [];
  private keyup?: (e: KeyboardEvent) => void;

  /** Creates a docked TimeTravel overlay bound to a module instance.
   * @param time TimeTravel module instance that owns timeline operations.
   * @param build Optional initial overlay config overrides.
   */
  constructor(time: TimeTravelModule, build: Partial<TimeTravelConfig> = {}) {
    this.time = time;
    this.config = reactive({ title: `Time Travel Overlay ${(this.index = ++TimeTravelOverlay.count)}`, ...build } as TimeTravelConfig);
    this.state.open = !!this.config.startOpen;
    const s = this.time.state,
      host = createEl("div", { className: "tt-overlay-host" }),
      toggle = createEl("button", { className: "tt-overlay-toggle", type: "button", onclick: () => (this.state.open = !this.state.open) }),
      panel = createEl("aside", { className: "tt-overlay", ariaLabel: "time travel overlay" }),
      title = createEl("div", { className: "title" }),
      frame = createEl("span", { className: "muted" }),
      clrHistory = createEl("button", { textContent: `Clear History${formatKFD(keys.shortcuts!.clrHistory)}`, ariaKeyShortcuts: parseForARIAKS(keys.shortcuts!.clrHistory, false), onclick: () => (this.time.clear(), (this.state.import = "")) }),
      undo = createEl("button", { textContent: `Undo${formatKFD(keys.shortcuts!.undo[0])}`, ariaKeyShortcuts: parseForARIAKS(keys.shortcuts!.undo, false), onclick: this.time.undo }),
      redo = createEl("button", { textContent: `Redo${formatKFD(keys.shortcuts!.redo[0])}`, ariaKeyShortcuts: parseForARIAKS(keys.shortcuts!.redo, false), onclick: this.time.redo }),
      genesis = createEl("button", { textContent: `Genesis${formatKFD(keys.shortcuts!.genesis)}`, ariaKeyShortcuts: parseForARIAKS(keys.shortcuts!.genesis, false), onclick: () => this.time.jumpTo(0) }),
      playPause = createEl("button", { onclick: () => this.time[s.paused ? "play" : "pause"](), ariaKeyShortcuts: parseForARIAKS(keys.shortcuts!.playPause, false) }),
      rewind = createEl("button", { textContent: `Rewind${formatKFD(keys.shortcuts!.rewind)}`, ariaKeyShortcuts: parseForARIAKS(keys.shortcuts!.rewind, false), onclick: this.time.rewind }),
      range = createEl("input", { type: "range", min: "0", max: "0", value: "0", title: "time travel frame", ariaLabel: "time travel frame", oninput: () => this.time.jumpTo(Number(range.value)) }),
      exp = createEl("button", { textContent: `Export${formatKFD(keys.shortcuts!.export)}`, ariaKeyShortcuts: parseForARIAKS(keys.shortcuts!.export, false), onclick: () => (this.state.import = this.time.export(null, 2)) }),
      imp = createEl("button", { textContent: `Import${formatKFD(keys.shortcuts!.import)}`, ariaKeyShortcuts: parseForARIAKS(keys.shortcuts!.import, false), onclick: () => this.state.import.trim().length && this.time.import(this.state.import) }),
      clr = createEl("button", { textContent: `Clear${formatKFD(keys.shortcuts!.clear)}`, ariaKeyShortcuts: parseForARIAKS(keys.shortcuts!.clear, false), onclick: () => (this.state.import = "") }),
      payload = createEl("textarea", { className: "tt-io", readOnly: true, placeholder: "current payload json", title: "current payload" }),
      io = createEl("textarea", { className: "tt-io", placeholder: "timeline payload json", oninput: () => (this.state.import = io.value) }),
      foot = createEl("p", { className: "tt-footnote", textContent: "Want this in your app? " }),
      link = createEl("a", { target: "_blank", rel: "noreferrer noopener", textContent: "sia-reactor", href: "https://www.npmjs.com/package/sia-reactor" }),
      box = createEl("div", { className: "tt-status-box" }),
      status = createEl("div", { className: "tt-status-row" }),
      row1 = createEl("div", { className: "tt-row" }),
      row2 = createEl("div", { className: "tt-row" }),
      row3 = createEl("div", { className: "tt-row" });
    status.append((box.append(frame), box), clrHistory);
    panel.append(title, status, (row1.append(undo, redo, genesis), row1), (row2.append(playPause, rewind), row2), payload, range, (row3.append(exp, imp, clr), row3), io, (foot.appendChild(link), foot));
    host.append(toggle, panel);
    this.els = { host, toggle, panel, title, frame, clrHistory, undo, redo, genesis, playPause, rewind, range, exp, imp, clr, payload, io };
    this.keyup = (e) => {
      const a = this.state.open && (this.config.devOnly ? CTX.isDevEnv : true) && keyEventAllowed(e, keys);
      a === "undo" ? this.time.undo() : a === "redo" ? this.time.redo() : a === "genesis" ? this.time.jumpTo(0) : a === "ending" ? this.time.jumpTo(s.history.length) : a === "prevFrame" ? this.time.step(1, false) : a === "nextFrame" ? this.time.step(1, true) : a === "skipBwd" ? this.time.step(5, false) : a === "skipFwd" ? this.time.step(5, true) : a === "rewind" ? this.time.rewind() : a === "playPause" ? this.time[s.paused ? "play" : "pause"]() : a === "clrHistory" ? this.time.clear() : a === "closeOverlay" ? (this.state.open = false) : a === "export" ? (this.state.import = this.time.export()) : a === "import" ? this.state.import.trim().length && this.time.import(this.state.import) : a === "clear" && (this.state.import = "");
    };
    window.addEventListener("keydown", this.keyup);
    const sync = [
      effect(() => (this.config.color ? host.style.setProperty("--sia-tt-color", this.config.color) : host.style.removeProperty("--sia-tt-color"))),
      effect(() => {
        if (this.config.devOnly && !CTX.isDevEnv) return void host.remove();
        const dock = getDock(this.config.container);
        if (host.parentNode !== dock) dock.appendChild(host);
      }),
      effect(() => (toggle.textContent = `${(panel.hidden = !this.state.open) ? "Show" : "Hide"} ${(title.textContent = this.config.title ?? "")}`)),
      effect(() => (playPause.textContent = `${s.paused ? "Play" : "Pause"}${formatKFD(keys.shortcuts!.playPause)}`)),
      effect(() => {
        frame.textContent = `Frame: ${s.currentFrame} / ${s.history.length}`;
        range.disabled = clrHistory.disabled = !s.history.length;
        genesis.disabled = undo.disabled = !s.currentFrame;
        rewind.disabled = !s.paused || !s.currentFrame;
        playPause.disabled = redo.disabled = s.currentFrame >= s.history.length;
        range.max = String(s.history.length);
        range.value = String(Math.min(s.currentFrame, s.history.length));
        payload.value = JSON.stringify(s.currentFrame ? s.history[s.currentFrame - 1] : { type: "genesis", value: s.initialState }, null, 2);
      }),
      effect(() => {
        clr.disabled = imp.disabled = !this.state.import.trim().length;
        io.value !== this.state.import && (io.value = this.state.import);
      }),
    ];
    this.clups.push(...sync);
  }

  destroy() {
    for (const clup of this.clups) clup();
    this.keyup && window.removeEventListener("keydown", this.keyup);
    this.els.host.remove();
    nuke(this), --TimeTravelOverlay.count;
  }
}

function getDirChild(parent: HTMLElement, className: string): HTMLElement | undefined {
  for (const child of parent.children) if (child instanceof HTMLElement && child.classList.contains(className)) return child;
}
function getDock(container?: HTMLElement) {
  const host = container && container !== document.documentElement ? container : document.body;
  if (host !== document.body && getComputedStyle(host).position === "static") host.style.position = "relative";
  const layer = getDirChild(host, "tt-overlay-layer") || createEl("div", { className: "tt-overlay-layer" }, undefined, { position: host === document.body ? "fixed" : "absolute" });
  if (layer.parentElement !== host) host.appendChild(layer);
  const dock = getDirChild(layer, "tt-overlay-dock") || createEl("div", { className: "tt-overlay-dock" });
  return dock.parentElement !== layer && layer.appendChild(dock), dock;
}
