import { BaseReactorModule, wpArr } from "./base";
import { StorageAdapter, LocalStorageAdapter, AsyncStorageAdapter, type StorageAdapterConstructor, type AsyncStorageAdapterConstructor } from "../utils/store";
import { type FanoutTuple, fanoutOptsArr, setAny, getAny, fanout, mergeObjs, parseEvtOpts } from "../utils/obj";
import { setTimeout } from "../utils/fn";
import { Reactor } from "../core/reactor";
import type { REvent, Inert } from "../types/reactor";
import type { Paths } from "../types/obj";

export interface PersistConfig<T extends object, P extends Paths<T> = Paths<T>> {
  /** Whether the persistence is disabled and cleared */
  disabled: boolean;
  /** The key under which to store the persisted data */
  key: string;
  /** Specific paths only, no need for "*"; instead don't pass anything */
  paths: P[];
  /** Storage adapter class or instance to use, can satisfy `instanceof` or just definition, cast to `any` if the latter */
  adapter: Inert<StorageAdapter> | Inert<AsyncStorageAdapter> | Inert<StorageAdapterConstructor> | Inert<AsyncStorageAdapterConstructor>; // pass in the instance if u wanna do custom config
  /** Throttle time for saving changes */
  throttle: number;
  /** Fan out restored hydration writes so listeners/effects catch up, defaults to `true` if async for predictability */
  fanout: boolean | FanoutTuple;
  /** - `false`: persist live proxied roots (fastest, adapter must handle proxies).
   * - `true`,`"auto"`: persist via `Reactor.snapshot()` but `true` force-enables `Reactor.config.referenceTracking`+`Reactor.config.smartCloning` for better performance. */
  useSnapshot: boolean | "auto";
}

export interface PersistState {
  /** Whether the persisted data has been loaded. */
  hydrated: boolean;
}

/**
 * - The Storage Manager.
 * - Configurable storage adapters for maximum flexibility (localStorage, sessionStorage, IndexedDB, cookies, custom server persisters, etc.)
 * Path-based persistence for fine-grained control over what gets persisted across single or multiple reactors, merges into a single serialized state tree.
 * When using async adapters, listen to `state.hydrated` (preferably `once`) before the setup of modules that should ignore hydration waves.
 */
export class PersistModule<T extends object = any, P extends Paths<T> = Paths<T>> extends BaseReactorModule<T, PersistConfig<T, P>, PersistState> {
  public static readonly moduleName: string = "persist";
  public adapter!: StorageAdapter | AsyncStorageAdapter;
  protected hydrateSeq = 0;
  protected saveTimeoutId = 0;

  public get payload() {
    let res: Record<string, any> | undefined = this.rtrs.size > 1 ? {} : undefined;
    for (const [rid, rtr] of this.rtrs) {
      const snap = this.config.useSnapshot ? (this.config.useSnapshot === true && (rtr.config.referenceTracking = rtr.config.smartCloning = true), rtr.snapshot()) : rtr.core,
        val: any = this.config.paths ? this.config.paths.reduce((acc: any, p) => (setAny(acc, p, getAny(snap, p)), acc), {}) : snap;
      this.rtrs.size > 1 ? setAny(res!, rid as any, val) : (res = val); // allows merging with path-like ids
    }
    return res;
  }

  constructor(config?: Partial<PersistConfig<T, P>>, rtr?: Reactor<T>) {
    super(mergeObjs(PERSIST_MODULE_BUILD, config) as PersistConfig<T, P>, rtr, { hydrated: false });
  }

  public wire() {
    // Event Listeners
    "undefined" !== typeof window && window.addEventListener("pagehide", this.onDestroy, { signal: this.signal });
    "undefined" !== typeof document && document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && this.onDestroy(), { signal: this.signal });
    // Config Listeners
    this.config.on("adapter", this.handleAdapter, { signal: this.signal, immediate: true });
    this.config.on("disabled", this.handleDisabled, { signal: this.signal, immediate: true });
    this.config.on("paths", this.handlePaths, { signal: this.signal, immediate: true });
  }

  protected override onAttach(rtr: Reactor<any>) {
    for (const p of this.config.paths ?? wpArr) !this.config.disabled ? rtr.on(p as any, this.handleSave, { signal: this.signal, immediate: true }) : rtr.off(p as any, this.handleSave);
  }

  protected async handleAdapter({ value = LocalStorageAdapter }: REvent<PersistConfig<T, P>, "adapter">) {
    const seq = ++this.hydrateSeq;
    if (this.adapter && value === this.adapter.constructor) return;
    this.state.hydrated = false;
    this.adapter?.remove(this.config.key); // Cleanup old adapter storage
    this.adapter = "function" === typeof value ? new (value as StorageAdapterConstructor)({ debug: !!this.rtrs.values().next().value?.canLog }) : value; // dynamic, instance or not; pass am come :)
    try {
      let saved = this.adapter.get(this.config.key);
      const isAsync = saved instanceof Promise, // accuracy incase overriden methods are async
        { depth, merge = true } = parseEvtOpts(this.config.fanout ?? isAsync, fanoutOptsArr, "depth");
      saved = !isAsync ? saved : await saved;
      if (seq !== this.hydrateSeq || !saved) return;
      for (const [rid, rtr] of this.rtrs) {
        const entry = this.rtrs.size > 1 ? getAny(saved, rid as any) : saved; // allows retrieving with path-like ids
        if (!entry) continue;
        const set = (p: any, news: any, olds: any) => (depth ? (fanout as any) : setAny)(rtr.core, p, merge ? mergeObjs(news, olds) : olds, depth ? { depth, crossRealms: rtr.config.crossRealms } : undefined); // if sync, merge directly, else fanout with options for granularity
        for (const p of this.config.paths ?? wpArr) set(p, getAny(rtr.core, p), getAny(entry, p));
      }
      for (const rtr of this.rtrs.values()) rtr.tick(depth ? "*" : this.config.paths ?? "*"); // if sync, tick "written paths" b4 listeners init, else tick "written paths if known" or "all" for their refresh
    } finally {
      if (seq === this.hydrateSeq) this.state.hydrated = true;
    }
  }

  protected handleDisabled({ value }: REvent<PersistConfig<T, P>, "disabled">) {
    for (const rtr of this.rtrs.values()) this.onAttach(rtr);
    value && this.adapter?.remove(this.config.key);
  }

  protected handlePaths({ value: paths = wpArr, oldValue: prevs = wpArr }: REvent<PersistConfig<T, P>, "paths">) {
    for (const rtr of this.rtrs.values()) {
      for (const p of prevs) rtr.off(p, this.handleSave);
      for (const p of paths) rtr.off(p, this.handleSave), !this.config.disabled && rtr.on(p, this.handleSave, { signal: this.signal, immediate: true });
    }
  }

  protected handleSave(e: REvent<any, P>) {
    if (!this.state.hydrated) return e.stopImmediatePropagation(); // told y'all to register persist module first, really hope y'all did
    if (!this.saveTimeoutId) this.saveTimeoutId = setTimeout(() => (this.adapter.set(this.config.key, this.payload), (this.saveTimeoutId = 0)), this.config.throttle, this.signal);
  }

  /** Clears persisted payload for this module instance and drops any pending save. */
  public clear() {
    clearTimeout(this.saveTimeoutId);
    this.saveTimeoutId = -1;
    for (const rtr of this.rtrs.values()) rtr.stall(() => (this.saveTimeoutId = 0)); // hack to delay saves till next tick
    this.adapter?.remove(this.config.key);
  }

  protected onDestroy() {
    this.state.hydrated && !this.config.disabled && this.adapter?.set(this.config.key, this.payload); // One last save before the lights go out
  }
}

export const PERSIST_MODULE_BUILD: Partial<PersistConfig<any>> = { disabled: false, key: "REACTOR_STORE", throttle: 2500, useSnapshot: false };
