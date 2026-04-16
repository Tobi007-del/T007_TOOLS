import { NIL, NOOP } from "../core/consts";

// DEFINITION INTERFACES
export type JSONReplacer = ((this: any, key: string, value: any) => any) | (number | string)[] | null;
export type JSONReviver = ((this: any, key: string, value: any) => any) | undefined;
export interface StorageAdapterConfig {
  debug: boolean;
  /** Optional `JSON.stringify()` like replacer to be used where applicable. */
  replacer?: JSONReplacer;
  /** Optional `JSON.parse()` like reviver to be used where applicable. */
  reviver?: JSONReviver;
}
export interface CookieOptions {
  /** Cookie path scope, defaults to root for maximum accessibility. */
  path: string;
  /** Optional cookie domain scope, e.g. ".example.com". */
  domain?: string;
  /** Cookie Secure attribute, defaults to `false` but should be `true` in production for HTTPS sites. */
  secure: boolean;
  /** Cookie SameSite attribute for CSRF protection, defaults to "Lax" for a balance of security and usability. */
  sameSite: "Strict" | "Lax" | "None";
  /** Optional cookie lifetime in seconds, e.g. 604800 for a week. */
  maxAge?: number;
  /** Optional absolute cookie expiry date, e.g. (new Date()).setDate(new Date().getDate() + 7), "Wed, 21 Oct 2023 07:28:00 GMT" (UTC Format). */
  expires?: string | Date;
}
export interface CookieAdapterConfig extends StorageAdapterConfig, CookieOptions {}
export interface MemoryAdapterConfig extends StorageAdapterConfig {
  /** stored as strings to mimic local constraints */
  store: Map<string, string>;
}
export interface IndexedDBAdapterConfig extends StorageAdapterConfig, IDBTransactionOptions {
  /** The name of the IndexedDB database to be created or retrieved. */
  dbName: string;
  /** Database version tag to use during creation or retrieval. */
  version: number;
  /** First store is default during operations if none provided */
  stores: string[];
  /** return a preffered instance or `throw` to prevent accessing the database */
  onidb: () => any;
  /** Called when the database request needs to be upgraded */
  onupgradeneeded: (database: IDBDatabase, event: IDBVersionChangeEvent) => void;
  /** Called when the database version changes */
  onversionchange: (database: IDBDatabase, event: IDBVersionChangeEvent) => void;
  /** Called when the database request is successful */
  onsuccess: (database: IDBDatabase, event: Event) => void;
  /** Called when the database request fails */
  onerror: (error: DOMException | null, event: Event) => any;
  /** Called when the database request is blocked */
  onblocked: (event: IDBVersionChangeEvent) => void;
}

// CONSTRUCTOR INTERFACES
export interface StorageAdapterConstructor<Config extends StorageAdapterConfig = StorageAdapterConfig> {
  new (config?: Config): StorageAdapter<Config>;
}
export interface AsyncStorageAdapterConstructor<Config extends StorageAdapterConfig = StorageAdapterConfig> {
  new (config?: Config): AsyncStorageAdapter<Config>;
}

// ABSTRACT CLASSES
/**
 * Abstract base class for storage adapters, defines the interface and common functionality.
 * @typeParam Config Configuration object type for the adapter.
 */
export abstract class BaseStorageAdapter<Config extends StorageAdapterConfig = StorageAdapterConfig> {
  public readonly name: string = "StorageAdapter";
  public config: Config;
  protected warn = (act = "", mssg = "Support issue or Private Mode", key = "", store = "") => this.config.debug && console.warn(`[${this.constructor.name} \`${act}\`] Failed${key ? `for ${key}` : ""} ${store ? ` on "${store}"` : ""} ${(this.config as any).dbName ? ` at ${(this.config as any).dbName}` : ""} (${mssg})`);
  constructor(config?: Config) {
    this.config = { debug: false, ...config } as Config;
  }
}
/**
 * Abstract base class for storage adapters, defines the interface and common functionality.
 * Extend this class to implement specific synchronous storage mechanisms (e.g., LocalStorage).
 * @typeParam Config Configuration object type for the adapter.
 */
export abstract class StorageAdapter<Config extends StorageAdapterConfig = StorageAdapterConfig> extends BaseStorageAdapter<Config> {
  public readonly name: string = "SyncStorageAdapter";
  public abstract get(key: string): any;
  public abstract set(key: string, value: any): boolean;
  public abstract remove(key: string): boolean;
  public abstract clear(): boolean;
}
/**
 * Abstract base class for asynchronous storage adapters, defines the interface and common functionality.
 * Extend this class to implement specific asynchronous storage mechanisms (e.g., IndexedDB).
 * @typeParam Config Configuration object type for the adapter.
 */
export abstract class AsyncStorageAdapter<Config extends StorageAdapterConfig = StorageAdapterConfig> extends BaseStorageAdapter<Config> {
  public readonly name: string = "AsyncStorageAdapter";
  public abstract get(key: string): Promise<any>;
  public abstract set(key: string, value: any): Promise<boolean>;
  public abstract remove(key: string): Promise<boolean>;
  public abstract clear(): Promise<boolean>;
}

// MAIN CLASSES
/**
 * - The LocalStorage Adapter (~5MB per origin, browser-dependent).
 * - Provides aN implementation of the `StorageAdapter` interface using the browser's `localStorage`.
 * Handles JSON serialization and deserialization, and includes error handling for unsupported environments.
 */
export class LocalStorageAdapter extends StorageAdapter {
  public readonly name: string = "LocalStorage";
  /**
   * Reads and parses a value from localStorage.
   * @param key Storage key.
   * @returns Parsed value, or `undefined` when missing/unreadable.
   */
  public override get(key: string, reviver = this.config.reviver) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v, reviver) : undefined;
    } catch {
      return undefined;
    }
  }
  /**
   * Serializes and writes a value to localStorage.
   * @param key Storage key.
   * @param value Value to serialize.
   * @returns `true` when write succeeds, else `false`.
   */
  public override set(key: string, value: any, replacer = this.config.replacer) {
    try {
      return localStorage.setItem(key, JSON.stringify(value, replacer as any)), true;
    } catch (e) {
      return this.warn("setItem", undefined, key), false;
    }
  }
  /**
   * Removes a single key from localStorage.
   * @param key Storage key.
   * @returns `true` when removal succeeds, else `false`.
   */
  public override remove(key: string) {
    try {
      return localStorage.removeItem(key), true;
    } catch (e) {
      return this.warn("removeItem", undefined, key), false;
    }
  }
  /**
   * Clears all localStorage entries for the current origin.
   * @returns `true` when clear succeeds, else `false`.
   */
  public override clear() {
    try {
      return localStorage.clear(), true; // Warning: This wipes the ENTIRE domain's LocalStorage
    } catch (e) {
      return this.warn("clear", undefined), false;
    }
  }
}
/**
 * - The SessionStorage Adapter (~5MB per origin per tab, browser-dependent).
 * - Provides an implementation of the `StorageAdapter` interface using the browser's `sessionStorage`.
 * Handles JSON serialization and deserialization, and includes error handling for unsupported environments.
 */
export class SessionStorageAdapter extends StorageAdapter {
  public readonly name: string = "SessionStorage";
  /**
   * Reads and parses a value from sessionStorage.
   * @param key Storage key.
   * @returns Parsed value, or `undefined` when missing/unreadable.
   */
  public override get(key: string, reviver = this.config.reviver) {
    try {
      const v = sessionStorage.getItem(key);
      return v ? JSON.parse(v, reviver) : undefined;
    } catch {
      return undefined;
    }
  }
  /**
   * Serializes and writes a value to sessionStorage.
   * @param key Storage key.
   * @param value Value to serialize.
   * @returns `true` when write succeeds, else `false`.
   */
  public override set(key: string, value: any, replacer = this.config.replacer) {
    try {
      return sessionStorage.setItem(key, JSON.stringify(value, replacer as any)), true;
    } catch (e) {
      return this.warn("setItem", undefined, key), false;
    }
  }
  /**
   * Removes a single key from sessionStorage.
   * @param key Storage key.
   * @returns `true` when removal succeeds, else `false`.
   */
  public override remove(key: string) {
    try {
      return sessionStorage.removeItem(key), true;
    } catch (e) {
      return this.warn("removeItem", undefined, key), false;
    }
  }
  /**
   * Clears all sessionStorage entries for the current tab session.
   * @returns `true` when clear succeeds, else `false`.
   */
  public override clear() {
    try {
      return sessionStorage.clear(), true;
    } catch (e) {
      return this.warn("clear", undefined), false;
    }
  }
}
/**
 * - The Memory Storage Adapter (RAM-bound; no fixed browser quota).
 * - Provides an implementation of the `StorageAdapter` interface using an in-memory `Map`.
 * Useful for testing or non-persistent storage needs, mimics the API and behavior of LocalStorage.
 */
export class MemoryAdapter extends StorageAdapter<MemoryAdapterConfig> {
  public readonly name: string = "Memory";
  constructor(build?: Partial<MemoryAdapterConfig>) {
    super({ store: new Map(), ...build } as MemoryAdapterConfig);
  }
  /**
   * Reads and parses a value from memory storage.
   * @param key Storage key.
   * @returns Parsed value, or `undefined` when missing/unreadable.
   */
  public override get(key: string, reviver = this.config.reviver) {
    try {
      const v = this.config.store.get(key);
      return v ? JSON.parse(v, reviver) : undefined;
    } catch {
      return undefined;
    }
  }
  /**
   * Serializes and writes a value to memory storage.
   * @param key Storage key.
   * @param value Value to serialize.
   * @returns `true` when write succeeds, else `false`.
   */
  public override set(key: string, value: any, replacer = this.config.replacer) {
    try {
      return this.config.store.set(key, JSON.stringify(value, replacer as any)), true;
    } catch (e) {
      return this.warn("set", undefined, key), false;
    }
  }
  /**
   * Removes a single key from memory storage.
   * @param key Storage key.
   * @returns `true` when removal succeeds, else `false`.
   */
  public override remove(key: string) {
    try {
      return this.config.store.delete(key), true;
    } catch (e) {
      return this.warn("remove", undefined, key), false;
    }
  }
  /**
   * Clears all entries from memory storage.
   * @returns `true` when clear succeeds, else `false`.
   */
  public override clear() {
    try {
      return this.config.store.clear(), true;
    } catch (e) {
      return this.warn("clear", undefined), false;
    }
  }
}
/**
 * - The Cookie Storage Adapter (~4KB per cookie; practical total payload budget often ~30KB).
 * - Provides an implementation of the `StorageAdapter` interface using `document.cookie`.
 * Handles JSON serialization/deserialization and URL-safe key/value encoding.
 */
export class CookieAdapter extends StorageAdapter<CookieAdapterConfig> {
  public readonly name: string = "Cookie";
  protected deets = (opts: Partial<CookieOptions> = NIL, _d = opts.domain ?? this.config.domain, _m = opts.maxAge ?? this.config.maxAge, _e = opts.expires ?? this.config.expires) => `Path=${opts.path ?? this.config.path}; SameSite=${opts.sameSite ?? this.config.sameSite}${_d ? `; Domain=${_d}` : ""}${opts.secure ?? this.config.secure ? "; Secure" : ""}${_m !== undefined ? `; Max-Age=${_m}` : ""}${_e !== undefined ? `; Expires=${_e instanceof Date ? _e.toUTCString() : _e}` : ""}`;
  constructor(build?: Partial<CookieAdapterConfig>) {
    super({ secure: "undefined" !== typeof window && location.protocol === "https:", ...COOKIE_ADAPTER_BUILD, ...build } as CookieAdapterConfig);
  }
  /**
   * Reads and parses a cookie visible to the current page scope.
   * @param key Cookie key.
   * @returns Parsed value, or `undefined` when missing/unreadable.
   */
  public override get(key: string, reviver = this.config.reviver) {
    try {
      const k = encodeURIComponent(key) + "=";
      for (const pair of document.cookie ? document.cookie.split("; ") : []) {
        if (!pair.startsWith(k)) continue;
        return JSON.parse(decodeURIComponent(pair.slice(k.length)), reviver);
      }
      return undefined;
    } catch {
      return undefined;
    }
  }
  /**
   * Writes a cookie with optional per-call scope/lifetime overrides.
   * @param key Cookie key.
   * @param value Value to serialize.
   * @param opts Optional per-call cookie options.
   * @returns `true` when write succeeds, else `false`.
   */
  public override set(key: string, value: any, opts?: Partial<CookieOptions>, replacer = this.config.replacer) {
    try {
      return (document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(JSON.stringify(value, replacer as any))}; ${this.deets(opts)}`), true;
    } catch {
      return this.warn("set", undefined, key), false;
    }
  }
  /**
   * Removes a cookie key using matching scope attributes.
   * @param key Cookie key.
   * @param opts Optional per-call scope overrides.
   * @returns `true` when removal succeeds, else `false`.
   */
  public override remove(key: string, opts?: Partial<CookieOptions>) {
    try {
      return (document.cookie = `${encodeURIComponent(key)}=; ${this.deets({ ...opts, maxAge: 0, expires: new Date(0) })}`), true; // standard deletion technique
    } catch {
      return this.warn("remove", undefined, key), false;
    }
  }
  /**
   * Attempts to remove all visible cookie keys for the given scope.
   * @param opts Optional per-call scope overrides.
   * @returns `true` when clear succeeds, else `false`.
   */
  public override clear(opts?: Partial<CookieOptions>) {
    try {
      for (const pair of document.cookie ? document.cookie.split("; ") : []) {
        const idx = pair.indexOf("=");
        document.cookie = `${idx === -1 ? pair : pair.slice(0, idx)}=; ${this.deets({ ...opts, maxAge: 0, expires: new Date(0) })}`; // standard deletion technique
      }
      return true;
    } catch {
      return this.warn("clear"), false;
    }
  }
}
/**
 * - The IndexedDB Adapter (quota-managed; typically tens of MB to GB).
 * - Provides an implementation of the `AsyncStorageAdapter` interface using the IndexedDB database.
 * Handles database connection management, object store setup, and includes error handling for unsupported environments and common issues, requires snapshots(non-proxies) for persistence.
 */
export class IndexedDBAdapter extends AsyncStorageAdapter<IndexedDBAdapterConfig> {
  public readonly name: string = "IndexedDB";
  protected db?: IDBDatabase;
  constructor(build?: Partial<IndexedDBAdapterConfig>) {
    super({ ...INDEXED_DB_ADAPTER_BUILD, ...build } as IndexedDBAdapterConfig);
  }
  /**
   * Returns a connected IndexedDB instance, opening it when needed.
   * @returns Connected database handle.
   */
  public async idb(): Promise<IDBDatabase> {
    const idb = this.config.onidb();
    if (idb || this.db) return Promise.resolve(idb || this.db);
    return new Promise((res, rej) => {
      const req = indexedDB.open(this.config.dbName, this.config.version);
      req.onupgradeneeded = (e) => (this.config.onupgradeneeded(req.result, e), this.config.stores.forEach((s) => !req.result.objectStoreNames.contains(s) && req.result.createObjectStore(s)));
      req.onsuccess = (e) => (this.config.onsuccess(req.result, e), (req.result.onversionchange = (e) => (this.config.onversionchange(req.result, e), this.warn("update", "Updated in another tab"), req.result.close())), res((this.db = req.result)));
      req.onerror = (e) => (this.config.onerror(req.error, e), this.warn("open", "Something went wrong"), rej(req.error));
      req.onblocked = (e) => (this.config.onblocked(e), this.warn("open", "Close other tabs for updates"));
    });
  }
  /**
   * Reads a value by key from an object store.
   * @param key Record key.
   * @param store Optional object-store override.
   * @returns Stored value, or `undefined` when missing/unreadable.
   */
  public override async get(key: string, store = this.config.stores[0], options: Partial<IDBTransactionOptions> = this.config): Promise<any> {
    try {
      const req = (await this.idb()).transaction(store, "readonly", options).objectStore(store).get(key);
      return new Promise((res) => (req.onsuccess = () => res(req.result)));
    } catch {
      return this.warn("get", undefined, store), undefined;
    }
  }
  /**
   * Writes a value by key into an object store.
   * @param key Record key.
   * @param value Value to store.
   * @param store Optional object-store override.
   * @returns `true` when write succeeds, else `false`.
   */
  public override async set(key: string, value: any, store = this.config.stores[0], options: Partial<IDBTransactionOptions> = this.config): Promise<boolean> {
    try {
      const req = (await this.idb()).transaction(store, "readwrite", options).objectStore(store).put(value, key);
      return new Promise((res) => (req.onsuccess = () => res(true)));
    } catch (e) {
      return this.warn("put", undefined, store), false;
    }
  }
  /**
   * Deletes a value by key from an object store.
   * @param key Record key.
   * @param store Optional object-store override.
   * @returns `true` when delete succeeds, else `false`.
   */
  public override async remove(key: string, store = this.config.stores[0], options: Partial<IDBTransactionOptions> = this.config): Promise<boolean> {
    try {
      const req = (await this.idb()).transaction(store, "readwrite", options).objectStore(store).delete(key);
      return new Promise((res) => (req.onsuccess = () => res(true)));
    } catch (e) {
      return this.warn("delete", undefined, store), false;
    }
  }
  /**
   * Clears one or more object stores.
   * @param stores Store name or list of store names to clear.
   * @returns `true` when all clears succeed, else `false`.
   */
  public override async clear(stores: string | string[] = this.config.stores, options: Partial<IDBTransactionOptions> = this.config): Promise<boolean> {
    let success = true;
    for (const store of Array.isArray(stores) ? stores : [stores])
      try {
        const req = (await this.idb()).transaction(store, "readwrite", options).objectStore(store).clear();
        await new Promise((res) => (req.onsuccess = () => res(true)));
      } catch (e) {
        this.warn("clear", undefined, store), (success = false);
      }
    return success;
  }
}

// BUILDS
export const COOKIE_ADAPTER_BUILD: Partial<CookieAdapterConfig> = { path: "/", sameSite: "Lax", domain: undefined, debug: false };
export const INDEXED_DB_ADAPTER_BUILD: Partial<IndexedDBAdapterConfig> = { dbName: "REACTOR_IDB", stores: ["VAULT"], version: 1, onidb: NOOP, onupgradeneeded: NOOP, onversionchange: NOOP, onsuccess: NOOP, onerror: NOOP, onblocked: NOOP };
