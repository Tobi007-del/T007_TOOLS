import { REJECTABLE, INERTIA, INDIFFABLE, TERMINATOR } from "../core/consts";
import { Reactor } from "../core/reactor";
import { ReactorEvent } from "../core/event";
import type { Paths, WildPaths, ChildPaths, PathValue, PathBranchValue, PathKey } from "./obj";
import { Reactive } from "../core/mixins";

// ===========================================================================
// CORE MARKERS & STATE WRAPPERS
// ===========================================================================

/** Marks an object as inert (excluded from proxy handling). */
export type Inert<T> = T & { [INERTIA]?: true };
/** Removes inert marker typing. */
export type Live<T> = T extends Inert<infer U> ? U : T;

/** Marks an object as intent (rejectable). */
export type Intent<T> = T & { [REJECTABLE]?: true };
/** Removes intent marker typing. */
export type State<T> = T extends Intent<infer U> ? U : T;

/** Marks an object as volatile/indiffable. */
export type Volatile<T> = T & { [INDIFFABLE]?: true };
/** Removes volatile marker typing. */
export type Stable<T> = T extends Volatile<infer U> ? U : T;

export type { Reactor };

// ===========================================================================
// EVENT SYSTEM & PAYLOADS
// ===========================================================================

/** Path-scoped value container used by payloads/events. */
export interface Target<T, P extends WildPaths<T> = WildPaths<T>> {
  /** Dotted path for this value. */
  path: P;
  /** Current value at the path. */
  value: PathValue<T, P>;
  /** Previous value at the path (only for `set` and `delete` events). */
  oldValue?: PathValue<T, P>;
  /** Key for the value on it's parent object. */
  key: PathKey<T, P>;
  /**
   * Whether the key for the value existed on the parent object.
   * For accuracy on if `key` was in the `object` rather than checking `oldValue` against undefined
   */
  keyExisted: boolean;
  /** Parent-branch value for the path. */
  object: PathBranchValue<T, P>;
}

/** Runtime payload union for mediated operations and update waves (Creates the IDE magic). */
export type Payload<T, P extends WildPaths<T> = WildPaths<T>> =
  | DirectPayload<T, P>
  | UpdatePayload<T, P>;

export interface BasePayload<T, P extends WildPaths<T> = WildPaths<T>> {
  /**
   * Current target context for the active propagation path.
   * Same reference to `target`, here for seamless API switches: `watch()` -> `on()`.
   */
  currentTarget: Target<T, P>;
  /** Root reactive object for this payload. */
  root: T;
  /** For mediators to signal operation termination but doesn't stop the chain */
  terminated?: boolean;
  /** Whether resolve/reject intent semantics are allowed on the event this routes to. */
  rejectable: boolean;
}
export interface DirectPayload<T, P extends WildPaths<T> = WildPaths<T>> extends BasePayload<T, P> {
  /** Type of the operation that triggered this payload. */
  type: "init" | "get" | "set" | "delete"; // init during `immediate: true` sync
  /** Target context for this payload. */
  target: Target<T, P>;
}
export interface UpdatePayload<T, P extends WildPaths<T> = WildPaths<T>> extends BasePayload<T, P> {
  /** Type of the operation that triggered this payload, i.e. "update" */
  type: "update";
  /** Target context for this payload. */
  target: Target<T, ChildPaths<T, P>>; // Target is strictly one of the child paths!
}

/** Event union with payload-aware overrides for `type`, `path`, and value fields (Creates the IDE magic). */
export type REvent<T, P extends WildPaths<T> = WildPaths<T>> =
  | (Omit<ReactorEvent<T, P>, OverrideEvtProp> &
      DirectPayload<T, P> &
      OverrideEvtPart<DirectPayload<T, P>>)
  | (Omit<ReactorEvent<T, P>, OverrideEvtProp> &
      UpdatePayload<T, P> &
      OverrideEvtPart<UpdatePayload<T, P>>);

type OverrideEvtProp = "type" | "target" | "value" | "oldValue" | "path";
interface OverrideEvtPart<PL extends { target: { path: any; value: any; oldValue?: any } }> {
  path: PL["target"]["path"];
  value: PL["target"]["value"];
  oldValue: PL["target"]["oldValue"];
}

// ===========================================================================
// REACTIVITY CALLBACKS (The Handlers)
// ===========================================================================

/** Get mediator callback. */
export type Getter<T, P extends WildPaths<T> = WildPaths<T>> = (
  value: PathValue<T, P>,
  payload: Payload<T, P>
) => PathValue<T, P> | undefined;

/** Set mediator callback. */
export type Setter<T, P extends WildPaths<T> = WildPaths<T>> = (
  value: PathValue<T, P>,
  terminated: boolean,
  payload: Payload<T, P>
) => PathValue<T, P> | typeof TERMINATOR | undefined;

/** Delete mediator callback. */
export type Deleter<T, P extends WildPaths<T> = WildPaths<T>> = (
  terminated: boolean,
  payload: Payload<T, P>
) => typeof TERMINATOR | undefined;

/** Watch callback (synchronous path observer). */
export type Watcher<T, P extends WildPaths<T> = WildPaths<T>> = (
  value: PathValue<T, P>,
  payload: Payload<T, P>
) => void;

/** Listener callback (batched/asynchronous by default). */
export type Listener<T, P extends WildPaths<T> = WildPaths<T>> = (event: REvent<T, P>) => void;

// ===========================================================================
// ENGINE RECORDS (Internal Storage)
// ===========================================================================

export type GetterRecord<T extends object, P extends WildPaths<T> = WildPaths<T>> = {
  cb: Getter<T, P>;
  clup: () => ReturnType<Reactor<T>["noget"]>; // Registration Cleanup
  sclup?: () => void; // AbortSignal Cleanup
} & SyncOptionsTuple;

/** Internal registry record for `set` mediators. */
export type SetterRecord<T extends object, P extends WildPaths<T> = WildPaths<T>> = {
  cb: Setter<T, P>;
  clup: () => ReturnType<Reactor<T>["noset"]>;
  sclup?: () => void;
} & SyncOptionsTuple;

export type DeleterRecord<T extends object, P extends WildPaths<T> = WildPaths<T>> = {
  cb: Deleter<T, P>;
  clup: () => ReturnType<Reactor<T>["nodelete"]>;
  sclup?: () => void;
} & SyncOptionsTuple;

export type WatcherRecord<T extends object, P extends WildPaths<T> = WildPaths<T>> = {
  cb: Watcher<T, P>;
  clup: () => ReturnType<Reactor<T>["nowatch"]>;
  sclup?: () => void;
} & SyncOptionsTuple;

export type ListenerRecord<T extends object, P extends WildPaths<T> = WildPaths<T>> = {
  cb: Listener<T, P>;
  clup: () => ReturnType<Reactor<T>["off"]>;
  sclup?: () => void;
  lDepth?: number; // Listener Depth
} & ListenerOptionsTuple;

// ===========================================================================
// CONFIGURATION OPTIONS
// ===========================================================================

export interface SyncOptionsTuple {
  /** Whether to defer activation until the next tick. */
  lazy?: boolean;
  /** Whether the callback should only run once. */
  once?: boolean;
  /** Optional `AbortSignal` to automatically handle registration cleanup. */
  signal?: AbortSignal;
  /** Whether to run the callback immediately during registration, "auto" runs only if path exists. */
  immediate?: boolean | "auto";
}
/** Tuple-form and shorthand boolean for mediator/watch registrations. */
export type SyncOptions = boolean | SyncOptionsTuple;

export interface ListenerOptionsTuple extends Omit<SyncOptionsTuple, "lazy"> {
  /** Whether to listen on the capture phase against bubble. */
  capture?: boolean;
  /** Maximum path nested depth for event propagation, try `1` if listening to an array with nested objects. */
  depth?: number;
}
/** Tuple-form and shorthand boolean for listener registrations. */
export type ListenerOptions = boolean | ListenerOptionsTuple;

/** Options accepted by adapter effects (`sync: true` -> watch mode else listener mode). */
export type EffectOptions =
  | (SyncOptionsTuple & { sync: true })
  | (ListenerOptionsTuple & { sync?: false });

/** Reactor bootstrap/build configuration. */
export interface ReactorBuild<T extends object, P extends Paths<T> = Paths<T>> {
  /** 1-time set: Enables debug logging and diagnostics. */
  debug?: boolean;
  /** Enables cross-realm object detection support (e.g. iframes). */
  crossRealms?: boolean;
  /** Enables structural-sharing snapshot behavior (requires `referenceTracking: true`). */
  smartCloning?: boolean;
  /** Enables event bubbling across ancestor paths, remove to use only capturing with one-way loops (default: true). */
  eventBubbling?: boolean;
  /** Enables path lineage tracing for reference lookups on property access (requires `referenceTracking: true`). */
  lineageTracing?: boolean;
  /** Preserves Reflect trap context; safer with ~8x slowdown in hot paths, allows more types to be proxied (e.g. Classes). */
  preserveContext?: boolean;
  /** Enables high-resolution timestamps on events, prefer over custom solutions for accuracy (default: false). */
  eventTimeStamps?: boolean;
  /** Custom equality used by setters and adapter comparisons (default: `Object.is`). */
  equalityFunction?: (a: any, b: any) => boolean;
  /** Custom batching scheduler for listener notification flushes (default: `queueMicrotask`). */
  batchingFunction?: (cb: () => void) => void;
  /** Enables identity/reference tracking features in the runtime. */
  referenceTracking?: boolean;
  /** Root-level `get` initial mediator; can transform or override all read values. */
  get?: (
    object: PathBranchValue<T, P>,
    key: PathKey<T, P>,
    value: PathValue<T, P>,
    receiver: Reactive<T>,
    path: Paths<T> | Paths<T>[]
  ) => PathValue<T, P> | undefined; // "almighty" mediation
  /** Root-level `set` initial mediator; can transform all writes or return `TERMINATOR`. */
  set?: (
    object: PathBranchValue<T, P>,
    key: PathKey<T, P>,
    value: PathValue<T, P>,
    oldValue: PathValue<T, P>,
    receiver: Reactive<T>,
    path: Paths<T> | Paths<T>[]
  ) => PathValue<T, P> | typeof TERMINATOR | undefined; // "almighty" mediation
  /** Root-level `deleteProperty` initial mediator; can block via `TERMINATOR`. */
  deleteProperty?: (
    object: PathBranchValue<T, P>,
    key: PathKey<T, P>,
    oldValue: PathValue<T, P>,
    receiver: Reactive<T>,
    path: Paths<T> | Paths<T>[]
  ) => typeof TERMINATOR | undefined; // "almighty" mediation
  /** Root-level `has` initial mediator; can observe or modify results. */
  has?: (
    object: PathBranchValue<T, P>,
    key: PathKey<T, P>,
    has: boolean,
    receiver: Reactive<T>,
    path: Paths<T> | Paths<T>[]
  ) => boolean; // "almighty" mediation
  /** Root-level `getOwnPropertyDescriptor` initial mediator; can observe or modify results. */
  getOwnPropertyDescriptor?: (
    object: PathBranchValue<T, P>,
    key: PathKey<T, P>,
    descriptor: PropertyDescriptor | undefined,
    receiver: Reactive<T>,
    path: Paths<T> | Paths<T>[]
  ) => PropertyDescriptor | undefined; // "almighty" mediation
  /** Root-level `ownKeys` initial mediator; can observe or modify results. */
  ownKeys?: (
    object: PathBranchValue<T, P>,
    keys: (string | symbol)[],
    receiver: Reactive<T>,
    path: WildPaths<T>
  ) => (string | symbol)[]; // "almighty" mediation
} // debating keeping use of the Reflect API opt-in
