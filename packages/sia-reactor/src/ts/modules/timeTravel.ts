import { BaseReactorModule, ReactorModuleId, wpArr } from "./base";
import { Reactor } from "../core/reactor";
import type { REvent } from "../types/reactor";
import { setAny, deleteAny, deepClone } from "../utils/obj";
import { setTimeout } from "../utils/fn";
import { clamp } from "../utils/num";
import type { Paths } from "../types/obj";
import { JSONReplacer, JSONReviver } from "../utils/store";

/** The DNA of a specific moment in time, Records the 'Desire' (Intent) or the 'Fact' (State). */
export interface HistoryEntry {
  /** The surgical address in the Reactor */
  path: string;
  /** The data payload at that moment */
  value: any;
  /** The "Undo" antidote (Previous value), if applicable */
  oldValue: any;
  /**  Was it a 'set' or a 'delete' surgery? */
  type: REvent<any, any>["staticType"];
  /** Did the Power Line disapprove?; why? */
  rejected?: string; // optional for lighter payloads
  /** Did the key for the value exist on its parent object? */
  hadKey: boolean;
  /** For chronological re-enactment */
  deltat: number;
  /** For multi-reactor management, identifies who the entry belongs to */
  rid: ReactorModuleId; // lightweight for minimal storage overhead
}

export interface TimeTravelConfig<T extends object = any> {
  /** Specific paths only, no "*"; instead don't pass anything */
  paths: Paths<T>[];
  /** Maximum number of history entries to keep (Memory Cap), you lose replaying Sessions or the Genesis */
  maxHistoryLength: number;
  /** Max delay between events during playback (ms) */
  maxPlaybackDelay: number;
}

export interface TimeTravelState {
  /** The "Genesis" snapshot (Raw Data) */
  initialState: { [rid: ReactorModuleId]: any }; // serializable
  /** The "Timeline" of mutations (Chronological Log) */
  history: HistoryEntry[];
  /** The manual playhead (Index in the Timeline) */
  currentFrame: number;
  /** Whether playback is currently paused (Automatic Replay) */
  paused: boolean;
}

/**
 * - The Flight Recorder (Black Box).
 * - Implements S.I.A. logic to allow playback, teleportation, redos and undos.
 * Allows history from single or multiple reactors to be recorded and replayed in a synchronized manner, even if they have different shapes.
 * If paired with async persistence, `use()` or `setup()` this module after hydration where applicable to avoid recording restore waves.
 */
export class TimeTravelModule<T extends object = any> extends BaseReactorModule<T, TimeTravelConfig<T>, TimeTravelState> {
  public static readonly moduleName: string = "timeTravel";
  protected lastTimestamp: number = 0;
  protected playbackTimeoutId: number = -1;

  constructor(config?: Partial<TimeTravelConfig<T>>, rtr?: Reactor<T>) {
    super({ ...TIME_TRAVEL_MODULE_BUILD, ...config } as TimeTravelConfig<T>, rtr, { initialState: {}, history: [], currentFrame: 0, paused: true } as TimeTravelState);
  }

  // ===========================================================================
  // THE FOUNDATION & WIRETAP (Passive Recording)
  // ===========================================================================
  public wire() {
    // Variables Assignment
    this.lastTimestamp = performance.now();
    // State Listeners
    this.state.set("currentFrame", (v = 0) => clamp(0, v, this.state.history.length), { signal: this.signal, immediate: true });
    // Config --------
    this.config.on("paths", this.handlePaths, { signal: this.signal, immediate: true });
    // Post Wiring
    !this.state.paused && this.play();
  }
  protected override onAttach(rtr: Reactor<any>, rid: ReactorModuleId) {
    rtr.config.referenceTracking = rtr.config.smartCloning = rtr.config.eventTimeStamps = true;
    if (!this.state.history.length || !this.state.initialState[rid]) this.state.initialState[rid] = rtr.snapshot();
    for (const p of this.config.paths ?? wpArr) rtr.on(p as any, this.record, { signal: this.signal });
  }
  protected handlePaths({ value: paths = wpArr, oldValue: prevs = wpArr }: REvent<TimeTravelConfig<T>, "paths">) {
    for (const rtr of this.rtrs.values()) {
      for (const p of prevs) rtr.off(p, this.record);
      for (const p of paths) rtr.off(p, this.record), rtr.on(p, this.record, { signal: this.signal });
    }
  }
  /** Chronicling the lifecycle of the system, Captures the essence of every mutation wave that bubbles up. */
  protected record(e: REvent<any, any>, rid = this.rids.get(e.reactor)!) {
    if (!this.state.paused) return;
    if (this.state.currentFrame < this.state.history.length) this.state.history = this.state.history.slice(0, this.state.currentFrame); // we must destroy the "Alternate Future" (the redo stack) before recording.
    if (this.state.history.length >= this.config.maxHistoryLength!) this.state.history = this.state.history.slice(1); // Drop the oldest memory if we exceed the limit
    this.state.history.push({ path: e.target.path, value: e.reactor.snapshot(false, e.target.value), oldValue: e.reactor.snapshot(false, e.target.oldValue), type: e.staticType, hadKey: e.target.hadKey, deltat: e.timestamp! - this.lastTimestamp, rid });
    if (e.rejected) this.state.history[this.state.history.length - 1].rejected = e.rejected;
    this.state.currentFrame = this.state.history.length; // Lock the playhead to the absolute present
    this.lastTimestamp = e.timestamp!; // Update the metronome with the timestamp of the latest event
  }
  /** Clears timeline history and resets playhead/genesis to the current reactor state. */
  public clear() {
    this.pause();
    this.playbackTimeoutId = -1;
    this.state.history.length = this.state.currentFrame = 0;
    this.state.initialState = Object.fromEntries(this.rtrs.entries().map(([rid, rtr]) => [rid, rtr.snapshot()]));
    this.lastTimestamp = performance.now();
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
      const rtr = this.rtrs.get(e.rid) || this.rtrs.values().next().value!; // owner of the entry index for (single||multi)-reactor management
      if (forward) e.type === "delete" ? deleteAny(rtr.core, e.path as any) : setAny(rtr.core, e.path as any, deepClone(e.value, rtr.config));
      else !e.hadKey ? deleteAny(rtr.core, e.path as any) : setAny(rtr.core, e.path as any, deepClone(e.oldValue, rtr.config));
      forward ? this.state.currentFrame++ : this.state.currentFrame--; // 3. Move the playhead
      if (e.rejected) rtr.log(`[Reactor ${this.name} Module] ${forward ? "Replaying" : "Reversing"} REJECTED intent at "${e.path}"`);
    }
    for (const rtr of this.rtrs.values()) rtr.tick(); // Batch Flush: Flush ALL teleportation ripples before dropping the shield!
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
      const idx = forward ? this.state.currentFrame : this.state.currentFrame - 1,
        e = this.state.history[forward ? idx + 1 : idx - 1];
      this.jumpTo(this.state.currentFrame + (forward ? 1 : -1), true); // 2. Delegate the physics to jumpTo (and keep the shield UP!)
      if (e?.deltat > 0) await new Promise((res) => (this.playbackTimeoutId = setTimeout(() => res(0), Math.min(e.deltat, this.config.maxPlaybackDelay), this.signal))); // 3. Pause the metronome
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
  public export(replacer?: JSONReplacer, space?: string | number): string {
    try {
      return JSON.stringify(this.state, replacer as any, space);
    } catch (e) {
      return this.rtrs.values().next().value?.log(`[Reactor ${this.name} Module] Failed to export session`), "";
    }
  }
  /** Imports a session from a JSON string, allowing you to replay or analyze past states. */
  public import(json: string, reviver?: JSONReviver) {
    try {
      setAny(this.state, "*", JSON.parse(json, reviver) as TimeTravelState);
      this.lastTimestamp = performance.now();
      const resume = !this.state.paused,
        target = this.state.currentFrame;
      this.state.paused = false; // Shield import reconstruction from being recorded into history
      for (const [rid, rtr] of this.rtrs) setAny(rtr.core, "*" as any, deepClone(this.state.initialState[rid], rtr.config)), rtr.tick(); // Flush the genesis wave to the UI
      (this.state.currentFrame = 0), this.jumpTo(target), resume && this.play(); // Anchor at genesis before reconstructing target frame
    } catch (e) {
      this.rtrs.values().next().value?.log(`[Reactor ${this.name} Module] Failed to load session`);
    }
  }
}

export const TIME_TRAVEL_MODULE_BUILD: Partial<TimeTravelConfig> = { maxPlaybackDelay: 2000 };
