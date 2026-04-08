import { BaseReactorPlugin } from "./base";
import { Reactor } from "../core/reactor";
import type { REvent } from "../types/reactor";
import { setAny, deleteAny, deepClone } from "../utils/obj";
import { setTimeout } from "../utils/fn";
import { clamp } from "../utils/num";
import type { Paths } from "../types/obj";

/** The DNA of a specific moment in time, Records the 'Desire' (Intent) or the 'Fact' (State). */
export interface HistoryEntry {
  /**  Was it a 'set' or a 'delete' surgery? */
  type: REvent<any, any>["staticType"];
  /** The surgical address in the Reactor */
  path: string;
  /** The data payload at that moment */
  value: any;
  /** The "Undo" antidote (Previous value), if applicable */
  oldValue: any;
  /** Did the key for the value exist on its parent object? */
  keyExisted: boolean;
  /** Did the Power Line disapprove?; why? */
  rejected: string;
  /** For chronological re-enactment */
  timestamp: number;
}

export interface TimeTravelConfig<T extends object = any> {
  /** Specific paths only, no "*"; instead don't pass anything */
  paths?: Paths<T>[];
  /** Maximum number of history entries to keep (Memory Cap), you lose replaying Sessions or the Genesis */
  maxHistoryLength: number;
  /** Max delay between events during playback (ms) */
  maxPlaybackDelay: number;
}

export interface TimeTravelState {
  /** The "Timeline" of mutations (Chronological Log) */
  history: HistoryEntry[];
  /** The "Genesis" snapshot (Raw Data) */
  initialState: any;
  /** The manual playhead (Index in the Timeline) */
  currentFrame: number;
  /** Whether playback is currently paused (Automatic Replay) */
  paused: boolean;
}

/**
 * The Flight Recorder (Black Box).
 * - Implements S.I.A. logic to allow playback, teleportation, redos and undos.
 */
export class TimeTravelPlugin<T extends object = any> extends BaseReactorPlugin<T, TimeTravelConfig<T>, TimeTravelState> {
  public static readonly plugName = "timeTravel";
  protected playbackTimeoutId: number = -1;

  constructor(config?: Partial<TimeTravelConfig<T>>, rtr?: Reactor<T>) {
    super({ ...TIME_TRAVEL_PLUGIN_BUILD, ...config } as TimeTravelConfig<T>, rtr, { history: [], initialState: null, currentFrame: 0, paused: true } as TimeTravelState);
  }

  // ===========================================================================
  // THE FOUNDATION & WIRETAP (Passive Recording)
  // ===========================================================================
  public wire() {
    // Variables Assignment
    this.rtr.config.referenceTracking = this.rtr.config.smartCloning = this.rtr.config.eventTimeStamps = true;
    if (!this.state.history.length || this.state.initialState == null) this.state.initialState = this.rtr.snapshot();
    // State Listeners
    this.state.set("currentFrame", (v = 0) => clamp(0, v, this.state.history.length), { signal: this.signal, immediate: true });
    // Config --------
    this.config.on("paths", this.handlePathsState, { signal: this.signal, immediate: true });
    // Post Wiring
    !this.state.paused && this.play();
  }
  protected handlePathsState({ value: paths = ["*"] as any, oldValue: prevs = ["*"] as any }: REvent<TimeTravelConfig<T>, "paths">) {
    for (const p of prevs) this.rtr.off(p, this.record);
    for (const p of paths) this.rtr.off(p, this.record), this.rtr.on(p, this.record, { signal: this.signal });
  }
  /** Chronicling the lifecycle of the system, Captures the essence of every mutation wave that bubbles up. */
  protected record(e: REvent<T, any>) {
    if (!this.state.paused) return;
    if (this.state.currentFrame < this.state.history.length) this.state.history = this.state.history.slice(0, this.state.currentFrame); // we must destroy the "Alternate Future" (the redo stack) before recording.
    if (this.state.history.length >= this.config.maxHistoryLength!) this.state.history = this.state.history.slice(1); // Drop the oldest memory if we exceed the limit
    this.state.history.push({ timestamp: e.timestamp ?? performance.now(), path: e.target.path, type: e.staticType, value: this.rtr.snapshot(false, e.target.value), oldValue: this.rtr.snapshot(false, e.target.oldValue), keyExisted: e.target.keyExisted, rejected: e.rejected });
    this.state.currentFrame = this.state.history.length; // Lock the playhead to the absolute present
  }
  /** Clears timeline history and resets playhead/genesis to the current reactor state. */
  public clear() {
    this.pause();
    this.playbackTimeoutId = -1;
    this.state.history = [];
    this.state.currentFrame = 0;
    this.state.initialState = this.rtr.snapshot();
  }

  // ===========================================================================
  // THE TIME MACHINE (Manual Controls)
  // ===========================================================================
  /** Instant state reconstruction (Teleport). Glides through deltas natively. */
  public jumpTo(index: number = 0, keepShield = false) {
    this.state.paused = false;
    const target = clamp(0, index, this.state.history.length), // Ensure bounds
      forward = target > this.state.currentFrame;
    // Glide until the playhead locks exactly onto the target
    while (this.state.currentFrame !== target) {
      const e = this.state.history[forward ? this.state.currentFrame : this.state.currentFrame - 1]; // Grab the correct frame (Current unapplied frame if going forward, previous applied frame if going backward)
      if (!e) break;
      if (forward) e.type === "delete" ? deleteAny(this.rtr.core, e.path as any) : setAny(this.rtr.core, e.path as any, deepClone(e.value, this.rtr.config));
      else !e.keyExisted ? deleteAny(this.rtr.core, e.path as any) : setAny(this.rtr.core, e.path as any, deepClone(e.oldValue, this.rtr.config));
      forward ? this.state.currentFrame++ : this.state.currentFrame--; // 3. Move the playhead
      if (e.rejected) this.rtr.log(`[Reactor ${this.name} Plug] ${forward ? "Replaying" : "Reversing"} REJECTED intent at "${e.path}"`);
    }
    this.rtr.tick(); // Batch Flush: Flush ALL teleportation ripples before dropping the shield!
    if (!keepShield) this.state.paused = true;
  }
  /** Step through time, Moves the playhead and teleports the state. */
  public step(stride = 1, forward = true) {
    if (forward ? this.state.currentFrame >= this.state.history.length : this.state.currentFrame <= 0) return; // Already at the edge of the timeline
    this.pause(), forward ? this.jumpTo(this.state.currentFrame + stride) : this.jumpTo(this.state.currentFrame - stride);
  }
  /** Step back in time, Moves the playhead backward and teleports the state. */
  public undo = () => this.step(1, false);
  /** Step forward in time, Restores previously undone actions. */
  public redo = () => this.step(1, true);

  // ===========================================================================
  // THE VCR (Automated Playback)
  // ===========================================================================
  /** Core automove engine. Replays or rewinds the "Story" by respecting time gaps. */
  public async automove(forward = true) {
    this.state.paused = false;
    while ((forward ? this.state.currentFrame < this.state.history.length : this.state.currentFrame > 0) && !this.state.paused) {
      const currIndex = forward ? this.state.currentFrame : this.state.currentFrame - 1,
        e = this.state.history[currIndex],
        nextE = this.state.history[forward ? currIndex + 1 : currIndex - 1],
        delay = nextE && e ? Math.abs(nextE.timestamp - e.timestamp) : 0;
      this.jumpTo(this.state.currentFrame + (forward ? 1 : -1), true); // 2. Delegate the physics to jumpTo (and keep the shield UP!)
      if (delay > 0) await new Promise((res) => (this.playbackTimeoutId = setTimeout(() => res(0), clamp(0, delay, this.config.maxPlaybackDelay!), this.signal))); // 3. Pause the metronome
    }
    this.state.paused = true;
  }
  /** Start chronological re-enactment of the session. */
  public play = () => this.automove(true);
  /** Start reverse chronological re-enactment of the session. */
  public rewind = () => this.automove(false);
  /** Pauses the live VCR playback. */
  public pause = () => ((this.state.paused = true), clearTimeout(this.playbackTimeoutId));

  // ===========================================================================
  // TELEMETRY & I/O (Session Import/Export)
  // ===========================================================================
  /** Exports the current session as a JSON string. */
  public export(): string {
    return JSON.stringify(this.state);
  }
  /** Imports a session from a JSON string, allowing you to replay or analyze past states. */
  public import(json: string) {
    try {
      setAny(this.state, "*", JSON.parse(json) as TimeTravelState);
      const resume = !this.state.paused,
        target = this.state.currentFrame;
      this.state.paused = false; // Shield import reconstruction from being recorded into history
      setAny(this.rtr.core, "*" as any, deepClone(this.state.initialState, this.rtr.config));
      this.rtr.tick(); // Flush the genesis wave to the UI
      this.state.currentFrame = 0; // Anchor at genesis before reconstructing target frame
      this.jumpTo(target), resume && this.play();
    } catch (e) {
      this.rtr.log(`[Reactor ${this.name} Plug] Failed to load session`, "error");
    }
  }
}

export const TIME_TRAVEL_PLUGIN_BUILD: Partial<TimeTravelConfig> = { maxPlaybackDelay: 2000 };
