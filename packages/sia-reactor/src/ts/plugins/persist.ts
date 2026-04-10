import { BaseReactorPlugin } from "./base";
import { StorageAdapter, LocalStorageAdapter, AsyncStorageAdapter, type StorageAdapterConstructor, type AsyncStorageAdapterConstructor } from "../utils/store";
import { mergeObjs, setAny, getAny, isPOJO } from "../utils/obj";
import { setTimeout } from "../utils/fn";
import { Reactor } from "../core/reactor";
import type { REvent, Inert } from "../types/reactor";
import type { Paths } from "../types/obj";

export interface PersistConfig<T extends object> {
  /** Whether the persistence is disabled and cleared */
  disabled: boolean;
  /** The key under which to store the persisted data */
  key: string;
  /** Specific paths only, no "*"; instead don't pass anything */
  paths: Paths<T>[];
  /** Storage adapter class or instance to use, can satisfy `instanceof` or just definition, cast to `any` if the latter */
  adapter: Inert<StorageAdapter> | Inert<AsyncStorageAdapter> | Inert<StorageAdapterConstructor> | Inert<AsyncStorageAdapterConstructor>; // pass in the instance if u wanna do custom config
  /** Throttle time for saving changes */
  throttle: number;
  /** Whether to use a clone of the state from `rtr.snapshot()`, incase store doesn't understand proxies */
  useSnapshot: boolean;
}

/**
 * The Storage Manager.
 * - Configurable storage adapters for maximum flexibility (localStorage, sessionStorage, IndexedDB, cookies, custom server persisters, etc.)
 */
export class PersistPlugin<T extends object = any> extends BaseReactorPlugin<T, PersistConfig<T>> {
  public static readonly plugName = "persist";
  public adapter!: StorageAdapter | AsyncStorageAdapter;
  protected saveTimeoutId: number = 0;
  public get payload() {
    const snap = this.config.useSnapshot ? this.rtr.snapshot() : this.rtr.core;
    return this.config.paths ? this.config.paths.reduce((acc: T, p) => (setAny(acc, p, getAny(snap, p)), acc), {} as T) : snap;
  }

  constructor(config?: Partial<PersistConfig<T>>, rtr?: Reactor<T>) {
    super({ ...PERSIST_PLUGIN_BUILD, ...config } as PersistConfig<T>, rtr);
  }

  public wire() {
    // Event Listeners
    "undefined" !== typeof window && window.addEventListener("pagehide", this.onDestroy, { signal: this.signal });
    "undefined" !== typeof document && document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && this.onDestroy(), { signal: this.signal });
    // Config Listeners
    this.config.on("adapter", this.handleAdapterChange, { signal: this.signal, immediate: true });
    this.config.on("disabled", this.handleDisabledChange, { signal: this.signal, immediate: true });
    this.config.on("paths", this.handlePathsState, { signal: this.signal, immediate: true });
  }

  protected async handleAdapterChange({ value = LocalStorageAdapter }: REvent<PersistConfig<T>, "adapter">) {
    if (this.adapter && value === this.adapter.constructor) return;
    this.adapter?.remove(this.config.key); // Cleanup old adapter storage
    this.adapter = "function" === typeof value ? new (value as StorageAdapterConstructor)({ debug: this.rtr.canLog }) : value; // dynamic, instance or not; pass am come :)
    let saved = this.adapter.get(this.config.key);
    const isAsync = saved instanceof Promise; // accuracy incase overriden methods are async
    saved = !isAsync ? saved : await saved;
    const set = (p: any, news: any, olds: any) => setAny(this.rtr.core, p, isPOJO(news, this.rtr.config) && isPOJO(olds, this.rtr.config) ? mergeObjs(news, olds) : olds);
    if (saved) for (const p of this.config.paths ?? ["*"]) set(p, getAny(this.rtr.core, p), getAny(saved, p));
    saved && this.rtr.tick(this.config.paths ?? "*"); // sync immediately
  }

  protected handleDisabledChange({ value }: REvent<PersistConfig<T>, "disabled">) {
    for (const p of this.config.paths ?? ["*"]) this.rtr.off(p, this.throttleSave), !value && this.rtr.on(p, this.throttleSave, { signal: this.signal, immediate: true });
    value && this.adapter?.remove(this.config.key);
  }

  protected handlePathsState({ value: paths = ["*"] as any, oldValue: prevs = ["*"] as any }: REvent<PersistConfig<T>, "paths">) {
    for (const p of prevs) this.rtr.off(p, this.throttleSave);
    for (const p of paths) this.rtr.off(p, this.throttleSave), !this.config.disabled && this.rtr.on(p, this.throttleSave, { signal: this.signal, immediate: true });
  }

  protected throttleSave() {
    if (!this.saveTimeoutId) this.saveTimeoutId = setTimeout(() => (this.adapter.set(this.config.key, this.payload), (this.saveTimeoutId = 0)), this.config.throttle, this.signal); // 5000ms mapping to TVP config
  }

  /** Clears persisted payload for this plugin instance and drops any pending save. */
  public clear() {
    clearTimeout(this.saveTimeoutId);
    (this.saveTimeoutId = -1), this.rtr.stall(() => (this.saveTimeoutId = 0)); // hack to delay saves till next tick
    this.adapter?.remove(this.config.key);
  }

  protected onDestroy() {
    !this.config.disabled && this.adapter?.set(this.config.key, this.payload); // One last save before the lights go out
  }
}

export const PERSIST_PLUGIN_BUILD: Partial<PersistConfig<any>> = { disabled: false, key: "REACTOR_STORE", throttle: 2500, useSnapshot: false };
