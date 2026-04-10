import { Autotracker } from "../adapters/autotracker";

// ===========================================================================
// The S.I.A (State Intent Architecture) Constants
// ===========================================================================

/** Global context object for sharing state across the reactor runtime. */
export const CTX = {
  /** Flag indicating whether the application is running in development mode. */
  isDevEnv: "undefined" !== typeof process ? process.env.NODE_ENV !== "production" : true,
  /** active `Autotracker` instance, override for automatic dependency collection on `Reactor` traps. */
  autotracker: null as Autotracker<any> | null,
};
/** Marker to access underlying raw object from a proxy. */
export const RAW: unique symbol = Symbol.for("S.I.A_RAW"); // "Get Original Obj" Marker
/** Marker to opt an object out of reactor proxy handling. */
export const INERTIA: unique symbol = Symbol.for("S.I.A_INERTIA"); // "No Proxy" Marker
/** Marker to mark a branch as intent (rejectable). */
export const REJECTABLE: unique symbol = Symbol.for("S.I.A_REJECTABLE"); // "State Vs. Intent" Marker
/** Marker to enable indifference/non-equality semantics for a branch. */
export const INDIFFABLE: unique symbol = Symbol.for("S.I.A_INDIFFABLE"); // "Equality Tracking" Marker
/** Sentinel return value that terminates a mediated operation. */
export const TERMINATOR: unique symbol = Symbol.for("S.I.A_TERMINATOR"); // "Obj Operation Terminator" Marker
/** Internal mutation version marker. */
export const VERSION: unique symbol = Symbol.for("S.I.A_VERSION"); // "Obj Mutation Count" Marker
/** Internal snapshot version marker used by smart cloning. */
export const SSVERSION: unique symbol = Symbol.for("S.I.A_SNAPSHOT_VERSION"); // "Obj Snapshot Version" Marker
/** Default batching scheduler used by the reactor runtime. */
export const RTR_BATCH = "undefined" !== typeof window ? ("undefined" !== typeof queueMicrotask ? queueMicrotask : setTimeout).bind(window) : "undefined" !== typeof process && process.nextTick ? process.nextTick : setTimeout;
/** Default reactor logger prefix function. */
export const RTR_LOG = console.log.bind(console, "[S.I.A Reactor]");
/** Default event warning logger prefix function. */
export const EVT_WARN = console.warn.bind(console, "[S.I.A Event]");
/** Canonical option keys parsed for listener and mediator registrations. */
export const EVT_OPTS = { LISTENER: ["capture", "depth", "once", "signal", "immediate"], MEDIATOR: ["lazy", "signal", "immediate"] } as const;
/** Frozen empty object used as a zero-allocation default options value. */
export const NIL = Object.freeze({}) as any; // empty obj to escape any optional chain overhead
/** Shared no-operation function. */
export const NOOP = () => {}; // no operation function to escape optional chain overhead
