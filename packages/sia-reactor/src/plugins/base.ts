import type { Reactor } from "../core/reactor";
import { type Reactive, reactive } from "../core/mixins";
import { isObj } from "../utils/obj";
import { guardMethod, guardAllMethods } from "../utils/methd";

export interface ReactorPluginConstructor<P extends BaseReactorPlugin = BaseReactorPlugin, T extends object = any> {
  new (rtr: Reactor<T>, config: any): P;
  plugName: string;
}

export abstract class BaseReactorPlugin<T extends object = any, Config = any, State = any> {
  public static readonly plugName: string;
  public get name() {
    return (this.constructor as ReactorPluginConstructor).plugName;
  }
  protected ac = new AbortController();
  public readonly signal = this.ac.signal;
  public rtr!: Reactor<T>;
  public config!: Config extends object ? Reactive<Config> : Config;
  public state!: State extends object ? Reactive<State> : State;

  constructor(config?: Config, rtr?: Reactor<T>, state?: State) {
    guardAllMethods(this, this.guard); // Plugs can sacrifice memory footprint for error proofing and events devx
    this.rtr = rtr!; // User don't have to pass rtr at instantion except config options need type inference from `T`
    this.config = (isObj(config) ? reactive(config) : config) as BaseReactorPlugin["config"];
    this.state = (isObj(state) ? reactive(state) : state) as BaseReactorPlugin["state"];
  }

  /** Entry point called to initialize plugin wiring. */
  public setup(rtr?: Reactor<T>) {
    this.rtr ??= rtr!;
    this.wire();
  }

  /** set up listeners/subscriptions and plugin runtime wiring. */
  public abstract wire(): void;

  public destroy() {
    this.ac.abort();
    this.onDestroy?.();
  }
  protected onDestroy?(): void;

  /**
   * Wraps a function with plugin-scoped error logging.
   * Use this when creating functions dynamically (for example, before attaching an anonymous listener on the fly).
   * @example
   * window.addEventListener("resize", this.guard(() => this.syncLayout(true)), { signal: this.signal });
   */
  public guard = <Fn extends Function>(fn: Fn) => {
    return guardMethod(fn, (e) => this.rtr.log(`[Reactor "${this.name}" Plug] Error: ${e}`)); // treated as seperate log identities
  }; // `()=>{}`: needs to be bounded even before initialization
}
