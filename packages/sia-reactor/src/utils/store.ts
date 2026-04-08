import { NOOP } from "../core/consts";

// DEFINITION INTERFACES
export interface StorageAdapterConfig {
  debug: boolean;
}
export interface MemoryStorageAdapterConfig extends StorageAdapterConfig {
  /** stored as strings to mimic local constraints */
  store: Map<string, string>;
}
export interface IndexedDBAdapterConfig extends StorageAdapterConfig {
  dbName: string;
  version: number;
  /** First store is default during operations if none provided */
  stores: string[];
  /** return a preffered instance or `throw` to prevent accessing the database */
  onidb: () => any;
  onupgradeneeded: (database: IDBDatabase, event: IDBVersionChangeEvent) => void;
  onversionchange: (database: IDBDatabase, event: IDBVersionChangeEvent) => void;
  onsuccess: (database: IDBDatabase, event: Event) => void;
  onerror: (error: DOMException | null, event: Event) => any;
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
export abstract class BaseStorageAdapter<Config extends StorageAdapterConfig = StorageAdapterConfig> {
  public static name: string;
  public config: Config;
  protected warn = (act = "", mssg = "Support issue or Private Mode", key = "", store = "") => this.config.debug && console.warn(`[${this.constructor.name} \`${act}\`] Failed${key ? `for ${key}` : ""} ${store ? ` on "${store}"` : ""} ${(this.config as any).dbName ? ` at ${(this.config as any).dbName}` : ""} (${mssg})`);
  constructor(config?: Config) {
    this.config = { debug: false, ...config } as Config;
  }
}
export abstract class StorageAdapter<Config extends StorageAdapterConfig = StorageAdapterConfig> extends BaseStorageAdapter<Config> {
  public abstract get(key: string): any;
  public abstract set(key: string, value: any): boolean;
  public abstract remove(key: string): boolean;
  public abstract clear(): boolean;
}
export abstract class AsyncStorageAdapter<Config extends StorageAdapterConfig = StorageAdapterConfig> extends BaseStorageAdapter<Config> {
  public abstract get(key: string): Promise<any>;
  public abstract set(key: string, value: any): Promise<boolean>;
  public abstract remove(key: string): Promise<boolean>;
  public abstract clear(): Promise<boolean>;
}

// MAIN CLASSES
export class LocalStorageAdapter extends StorageAdapter {
  public static name = "LocalStorage";
  public override get(key: string) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : undefined;
    } catch {
      return undefined;
    }
  }
  public override set(key: string, value: any) {
    try {
      return localStorage.setItem(key, JSON.stringify(value)), true;
    } catch (e) {
      return this.warn("setItem", undefined, key), false;
    }
  }
  public override remove(key: string) {
    try {
      return localStorage.removeItem(key), true;
    } catch (e) {
      return this.warn("removeItem", undefined, key), false;
    }
  }
  public override clear() {
    try {
      return localStorage.clear(), true; // Warning: This wipes the ENTIRE domain's LocalStorage
    } catch (e) {
      return this.warn("clear", undefined), false;
    }
  }
}
export class SessionStorageAdapter extends StorageAdapter {
  public override get(key: string) {
    try {
      const v = sessionStorage.getItem(key);
      return v ? JSON.parse(v) : undefined;
    } catch {
      return undefined;
    }
  }
  public override set(key: string, value: any) {
    try {
      return sessionStorage.setItem(key, JSON.stringify(value)), true;
    } catch (e) {
      return this.warn("setItem", undefined, key), false;
    }
  }
  public override remove(key: string) {
    try {
      return sessionStorage.removeItem(key), true;
    } catch (e) {
      return this.warn("removeItem", undefined, key), false;
    }
  }
  public override clear() {
    try {
      return sessionStorage.clear(), true;
    } catch (e) {
      return this.warn("clear", undefined), false;
    }
  }
}
export class MemoryStorageAdapter extends StorageAdapter<MemoryStorageAdapterConfig> {
  constructor(build?: { store?: Map<string, string> }) {
    super({ store: new Map(), ...build } as MemoryStorageAdapterConfig);
  }
  public override get(key: string) {
    try {
      const v = this.config.store.get(key);
      return v ? JSON.parse(v) : undefined;
    } catch {
      return undefined;
    }
  }
  public override set(key: string, value: any) {
    try {
      return this.config.store.set(key, JSON.stringify(value)), true;
    } catch (e) {
      return this.warn("set", undefined, key), false;
    }
  }
  public override remove(key: string) {
    try {
      return this.config.store.delete(key), true;
    } catch (e) {
      return this.warn("remove", undefined, key), false;
    }
  }
  public override clear() {
    try {
      return this.config.store.clear(), true;
    } catch (e) {
      return this.warn("clear", undefined), false;
    }
  }
}
export class IndexedDBAdapter extends AsyncStorageAdapter<IndexedDBAdapterConfig> {
  protected db?: IDBDatabase;
  protected warn = (act = "", mssg = "Support issue or Private Mode", store = "", key = "") => console.warn(`[IndexedDB \`${act}\`] Failed${store ? ` for ${key} on "${store}"` : ""} at ${this.config.dbName} (${mssg})`);
  constructor(build?: Partial<IndexedDBAdapterConfig>) {
    super({ ...INDEXED_DB_ADAPTER_BUILD, ...build } as IndexedDBAdapterConfig);
  }
  public async idb(): Promise<IDBDatabase> {
    const idb = this.config.onidb();
    if (idb || this.db) return Promise.resolve(idb || this.db);
    return new Promise((res, rej) => {
      const req = indexedDB.open(this.config.dbName, this.config.version);
      req.onupgradeneeded = (e) => (this.config.onupgradeneeded(req.result, e), this.config.stores.forEach((s) => !req.result.objectStoreNames.contains(s) && req.result.createObjectStore(s)));
      req.onsuccess = (e) => (this.config.onsuccess(req.result, e), (req.result.onversionchange = (e) => (this.warn("update", "Updated in another tab"), this.config.onversionchange(req.result, e), req.result.close())), res((this.db = req.result)));
      req.onerror = (e) => (this.config.onerror(req.error, e), this.warn("open", "Something went wrong"), rej(req.error));
      req.onblocked = (e) => (this.config.onblocked(e), this.warn("open", "Close other tabs for updates"));
    });
  }
  public override async get(key: string, store = this.config.stores[0]): Promise<any> {
    try {
      const req = (await this.idb()).transaction(store).objectStore(store).get(key);
      return new Promise((res) => (req.onsuccess = () => res(req.result)));
    } catch {
      return this.warn("get", undefined, store), undefined;
    }
  }
  public override async set(key: string, value: any, store = this.config.stores[0]): Promise<boolean> {
    try {
      const req = (await this.idb()).transaction(store, "readwrite").objectStore(store).put(value, key);
      return new Promise((res) => (req.onsuccess = () => res(true)));
    } catch (e) {
      return this.warn("put", undefined, store), false;
    }
  }
  public override async remove(key: string, store = this.config.stores[0]): Promise<boolean> {
    try {
      const req = (await this.idb()).transaction(store, "readwrite").objectStore(store).delete(key);
      return new Promise((res) => (req.onsuccess = () => res(true)));
    } catch (e) {
      return this.warn("delete", undefined, store), false;
    }
  }
  public override async clear(stores: string | string[] = this.config.stores): Promise<boolean> {
    let success = true;
    for (const store of Array.isArray(stores) ? stores : [stores])
      try {
        const req = (await this.idb()).transaction(store, "readwrite").objectStore(store).clear();
        await new Promise((res) => (req.onsuccess = () => res(true)));
      } catch (e) {
        this.warn("clear", undefined, store), (success = false);
      }
    return success;
  }
}

// BUILDS
export const INDEXED_DB_ADAPTER_BUILD: Partial<IndexedDBAdapterConfig> = { dbName: "REACTOR_IDB", stores: ["VAULT"], version: 1, onidb: NOOP, onupgradeneeded: NOOP, onversionchange: NOOP, onsuccess: NOOP, onerror: NOOP, onblocked: NOOP };
