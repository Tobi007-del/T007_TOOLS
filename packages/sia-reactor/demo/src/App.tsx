import { useEffect, useRef } from "react";
import { reactive } from "../../src/ts/core/mixins";
import { effect } from "../../src/ts/adapters/vanilla";
import { useAnyReactor, useAnySelector, usePath, useReactor, useSelector, TimeTravelOverlay } from "../../src/ts/adapters/react";
import { PersistPlugin, TimeTravelPlugin } from "../../src/ts/plugins";
import "../../src/css/time-travel-overlay.css";

const state = reactive({ count: 0 });
const time = new TimeTravelPlugin();
time.state.plugIn(new PersistPlugin({ key: "SIA_DEMO_TIMETRAVEL", throttle: 150 }));
state.plugIn(new PersistPlugin({ key: "SIA_DEMO_STATE", throttle: 150 })).plugIn(time);

const increment = () => (state.count += 1);
const decrement = () => (state.count -= 1);
const reset = () => (state.count = 0);

type CounterCardProps = {
  label: string;
  count: number;
  renders: number;
};

function CounterCard({ label, count, renders }: CounterCardProps) {
  return (
    <section className="card">
      <div className="title">{label}</div>
      <div className="count">{count}</div>
      <div className="row">
        <button onClick={decrement}>-1</button>
        <button onClick={increment}>+1</button>
      </div>
      <div className="muted">renders: {renders}</div>
    </section>
  );
}

function UseReactorCounter() {
  const s = useReactor(state),
    renders = useRef(0);
  return <CounterCard label="useReactor" count={s.count} renders={++renders.current} />;
}

function UseAnyReactorCounter() {
  useAnyReactor();
  const renders = useRef(0);
  return <CounterCard label="useAnyReactor" count={state.count} renders={++renders.current} />;
}

function UseSelectorCounter() {
  const count = useSelector(state, (s) => s.count),
    renders = useRef(0);
  return <CounterCard label="useSelector" count={count} renders={++renders.current} />;
}

function UseAnySelectorCounter() {
  const count = useAnySelector(() => state.count),
    renders = useRef(0);
  return <CounterCard label="useAnySelector" count={count} renders={++renders.current} />;
}

function UsePathCounter() {
  const count = usePath(state, "count"),
    renders = useRef(0);
  return <CounterCard label="usePath" count={count} renders={++renders.current} />;
}

function VanillaEffectPanel() {
  const valRef = useRef<HTMLDivElement | null>(null),
    runsRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    let runs = 0;
    return effect(() => (valRef.current && (valRef.current.textContent = String(state.count)), runsRef.current && (runsRef.current.textContent = String(++runs))));
  }, []);
  return (
    <section className="panel">
      <h2>Vanilla JS Effect</h2>
      <p className="meta">Live side-by-side subscription using the vanilla adapter.</p>
      <div className="card">
        <div className="title">effect(() =&gt; ...)</div>
        <div className="count" ref={valRef}>
          {state.count}
        </div>
        <div className="muted">
          effect runs: <span ref={runsRef}>0</span>
        </div>
      </div>
    </section>
  );
}

export function App() {
  return (
    <div className="wrap">
      <h1>SIA Reactor: Same Counter Through 5 Hooks</h1>
      <p className="meta">All cards bind to the same state.count. Interact with any card or global controls.</p>
      <div className="toolbar">
        <button onClick={decrement}>Global -1</button>
        <button onClick={increment}>Global +1</button>
        <button onClick={reset}>Reset</button>
      </div>
      <div className="layout">
        <section className="panel">
          <h2>React Hook Counters</h2>
          <div className="grid">
            <UseReactorCounter />
            <UseAnyReactorCounter />
            <UseSelectorCounter />
            <UseAnySelectorCounter />
            <UsePathCounter />
          </div>
        </section>
        <VanillaEffectPanel />
      </div>
      <TimeTravelOverlay time={time} color="#43d2ff" startOpen={true} />
    </div>
  );
}
