import { CTX, RAW, INERTIA, REJECTABLE, INDIFFABLE, TERMINATOR, VERSION, SSVERSION, NOOP, RTR_BATCH, RTR_LOG, EVT_OPTS } from "./consts";
import { ReactorEvent } from "./event";
import type { REvent, Target, Payload, Getter, Setter, Deleter, Watcher, Listener, ListenerOptions, ListenerRecord, WatcherRecord, GetterRecord, SetterRecord, DeleterRecord, SyncOptions, ReactorBuild } from "../types/reactor";
import type { PathBranchValue, Paths, PathKey, PathValue, WildPaths, MaxDepth } from "../types/obj";
import { canHandle, getTrailRecords, parseEvtOpts, inAny, getAny, setAny, deleteAny, nuke } from "../utils/obj";
import { BaseReactorModule as ReactorModule, ReactorModuleId } from "../modules/base";

/*
 * ========= THE S.I.A (State Intent Architecture) `Reactor` CODE PATTERN WATCHLIST =========
 * 1. non-stack loops & multiple optimizations, this is surgical work on the root of reactivity
 * 2. used cached loop lengths to optimize b4 JIT Compiler does for optimal speed throughput,
 * avoided myth of reverse while loops so new CPU's don't waste memory on a forward l1 Cache miss
 * 3. moved any logic involving `?.` or `??` outside repetitions to not accumulate the ~5x slowdown
 * 4. `?.` in cases where only other option was `&&` | `||` cuz `?.` benchmarks were a bit faster
 * 5. adopted nooping strategy since JIT compiler makes it 2x faster than other alternatives
 * 6. no unorthodox string deduplication or caching since string interning is native to JS
 * 7. it's all progressive: light at creation then grows during the user of desired features
 * 8. Reflect API was avoided, incurs an ~8x slowdown; mediation layer is even powerful enough
 * 9. Core's Class Syntax over global functional closures for instance's lighter memory footprint
 * 10. Avoided object pooling since V8 excels at generational GC for short-lived payloads so no
 * "Stop the World"s, also no need for wasted recurrent logic, serialize or forget about payloads.
 */

// ===========================================================================
// The S.I.A (State Intent Architecture) `Reactor`
// ===========================================================================

/**
 * - Core S.I.A runtime for path mediation, observation, and event propagation.
 * - Provides path-level mediators (`get|set|delete`), synchronous watchers (`watch`), and batched listeners (`on`).
 * Supports wildcard/path-based subscriptions, optional reference tracking, and module-based extensions.
 * @typeParam T Root state object type.
 */
export class Reactor<T extends object> {
  /** Logger function for this reactor instance, override if desired, `this.canLog = false` resets. */
  public log: (...args: any[]) => void = NOOP;
  /** The core state object for this reactor instance. */
  public core: T; // `?:`s | pay the ~800 byte price upfront for what u might never use
  /** The modules being used by this reactor. */
  public modules?: Set<ReactorModule<T>>;
  /** Configuration options for this reactor instance. */
  public config: Omit<ReactorBuild<T>, "debug">;
  /** Whether this reactor instance is currently batching updates, a window view into the engine timing */
  public isBatching = false; // Async Batching
  protected queue?: Set<() => void>; // Tasks to run after flush
  protected batch?: Map<Paths<T>, Payload<T>>; // Batched payloads to flush async
  protected lineage?: WeakMap<object, (object | string)[]>; // { parent, key }: uses maths to avoid extra allocations for pairs
  protected snapCache?: WeakMap<object, any>;
  protected proxyCache = new WeakMap<object, any>();
  protected getters?: Map<WildPaths<T>, Array<GetterRecord<T>>>;
  protected setters?: Map<WildPaths<T>, Array<SetterRecord<T>>>;
  protected deleters?: Map<WildPaths<T>, Array<DeleterRecord<T>>>;
  protected watchers?: Map<WildPaths<T>, Array<WatcherRecord<T>>>;
  protected listeners?: Map<WildPaths<T>, Array<ListenerRecord<T>>>;

  /**
   * Creates a new Reactor instance.
   * @param target Initial state target.
   * @param build Reactor bootstrap/build configuration.
   * @example
   * const rtr = new Reactor({ count: 0 });
   */
  constructor(target: T = {} as T, build?: ReactorBuild<T>) {
    (this as any)[INERTIA] = true;
    this.config = { crossRealms: false, smartCloning: false, eventBubbling: true, lineageTracing: false, preserveContext: false, equalityFunction: Object.is, batchingFunction: RTR_BATCH, ...build };
    this.core = this.proxied(target);
    if (build) this.canLog = !!build.debug;
  }

  public proxied<O extends object>(target: O, rejectable = false, indiffable = false, parent?: object, key?: string, path?: string): O {
    if (!target || "object" !== typeof target) return target;
    target = (target as any)[RAW] || target; // prevents nested proxies
    if (this.config.referenceTracking && parent && key && !this.link(target, parent, key, false)) return target; // already checked types above
    const cached = this.proxyCache.get(target);
    if (cached) return cached;
    if ((target as any)[INERTIA] || !canHandle(target, this.config, false)) return target; // handles unless inert, // did light type check for `[Symbol]` so `false` to strictObj typecheck param
    rejectable ||= (target as any)[REJECTABLE];
    indiffable ||= (target as any)[INDIFFABLE];
    const proxy = new Proxy(target, {
      // Robust Proxy handler
      get: (object, key, receiver) => {
        if (key === RAW) return this.log(`👀 [Reactor \`get\` Trap] Peeked at ${object}`), object;
        let value = !this.config.preserveContext ? (object as any)[key] : Reflect.get(object, key, receiver);
        const keyStr = String(key),
          fullPath = (path ? path + "." + keyStr : keyStr) as Paths<T>,
          paths = this.config.lineageTracing ? this.trace(object, keyStr) : fullPath;
        this.log(`🔍 [Reactor \`get\` Trap] Initiated for "${keyStr}" on "${paths}"`), CTX.autotracker?.track(fullPath, this);
        if (this.config.get) value = this.config.get(object as PathBranchValue<T>, key as PathKey<T>, value, receiver, paths);
        if (this.getters) {
          const wildcords = this.getters.get("*"); // wild cords
          for (let i = 0, len = this.config.lineageTracing ? paths.length : 1; i < len; i++) {
            const currPath = (this.config.lineageTracing ? paths[i] : fullPath) as Paths<T>,
              cords = this.getters.get(currPath);
            if (!cords && !wildcords) continue;
            const target: Target<T> = { path: currPath, value, key: keyStr as PathKey<T>, hadKey: true, object: receiver },
              payload = { type: "get", target, currentTarget: target, root: this.core, rejectable } as Payload<T, Paths<T>>;
            if (cords) value = this.mediate(currPath, payload, "get", cords);
            if (!wildcords) continue;
            target.value = value;
            value = this.mediate("*", payload, "get", wildcords);
          } // Mediators
        }
        return this.proxied(value, rejectable, indiffable, object, keyStr, fullPath);
      },
      set: (object, key, value, receiver) => {
        let unchanged,
          safeValue,
          safeOldValue,
          terminated = false;
        const keyStr = String(key),
          fullPath = (path ? path + "." + keyStr : keyStr) as Paths<T>,
          paths = this.config.lineageTracing ? this.trace(object, keyStr) : fullPath,
          loopLen = this.config.lineageTracing ? paths.length : 1,
          oldValue = !this.config.preserveContext ? (object as any)[key] : Reflect.get(object, key, receiver),
          hadKey = !this.config.preserveContext ? key in object : Reflect.has(object, key);
        this.log(`✏️ [Reactor \`set\` Trap] Initiated for "${keyStr}" on "${paths}"`), CTX.autotracker?.track(fullPath, this, true);
        if (this.config.referenceTracking || !indiffable) {
          safeOldValue = oldValue?.[RAW] || oldValue;
          safeValue = value?.[RAW] || value;
          unchanged = this.config.equalityFunction!(safeValue, safeOldValue);
        }
        if (!indiffable && unchanged && !CTX.isCascading) return this.log(`🔄 [Reactor \`set\` Trap] Unchanged for "${keyStr}" on "${paths}"`), true;
        if (this.config.set) terminated = (value = this.config.set(object as PathBranchValue<T>, key as PathKey<T>, value, oldValue, receiver, paths)) === TERMINATOR;
        if (this.setters) {
          const wildcords = this.setters.get("*");
          for (let i = 0; i < loopLen; i++) {
            const currPath = (this.config.lineageTracing ? paths[i] : fullPath) as Paths<T>,
              cords = this.setters.get(currPath);
            if (!cords && !wildcords) continue;
            const target: Target<T> = { path: currPath, value, oldValue, key: keyStr as PathKey<T>, hadKey, object: receiver },
              payload = { type: "set", target, currentTarget: target, root: this.core, terminated, rejectable } as Payload<T, Paths<T>>;
            if (cords) {
              const result = this.mediate(currPath, payload, "set", cords);
              if (!(terminated ||= payload.terminated!)) value = result;
            }
            if (!wildcords) continue;
            target.value = value;
            const result = this.mediate("*", payload, "set", wildcords);
            if (!(terminated ||= payload.terminated!)) value = result;
          } // Mediators
        }
        if (terminated) return this.log(`🛡️ [Reactor \`set\` Trap] Terminated for "${keyStr}" on "${paths}"`), true; // soft rejection if terminated
        const success = !this.config.preserveContext ? (((object as any)[key] = value), true) : Reflect.set(object, key, value, receiver);
        if (!success) return this.log(`❌ [Reactor \`set\` Trap] Failed for "${keyStr}" on "${paths}"`), false; // hard rejection if failed
        if (this.config.referenceTracking && !unchanged) this.config.smartCloning && this.stamp(object), (this.unlink(safeOldValue, object, keyStr), this.link(safeValue, object, keyStr));
        if (this.watchers || this.listeners)
          for (let i = 0; i < loopLen; i++) {
            const currPath = (this.config.lineageTracing ? paths[i] : fullPath) as Paths<T>,
              target: Target<T> = { path: currPath, value, oldValue, key: keyStr as PathKey<T>, hadKey, object: receiver };
            this.notify(currPath, { type: "set", target, currentTarget: target, root: this.core, terminated, rejectable } as Payload<T, Paths<T>>);
          } // Listeners
        return true;
      },
      deleteProperty: (object, key) => {
        let value: any,
          receiver = this.proxyCache.get(object),
          terminated = false;
        const keyStr = String(key),
          fullPath = (path ? path + "." + keyStr : keyStr) as Paths<T>,
          paths = this.config.lineageTracing ? this.trace(object, keyStr) : fullPath,
          loopLen = this.config.lineageTracing ? paths.length : 1,
          oldValue = !this.config.preserveContext ? (object as any)[key] : Reflect.get(object, key, receiver),
          hadKey = !this.config.preserveContext ? key in object : Reflect.has(object, key);
        this.log(`🗑️ [Reactor \`deleteProperty\` Trap] Initiated for "${keyStr}" on "${paths}"`), CTX.autotracker?.track(fullPath, this, true);
        if (this.config.deleteProperty) terminated = (value = this.config.deleteProperty(object as PathBranchValue<T>, key as PathKey<T>, oldValue, receiver, paths)) === TERMINATOR;
        if (this.deleters) {
          const wildcords = this.deleters.get("*");
          for (let i = 0; i < loopLen; i++) {
            const currPath = (this.config.lineageTracing ? paths[i] : fullPath) as Paths<T>,
              cords = this.deleters.get(currPath);
            if (!cords && !wildcords) continue;
            const target: Target<T> = { path: currPath, value, oldValue, key: keyStr as PathKey<T>, hadKey, object: receiver },
              payload = { type: "delete", target, currentTarget: target, root: this.core, rejectable } as Payload<T, Paths<T>>;
            if (cords) {
              const result = this.mediate(currPath, payload, "delete", cords);
              if (!(terminated ||= payload.terminated!)) value = result;
            }
            if (!wildcords) continue;
            const result = this.mediate("*", payload, "delete", wildcords);
            if (!(terminated ||= payload.terminated!)) value = result;
          } // Mediators
        }
        if (terminated) return this.log(`🛡️ [Reactor \`deleteProperty\` Trap] Terminated for "${keyStr}" on "${paths}"`), true; // soft rejection if terminated
        const success = !this.config.preserveContext ? delete (object as any)[key] : Reflect.deleteProperty(object, key);
        if (!success) return this.log(`❌ [Reactor \`deleteProperty\` Trap] Failed for "${keyStr}" on "${paths}"`), false; // hard rejection if failed
        if (this.config.referenceTracking) this.config.smartCloning && this.stamp(object), this.unlink(oldValue?.[RAW] || oldValue, object, keyStr);
        if (this.watchers || this.listeners)
          for (let i = 0; i < loopLen; i++) {
            const currPath = (this.config.lineageTracing ? paths[i] : fullPath) as Paths<T>,
              target: Target<T> = { path: currPath, value, oldValue, key: keyStr as PathKey<T>, hadKey, object: receiver };
            this.notify(currPath, { type: "delete", target, currentTarget: target, root: this.core, rejectable } as Payload<T, Paths<T>>);
          } // Listeners
        return true;
      },
      has: (object, key) => {
        let has = !this.config.preserveContext ? key in object : Reflect.has(object, key);
        const keyStr = String(key),
          fullPath = (path ? path + "." + keyStr : keyStr) as Paths<T>;
        this.log(`❓ [Reactor \`has\` Trap] Initiated for "${keyStr}" on "${fullPath}"`), CTX.autotracker?.track(fullPath, this);
        if (this.config.has) has = this.config.has(object as PathBranchValue<T>, key as PathKey<T>, has, this.proxyCache.get(object), fullPath);
        return has;
      },
      getOwnPropertyDescriptor: (object, key) => {
        let descriptor = !this.config.preserveContext ? Object.getOwnPropertyDescriptor(object, key) : Reflect.getOwnPropertyDescriptor(object, key);
        const keyStr = String(key),
          fullPath = (path ? path + "." + keyStr : keyStr) as Paths<T>;
        this.log(`📋 [Reactor \`getOwnPropertyDescriptor\` Trap] Initiated for "${keyStr}" on "${fullPath}"`), CTX.autotracker?.track(fullPath, this);
        if (this.config.getOwnPropertyDescriptor) descriptor = this.config.getOwnPropertyDescriptor(object as PathBranchValue<T>, key as PathKey<T>, descriptor, this.proxyCache.get(object), this.config.lineageTracing ? this.trace(object, keyStr) : fullPath);
        return descriptor;
      },
      ownKeys: (object) => {
        let ownKeys = Reflect.ownKeys(object); // no faster accurate way without Reflect API
        const safePath = (path || "*") as Paths<T>;
        this.log(`🔑 [Reactor \`ownKeys\` Trap] Initiated on "${safePath}"`), CTX.autotracker?.track(safePath, this);
        if (this.config.ownKeys) ownKeys = this.config.ownKeys(object as PathBranchValue<T>, ownKeys, this.proxyCache.get(object), safePath);
        return ownKeys;
      },
    });
    return this.proxyCache.set(target, proxy), proxy;
  }

  public trace(target: object, path: string, paths: string[] = [], seen = new WeakSet<object>()): Paths<T>[] {
    if (Object.is(target, (this.core as any)[RAW] || this.core)) return paths.push(path), paths as Paths<T>[];
    if (seen.has(target)) return paths as Paths<T>[]; // Stop infinite loops
    seen.add(target);
    const es = (this.lineage ??= new WeakMap()).get(target);
    if (!es) return paths as Paths<T>[];
    for (let i = 0, len = es.length; i < len; i += 2) this.trace(es[i] as object, es[i + 1] ? es[i + 1] + "." + path : path, paths, seen);
    return paths as Paths<T>[];
  } // won't be called without `.config.referenceTracking` so internal guard avoided
  protected link(target: any, parent: object, key: string, typecheck = true, es?: (object | string)[]): boolean {
    if (!canHandle(target, this.config, typecheck)) return false;
    es = (this.lineage ??= new WeakMap()).get(target) ?? (this.lineage!.set(target, (es = [])), es);
    for (let i = 0, len = es.length; i < len; i += 2) if (Object.is(es[i], parent) && es[i + 1] === key) return true;
    return es.push(parent, key), true; // es used as a param: needed storage perk
  }
  protected unlink(target: any, parent: object, key: string): void {
    if (!canHandle(target, this.config)) return;
    const es = (this.lineage ??= new WeakMap()).get(target);
    if (es) for (let i = 0, len = es.length; i < len; i += 2) if (Object.is(es[i], parent) && es[i + 1] === key) return void es.splice(i, 2);
  }
  protected stamp(target: any, typecheck = true, seen = new WeakSet<object>()): void {
    if (typecheck && "object" !== typeof target) return;
    target = target[RAW] || target; // escape hatch from traps
    if (seen.has(target)) return; // Stop infinite loops
    seen.add(target);
    target[VERSION] = (target[VERSION] || 0) + 1;
    const es = (this.lineage ??= new WeakMap()).get(target);
    if (es) for (let i = 0, len = es.length; i < len; i += 2) this.stamp(es[i], false, seen); // walk up the tree; stamp parents
  }

  public mediate<P extends WildPaths<T>>(path: WildPaths<T>, payload: Payload<T, P>, type: "get", cords: GetterRecord<T>[]): PathValue<T, P>;
  public mediate<P extends WildPaths<T>>(path: WildPaths<T>, payload: Payload<T, P>, type: "set", cords: SetterRecord<T>[]): PathValue<T, P>;
  public mediate<P extends WildPaths<T>>(path: WildPaths<T>, payload: Payload<T, P>, type: "delete", cords: DeleterRecord<T>[]): PathValue<T, P>;
  public mediate<P extends WildPaths<T>>(path: WildPaths<T>, payload: Payload<T, P>, type: "get" | "set" | "delete", cords: Array<GetterRecord<T> | SetterRecord<T> | DeleterRecord<T>>) {
    let terminated = false,
      value = payload.target.value; // mediator called when necessary & ready for the argument work, all facts (params) are brought to the table so no `?.`
    const isGet = type === "get",
      isSet = type === "set",
      mediators = isGet ? this.getters : isSet ? this.setters : this.deleters;
    for (let i = !isGet ? 0 : cords.length - 1, len = !isGet ? cords.length : -1; i !== len; i += !isGet ? 1 : -1) {
      const response: any = isGet ? (cords[i] as GetterRecord<T>).cb(value, payload) : isSet ? (cords[i] as SetterRecord<T>).cb(value, terminated, payload) : (cords[i] as DeleterRecord<T>).cb(terminated, payload); // all will mediate
      if (isGet || !(terminated ||= payload.terminated = response === TERMINATOR)) value = response as PathValue<T, P>;
      if (cords[i].once) cords.splice((len--, i--), 1), !cords.length && mediators!.delete(path);
    }
    return value; // set - FIFO, get - LIFO
  }

  public notify<P extends Paths<T>>(path: P, payload: Payload<T, P>): void {
    if (this.watchers) {
      const wildcords = this.watchers.get("*") as Array<WatcherRecord<T, "*">> | undefined,
        cords = this.watchers.get(path) as Array<WatcherRecord<T, P>> | undefined;
      if (cords)
        for (let i = 0, len = cords.length; i < len; i++) {
          cords[i].cb(payload.target.value as PathValue<T, P>, payload); // watchers do not terminate as they're after the OP
          if (cords[i].once) cords.splice((len--, i--), 1), !cords.length && this.watchers!.delete(path);
        }
      if (wildcords)
        for (let i = 0, len = wildcords.length; i < len; i++) {
          wildcords[i].cb(payload.target.value, payload as Payload<T, "*">);
          if (wildcords[i].once) wildcords.splice((len--, i--), 1), !wildcords.length && this.watchers!.delete("*");
        }
    }
    this.listeners && this.schedule(path, payload); // batch is undefined till listeners are available
  }
  protected schedule<P extends Paths<T>>(path: P, payload: Payload<T, P>): void {
    this.batch ??= new Map();
    this.batch.set(path, payload), !this.isBatching && this.initBatching();
  }
  protected initBatching(): void {
    (this.isBatching = true), this.config.batchingFunction!(() => this.flush()); // do the `!isBatching` check outisde so the func cost is only on first batch
  }
  protected flush(): void {
    (this.isBatching = false), this.batch && this.tick(this.batch.keys()); // not slowing dis down with a `?.size` since it's like always filled, rather pay the empty iterator cost once when empty
    if (this.queue?.size) for (const task of this.queue) task(), this.queue.delete(task); // you can still stall with an empty batch, slower `?.`, almost always empty; this or empty Iterator cost
  }

  public wave<P extends Paths<T>>(path: P, payload: Payload<T, P>): void {
    const e = new ReactorEvent<T>(payload, this) as REvent<T>, // a wave is started forly when really necessary all things considered
      chain = getTrailRecords(this.core, path); // either build a large array to climb back up or have to derive each step
    // 1: CAPTURE phase (core -> parent) - intent owners reject here, capture should preferably be used to reject
    e.eventPhase = ReactorEvent.CAPTURING_PHASE;
    for (let i = 0; i <= chain.length - 2; i++) {
      if (e.propagationStopped) break;
      this.fire(chain[i], e, true);
    }
    if (e.propagationStopped) return;
    // 2: TARGET phase (leaf)
    e.eventPhase = ReactorEvent.AT_TARGET;
    this.fire(chain[chain.length - 1], e, true); // CAPTURE fires
    !e.immediatePropagationStopped && this.fire(chain[chain.length - 1], e, false); // BUBBLE fires
    if (!e.bubbles) return;
    // 3: BUBBLE phase (parent -> core) - listeners always see it, rejection is just a flag for smart optimists
    e.eventPhase = ReactorEvent.BUBBLING_PHASE;
    for (let i = chain.length - 2; i >= 0; i--) {
      if (e.propagationStopped) break;
      this.fire(chain[i], e, false);
    }
    // if (e.rejected) return; // 4: DEFAULT phase if ever, whole architecture can be reimagined: `State vs Intent` is my view; reactor is still dumb
  }
  protected fire([path, object, value]: ReturnType<typeof getTrailRecords<T>>[number], e: REvent<T>, isCapture: boolean, cords = this.listeners!.get(path)): void {
    if (!cords) return; // not doing `.listeners?.` in param cuz this is called in a loop and internally, listeners are defined before this is touched
    e.type = path !== e.target.path ? "update" : e.staticType; // `update` for ancestors
    e.currentTarget = { path, value, oldValue: e.type !== "update" ? e.target.oldValue : undefined, key: (e.type !== "update" ? path : path.slice(path.lastIndexOf(".") + 1) || "") as PathKey<T>, hadKey: e.type !== "update" ? e.target.hadKey : true, object: object as PathBranchValue<T> };
    for (let i = 0, len = cords.length, tDepth; i < len; i++) {
      if (e.immediatePropagationStopped) break;
      if (cords[i].capture !== isCapture) continue;
      if (cords[i].depth !== undefined) {
        tDepth ??= this.getDepth(e.target.path); // calc only if ever needed
        if (tDepth > cords[i].lDepth! + cords[i].depth!) continue;
      }
      cords[i].cb(e);
      if (cords[i].once) cords.splice((len--, i--), 1), !cords.length && this.listeners!.delete(path);
    }
  }

  /**
   * Flushes queued listener payloads.
   * @param paths Optional path (or paths) to flush.
   * @example
   * rtr.tick(); // to flush all paths in batch or pass "*" wildcard
   * @example
   * rtr.tick("user.profile.name");
   */
  public tick(paths?: Paths<T> | Iterable<Paths<T>>): void {
    if (!paths || paths === "*") return this.flush(); // we are sure listeners are defined before waving since batch depends on them
    if ("string" === typeof paths) {
      const payload = this.batch?.get(paths) as Payload<T, Paths<T>> | undefined;
      payload && (this.batch!.delete(paths), this.wave(paths, payload));
    } else
      for (const path of paths) {
        const payload = this.batch!.get(path) as Payload<T, Paths<T>> | undefined; // `!` cuz tick is only called inside the class with iterable paths when batch is defined
        payload && (this.batch!.delete(path), this.wave(path, payload));
      }
  }
  /**
   * Queues a task to run after the current flush cycle.
   * @param task Task callback.
   * @example
   * const task = () => console.log("after flush");
   * rtr.stall(task);
   */
  public stall(task: () => any): void {
    (this.queue ??= new Set()).add(task), !this.isBatching && this.initBatching();
  }
  /**
   * Removes a queued post-flush task.
   * @param task Task callback.
   * @returns `undefined` when no queue, `false` when queue exist but callback is not found, `true` when removed.
   */
  public nostall(task: () => any): boolean | undefined {
    return this.queue?.delete(task);
  }

  public getDepth(path: string, depth = !path ? 0 : 1): number {
    for (let i = 0, len = path.length; i < len; i++) if (path.charCodeAt(i) === 46) depth++; // zero alloc; so when we say it's optmized, it's not cap :)
    return depth;
  }
  public getContext<P extends WildPaths<T>>(path: P): Target<T, P> {
    const last = path.lastIndexOf("."),
      value = getAny(this.core, path),
      object = last === -1 ? this.core : getAny(this.core, path.slice(0, last) as Paths<T>);
    return { path: path as P, value, key: (path.slice(last + 1) || "") as PathKey<T, P>, hadKey: true, object: object as PathBranchValue<T, P> };
  }
  protected bindSignal<Cb>(cord: GetterRecord<T> | SetterRecord<T> | DeleterRecord<T> | WatcherRecord<T> | ListenerRecord<T>, sig?: AbortSignal): Cb {
    if (sig) sig.aborted ? cord.clup() : sig.addEventListener("abort", cord.clup, { once: true }); // once incase spec changes, memory leaks too
    return (cord.sclup = !sig || sig.aborted ? NOOP : () => sig.removeEventListener("abort", cord.clup)), cord.clup as Cb;
  }
  protected cloned<O>(target: O, raw: boolean, seen = new WeakMap()): O {
    if (!target || "object" !== typeof target) return target;
    const obj = (target as any)[RAW] || target, // escape hatch from traps
      cloned = seen.get(obj);
    if (cloned) return cloned;
    if (!canHandle(obj, this.config, false)) return obj; // no circular references
    const version = obj[VERSION] || 0,
      cached = !raw && this.config.smartCloning && (this.snapCache ??= new WeakMap()).get(obj);
    if (cached && obj[SSVERSION] === version) return cached;
    const clone = !raw ? (this.config.preserveContext ? Object.create(Object.getPrototypeOf(obj)) : Array.isArray(obj) ? [] : {}) : obj;
    seen.set(obj, clone);
    const keys = this.config.preserveContext ? Reflect.ownKeys(obj) : Object.keys(obj);
    for (let i = 0, len = keys.length; i < len; i++)
      try {
        clone[keys[i]] = this.cloned(obj[keys[i]], raw, seen);
      } catch {} // call a spade a spade and just skip, no descriptor gymanstics
    if (!raw && this.config.smartCloning) this.snapCache!.set(obj, clone), (obj[SSVERSION] = version);
    return clone;
  }

  protected syncAdd<P extends WildPaths<T>>(key: "get" | "set" | "delete" | "watch", path: P, cb: any, opts: SyncOptions | undefined, onImmediate: (immediate: boolean | "auto") => void = NOOP): () => boolean | undefined {
    const { lazy = false, once = false, signal, immediate = false } = parseEvtOpts(opts, EVT_OPTS.MEDIATOR),
      store = (this[`${key}${key.endsWith("t") ? "t" : ""}ers` as "getters"] ??= new Map()) as Map<WildPaths<T>, Array<GetterRecord<T> | SetterRecord<T> | DeleterRecord<T> | WatcherRecord<T>>>;
    let cords = store.get(path),
      cord: GetterRecord<T> | SetterRecord<T> | DeleterRecord<T> | WatcherRecord<T> | undefined;
    if (cords)
      for (let i = 0, len = cords.length; i < len; i++)
        if (Object.is(cords[i].cb, cb)) {
          cord = cords[i];
          break;
        }
    if (cord) return cord.clup;
    let task: () => void;
    cord = { cb, once, clup: () => (lazy && this.nostall(task), this[`no${key}` as "noget"](path, cb)) };
    immediate && onImmediate(immediate);
    task = () => (cords ?? (store.set(path, (cords = [])), cords)).push(cord);
    lazy ? this.stall(task) : task();
    return this.bindSignal(cord!, signal);
  }
  protected syncDrop<P extends WildPaths<T>>(store: Map<WildPaths<T>, any[]> | undefined, path: P, cb: any): boolean | undefined {
    const cords = store?.get(path);
    if (!cords) return undefined;
    for (let i = 0, len = cords.length; i < len; i++) if (Object.is(cords[i].cb, cb)) return cords[i].sclup!(), cords.splice((len--, i--), 1), !cords.length && store!.delete(path), true;
    return false;
  }

  /**
   * Registers a get mediator for a path.
   * @param path Path or wildcard path.
   * @param callback Mediator callback.
   * @param options Sync options.
   * @returns Cleanup function.
   * @example
   * const cleanup = rtr.get("user.name", (value) => String(value).trim());
   */
  public get<P extends WildPaths<T>>(path: P, callback: Getter<T, P>, options?: SyncOptions): GetterRecord<T>["clup"] {
    return this.syncAdd("get", path, callback, options, (imm) => (imm !== "auto" || inAny(this.core, path)) && getAny(this.core, path)); // a progressive enhancment for gets that are virtual and should not affect init
  }
  /** Registers a get mediator for a path that only triggers once. */
  public gonce<P extends WildPaths<T>>(path: P, callback: Getter<T, P>, options?: SyncOptions): GetterRecord<T>["clup"] {
    return this.get<P>(path, callback, { ...parseEvtOpts(options, EVT_OPTS.MEDIATOR), once: true });
  }
  /**
   * Removes a get mediator for a path.
   * @param path Path or wildcard path.
   * @param callback Mediator callback to remove.
   * @returns `undefined` when the path has no records, `false` when records exist but callback is not found, `true` when removed.
   */
  public noget<P extends WildPaths<T>>(path: P, callback: Getter<T, P>): boolean | undefined {
    return this.syncDrop(this.getters, path, callback);
  }

  /**
   * Registers a set mediator for a path.
   * @param path Path or wildcard path.
   * @param callback Mediator callback.
   * @param options Sync options.
   * @returns Cleanup function.
   * @example
   * rtr.set("user.name", (value) => String(value).trim());
   */
  public set<P extends WildPaths<T>>(path: P, callback: Setter<T, P>, options?: SyncOptions): SetterRecord<T>["clup"] {
    return this.syncAdd("set", path, callback, options, (imm) => (imm !== "auto" || inAny(this.core, path)) && setAny(this.core, path, getAny(this.core, path)!));
  }
  /** Registers a set mediator for a path that only triggers once. */
  public sonce<P extends WildPaths<T>>(path: P, callback: Setter<T, P>, options?: SyncOptions): SetterRecord<T>["clup"] {
    return this.set<P>(path, callback, Object.assign(parseEvtOpts(options, EVT_OPTS.MEDIATOR), { once: true }));
  }
  /**
   * Removes a set mediator for a path.
   * @param path Path or wildcard path.
   * @param callback Mediator callback to remove.
   * @returns `undefined` when the path has no records, `false` when records exist but callback is not found, `true` when removed.
   */
  public noset<P extends WildPaths<T>>(path: P, callback: Setter<T, P>): boolean | undefined {
    return this.syncDrop(this.setters, path, callback);
  }

  /**
   * Registers a delete mediator for a path.
   * @param path Path or wildcard path.
   * @param callback Mediator callback.
   * @param options Sync options.
   * @returns Cleanup function.
   * @example
   * rtr.delete("cache.temp", () => TERMINATOR);
   */
  public delete<P extends WildPaths<T>>(path: P, callback: Deleter<T, P>, options?: SyncOptions): DeleterRecord<T>["clup"] {
    return this.syncAdd("delete", path, callback, options, (imm) => (imm !== "auto" || inAny(this.core, path)) && deleteAny(this.core, path));
  }
  /** Registers a delete mediator for a path that only triggers once. */
  public donce<P extends WildPaths<T>>(path: P, callback: Deleter<T, P>, options?: SyncOptions): DeleterRecord<T>["clup"] {
    return this.delete<P>(path, callback, Object.assign(parseEvtOpts(options, EVT_OPTS.MEDIATOR), { once: true }));
  }
  /**
   * Removes a delete mediator for a path.
   * @param path Path or wildcard path.
   * @param callback Mediator callback to remove.
   * @returns `undefined` when the path has no records, `false` when records exist but callback is not found, `true` when removed.
   */
  public nodelete<P extends WildPaths<T>>(path: P, callback: Deleter<T, P>): boolean | undefined {
    return this.syncDrop(this.deleters, path, callback);
  }

  /**
   * Registers a watcher for a path.
   * Watch callbacks run synchronously with the operation, use leaf paths for reliability as it sees exact sets; no bubbling here.
   * @param path Path or wildcard path.
   * @param callback Watch callback.
   * @param options Sync options.
   * @returns Cleanup function.
   * @example
   * const cleanup = rtr.watch("user.name", (value) => console.log(value));
   */
  public watch<P extends WildPaths<T>>(path: P, callback: Watcher<T, P>, options?: SyncOptions): WatcherRecord<T>["clup"] {
    return this.syncAdd("watch", path, callback, options, (imm) => imm !== "auto" && inAny(this.core, path) && ((target) => callback(target.value, { type: "init", target, currentTarget: target, root: this.core, rejectable: false } as Payload<T, P>))(this.getContext(path)));
  }
  /** Registers a watcher for a path that only triggers once. */
  public wonce<P extends WildPaths<T>>(path: P, callback: Watcher<T, P>, options?: SyncOptions): WatcherRecord<T>["clup"] {
    return this.watch<P>(path, callback, Object.assign(parseEvtOpts(options, EVT_OPTS.MEDIATOR), { once: true }));
  }
  /**
   * Removes a watcher for a path.
   * @param path Path or wildcard path.
   * @param callback Watch callback to remove.
   * @returns `undefined` when the path has no records, `false` when records exist but callback is not found, `true` when removed.
   */
  public nowatch<P extends WildPaths<T>>(path: P, callback: Watcher<T, P>): boolean | undefined {
    return this.syncDrop(this.watchers, path, callback);
  }

  /**
   * Registers an event listener for a path.
   * `on` listeners are batched and notified asynchronously by default e.g. `queueMicrotask()`.
   * @param path Path or wildcard path.
   * @param callback Listener callback.
   * @param options Listener options.
   * @returns Cleanup function.
   * @example
   * const cleanup = rtr.on("user.name", (e) => console.log(e.type, e.path));
   */
  public on<P extends WildPaths<T>, const D extends number = MaxDepth>(path: P, callback: Listener<T, P, D>, options?: ListenerOptions<D>): ListenerRecord<T, P, D>["clup"] {
    this.listeners ??= new Map();
    const { capture = false, once = false, signal, immediate = false, depth } = parseEvtOpts(options, EVT_OPTS.LISTENER);
    let cords = this.listeners.get(path),
      cord: ListenerRecord<T> | undefined;
    if (cords)
      for (let i = 0, len = cords.length; i < len; i++)
        if (Object.is(cords![i].cb, callback) && capture === cords![i].capture) {
          cord = cords![i];
          break;
        }
    if (cord) return cord.clup;
    cord = { cb: callback as Listener<T>, capture, depth: depth as MaxDepth, once, clup: () => this.off<P, D>(path, callback, options), lDepth: depth !== undefined ? this.getDepth(path) : depth };
    if (immediate && (immediate !== "auto" || inAny(this.core, path))) {
      const target = this.getContext(path) as Target<T, P>;
      callback(new ReactorEvent<T, P>({ type: "init", target, currentTarget: target, root: this.core, rejectable: false }, this) as REvent<T, P, D>);
    }
    (cords ?? (this.listeners.set(path, (cords = [])), cords)).push(cord!);
    return this.bindSignal(cord!, signal);
  }
  /** Registers an event listener for a path that only triggers once. */
  public once<P extends WildPaths<T>, const D extends number = MaxDepth>(path: P, callback: Listener<T, P, D>, options?: ListenerOptions<D>): ListenerRecord<T, P, D>["clup"] {
    return this.on<P, D>(path, callback, Object.assign(parseEvtOpts(options, EVT_OPTS.LISTENER), { once: true }));
  }
  /**
   * Removes an event listener for a path.
   * @param path Path or wildcard path.
   * @param callback Listener callback to remove.
   * @param options Listener options used during registration.
   * @returns `undefined` when the path has no records, `false` when records exist but callback is not found, `true` when removed.
   * @example
   * const cb = (e: REvent<T>) => console.log(e.path);
   * rtr.on("user.name", cb);
   * rtr.off("user.name", cb);
   */
  public off<P extends WildPaths<T>, const D extends number = MaxDepth>(path: P, callback: Listener<T, P, D>, options?: ListenerOptions<D>): boolean | undefined {
    const cords = this.listeners?.get(path);
    if (!cords) return undefined;
    const { capture } = parseEvtOpts(options, EVT_OPTS.LISTENER);
    for (let i = 0, len = cords.length; i < len; i++) if (Object.is(cords[i].cb, callback) && cords[i].capture === capture) return cords[i].sclup!(), cords.splice((len--, i--), 1), !cords.length && this.listeners!.delete(path), true;
    return false;
  }

  /**
   * Creates a snapshot; possibly clone of state (or a state branch).
   * You could alternatively use or serialize your proxied state "as is" except the environment demands no proxies or new references.
   * @param raw Use raw (deep unproxied & uncloned) version of branch, defaults to `true` if `config.smartCloning: false`.
   * @param branch Specific branch to clone.
   * @returns Snapshot deep or smart (structurally shared) clone.
   * @example
   * const snap = rtr.snapshot();
   * @example
   * const snap = rtr.snapshot(false, rtr.core.history.past);
   */
  public snapshot(raw?: boolean): T;
  public snapshot<B>(raw?: boolean, branch?: B): B;
  public snapshot(raw = !this.config.smartCloning, branch?: any) {
    return this.cloned(arguments.length < 2 ? this.core : branch, raw); // raw is true if not smart cloning(structural sharing) for better vanilla performace except explicitly changed
  }

  /**
   * Installs a module instance.
   * @param target Module instance.
   * @param id Optional identification tag for this instance in the module.
   * @returns Current `Reactor` instance for fluent chaining.
   */
  public use(target: ReactorModule<T>, id?: ReactorModuleId): this {
    return (this.modules ??= new Set()).add(target.setup(this, id)), this;
  }
  /** Resets this reactor instance to its initial state. */
  public reset(): void {
    this.getters?.clear(), this.setters?.clear(), this.deleters?.clear(), this.watchers?.clear(), this.listeners?.clear();
    this.batch?.clear(), this.queue?.clear(), (this.isBatching = false);
  }
  public destroy(): void {
    if (this.modules) for (const mdle of this.modules) mdle.destroy();
    this.reset(), nuke(this);
  }

  public get canLog(): boolean {
    return this.log !== NOOP;
  }
  public set canLog(value: boolean) {
    this.log = value ? RTR_LOG : NOOP;
  }
  public get canLineageTrace() {
    return this.config.lineageTracing && this.config.referenceTracking;
  }
  public get canSmartClone() {
    return this.config.smartCloning && this.config.referenceTracking;
  }
}
