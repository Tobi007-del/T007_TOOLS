import type { Payload, Reactor } from "../types/reactor";
import type { WildPaths } from "../types/obj";
import { getTrailRecords } from "../utils/obj";

// ===========================================================================
// The S.I.A (State Intent Architecture) `Event`
// ===========================================================================

/**
 * - Runtime event payload used by Reactor listener waves.
 * - Tracks phase and current path context during propagation, mimics native `Event` API.
 * Exposes intent controls (`resolve`/`reject`), propagation controls, and `composedPath()`.
 * @typeParam T Root state object type.
 * @typeParam P Target path type.
 */
export class ReactorEvent<T extends object, P extends WildPaths<T> = WildPaths<T>> {
  /** No active propagation phase. */
  public static readonly NONE = 0;
  /** Capture phase: root to target parent. */
  public static readonly CAPTURING_PHASE = 1;
  /** Target phase: target listeners run. */
  public static readonly AT_TARGET = 2;
  /** Bubble phase: target parent to root. */
  public static readonly BUBBLING_PHASE = 3;
  /** Current propagation phase for this event instance. */
  public eventPhase = ReactorEvent.NONE;
  /** Current event type for the active propagation path, clone immediately if async */
  public type: Payload<T, P>["type"];
  /**
   * Current target context for the active propagation path, clone immediately if async.
   * Also use to survive future object shape changes from nesting for a path callback.
   */
  public currentTarget: Payload<T, P>["currentTarget"];
  /** Original event type before propagation remapping. */
  public readonly staticType: Exclude<Payload<T, P>["type"], "update">;
  /** Original event target context. */
  public readonly target: Payload<T, P>["target"];
  /** Root reactive object for this event instance wave. */
  public readonly root: Payload<T, P>["root"];
  /** Original target path for this event instance wave. */
  public readonly path: Payload<T, P>["target"]["path"];
  /** Current value at the event target path. */
  public readonly value: Payload<T, P>["target"]["value"];
  /** Previous value at the event target path. */
  public readonly oldValue: Payload<T, P>["target"]["oldValue"];
  /** Whether resolve/reject intent semantics are allowed for this event instance. */
  public readonly rejectable: boolean;
  /** Whether this event instance wave can bubble back up to ancestors or just capture down. */
  public readonly bubbles: boolean;
  /**
   * `DOMHighResTimeStamp` for this event instance payload for native event parity and accuracy.
   * Enable `eventTimeStamps` option, then use this over custom timestamps in listeners for accuracy.
   * */
  public readonly timestamp?: number;
  /** The `Reactor` instance that dispatched this event instance. */
  public readonly reactor: Reactor<T>;
  protected _resolved = "";
  protected _rejected = "";
  protected _propagationStopped = false;
  protected _immediatePropagationStopped = false;

  /**
   * @param payload Source payload for this event instance.
   * @param reactor The `Reactor` instance creating this event instance.
   */
  constructor(payload: Payload<T, P>, reactor: Reactor<T>) {
    this.staticType = this.type = payload.type as ReactorEvent<T, P>["staticType"];
    this.target = payload.target;
    this.currentTarget = payload.currentTarget;
    this.root = payload.root;
    this.path = payload.target.path;
    this.value = payload.target.value;
    this.oldValue = payload.target.oldValue;
    this.rejectable = payload.rejectable;
    this.bubbles = !!reactor.config.eventBubbling;
    if (reactor.config.eventTimeStamps) this.timestamp = performance.now();
    this.reactor = reactor;
  }

  /** Whether propagation has been stopped. */
  public get propagationStopped(): boolean {
    return this._propagationStopped;
  }
  /** Stops propagation to remaining listeners in later nodes/phases. */
  public stopPropagation(): void {
    this._propagationStopped = true;
  }
  /** Whether immediate propagation has been stopped. */
  public get immediatePropagationStopped(): boolean {
    return this._immediatePropagationStopped;
  }
  /** Stops propagation immediately, including remaining listeners on current path. */
  public stopImmediatePropagation(): void {
    this._propagationStopped = true;
    this._immediatePropagationStopped = true;
  }

  /** Resolution message for rejectable events. */
  public get resolved(): string {
    return this._resolved;
  }
  /**
   * Marks a rejectable event as resolved.
   * @param message Optional resolution message or identity.
   * @example e.resolve("html5Tech"); // identity
   * @example e.resolve("API Load successful"); // message
   */
  public resolve(message?: string): void {
    if (!this.rejectable) return this.reactor.log(`[ReactorEvent] Ignored \`resolve()\` call on a non-rejectable ${this.staticType} at "${this.path}"`);
    if (this.eventPhase !== ReactorEvent.CAPTURING_PHASE) this.reactor.log(`[ReactorEvent] Resolving an intent on ${this.staticType} at "${this.path}" outside of the capture phase is unadvised.`);
    if (this.rejectable) this.reactor.log(`[ReactorEvent] ${(this._resolved = message || `Could ${this.staticType} intended value at "${this.path}"`)}`);
  }
  /** Rejection reason for rejectable events. */
  public get rejected(): string {
    return this._rejected;
  }
  /**
   * Marks a rejectable event as rejected.
   * @param reason Optional rejection reason or identity.
   * @example e.resolve("html5Tech"); // identity
   * @example e.resolve("User is not logged in"); // reason
   */
  public reject(reason?: string): void {
    if (!this.rejectable) return this.reactor.log(`[ReactorEvent] Ignored \`reject()\` call on a non-rejectable ${this.staticType} at "${this.path}"`);
    if (this.eventPhase !== ReactorEvent.CAPTURING_PHASE) this.reactor.log(`[ReactorEvent] Rejecting an intent on ${this.staticType} at "${this.path}" outside of the capture phase is unadvised.`);
    if (this.rejectable) this.reactor.log(`[ReactorEvent] ${(this._rejected = reason || `Couldn't ${this.staticType} intended value at "${this.path}"`)}`);
  }

  /**
   * Returns event path values from target to root.
   * @returns Composed path values in bubbling order.
   */
  public composedPath() {
    return getTrailRecords<T>(this.root, this.path as WildPaths<T>, true).map((r) => r[2]); // values reversed to mimic bubbling
  }
}
