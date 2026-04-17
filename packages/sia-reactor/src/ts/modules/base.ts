import type { Reactor } from "../core/reactor";
import { getReactor, type Reactive, reactive } from "../core/mixins";
import { isObj } from "../utils/obj";
import { guardMethod, guardAllMethods } from "../utils/methd";

export type ReactorModuleId = string | number;
export const wpArr = ["*"] as any;

export interface ReactorModuleConstructor<P extends BaseReactorModule = BaseReactorModule, T extends object = any> {
  new (rtr: Reactor<T>, config: any): P;
  moduleName: string;
}

/**
 * Base class, extend to create custom reactor modules that can be used with a `Reactor` instance
 * Provides common functionalities like multi-reactor management, configuration handling, and error logging.
 * @typeParam T Root state object type of the reactors this module will manage.
 * @typeParam Config Configuration object type for the module.
 * @typeParam State Optional local state object type for the module.
 */
export abstract class BaseReactorModule<T extends object = any, Config = any, State = any> {
  public static readonly moduleName: string;
  public get name() {
    return (this.constructor as ReactorModuleConstructor).moduleName;
  }
  protected ac = new AbortController();
  protected readonly signal = this.ac.signal;
  protected rtrs = new Map<ReactorModuleId, Reactor<any>>();
  protected rids = new WeakMap<Reactor<any>, ReactorModuleId>(); // for quick 0(1) lookups over iteration
  protected wired = false;
  /** The reactive configuration object for the module, manipulate to change behaviour. */
  public config!: Config extends object ? Reactive<Config> : Config;
  /** The reactive state object for the module, watch to see exposed lifecycle changes. */
  public readonly state!: State extends object ? Reactive<State> : State;

  constructor(config?: Config, rtr?: Reactor<T>, state?: State) {
    guardAllMethods(this, this.guard); // Modules can sacrifice memory footprint for error proofing and events devx
    this.config = (isObj(config) ? reactive(config) : config) as BaseReactorModule["config"];
    this.state = (isObj(state) ? reactive(state) : state) as BaseReactorModule["state"];
    rtr && this.attach(rtr); // User don't have to pass rtr at instantion except config options need type inference from `T`
  }

  /**
   * Connect to a `Reactor` instance, allows managing multiple reactors if needed.
   * @param target `Reactor` instance or `reactive()` object to connect to.
   * @param id Optional custom id for the reactor, prefer over default implicit index id when managing multiple reactors, supports paths to merge into a single tree.
   * @returns Current `ReactorModule` instance for fluent chaining.
   * @example
   * const mod = new MyModule().attach(state1).attach(state2); // implicit index-based ids by default, add a .setup() or `Reactor.use()` when ready for init.
   * @example
   * const persist = new PersistModule(config).attach(sessState, "session").attach(adminState, "session.admin"); // don't use "*", causes de-serialization issues.
   */
  public attach(target?: Reactor<any> | Reactive<any>, id: ReactorModuleId = this.rtrs.size) {
    const rtr = getReactor(target);
    if (!rtr || this.rtrs.has(id)) return this;
    return this.rids.set((this.rtrs.set(id, rtr), rtr), id), this.onAttach(rtr, id), this;
  }
  protected onAttach(_rtr: Reactor<any>, _rid?: ReactorModuleId): void {}

  /**
   * Entry point called to initialize module wiring, calls `.attach(target, id)` first, `Reactor.use()` calls this internally.
   * Should run as last in `.attach()` chain or after all desired reactors if using multiple; so wiring is done safely after.
   * @param target `Reactor` instance or `reactive()` object to connect to.
   * @param id Optional id for the reactor, prefer over default implicit index id when managing multiple reactors.
   * @returns Current `ReactorModule` instance for fluent chaining.
   * @example
   * const mod = new MyModule().attach(state1).setup(state2); // if using multiple, this should run last; with same params as `.attach()` for a shorter chain
   */
  public setup(target?: Reactor<any> | Reactive<any>, id?: ReactorModuleId): this {
    return this.attach(target, id), !this.wired && (this.wire(), (this.wired = true)), this;
  }
  /** set up listeners/subscriptions and module runtime wiring. */
  public abstract wire(): void;

  public destroy() {
    this.ac.abort();
    this.onDestroy?.();
  }
  protected onDestroy?(): void;

  /**
   * Wraps a function with module-scoped error logging.
   * Use this when creating functions dynamically (for example, before attaching an anonymous listener on the fly).
   * @example
   * window.addEventListener("resize", this.guard(() => this.syncLayout(true)), { signal: this.signal });
   */
  public guard = <Fn extends Function>(fn: Fn) => {
    return guardMethod(fn, (e) => this.rtrs.values().next().value?.log(`[Reactor "${this.name}" Module] Error: ${e}`)); // treated as seperate log identities
  }; // `()=>{}`: needs to be bounded even before initialization
}
