import { useEffect, useRef } from "react";
import { reactive } from "../../src/ts/core/mixins";
import { effect } from "../../src/ts/adapters/vanilla";
import { useAnyReactor, useAnySelector, useReactorSnapshot, useReactor, useSelector, useSelectorSnapshot, usePath, TimeTravelOverlay } from "../../src/ts/adapters/react";
import { IndexedDBAdapter, PersistModule, TimeTravelModule } from "../../src/ts/modules";
import "../../src/css/time-travel-overlay.css";

const time = new TimeTravelModule(),
  persist = new PersistModule({ key: "SIA_DEMO", adapter: IndexedDBAdapter, useSnapshot: true }).attach(time.state, "timeTravel"),
  state = reactive({ count: 0 }),
  increment = () => (state.count += 1),
  decrement = () => (state.count -= 1),
  reset = () => (state.count = 0);
// Module setup
state.use(persist, "app"), persist.state.once("hydrated", () => state.use(time));

function CounterCard({ label, count, renders }: { label: string; count: number; renders: number }) {
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

function ReactorCounter() {
  const s = useReactor(state),
    renders = useRef(0);
  return <CounterCard label="useReactor" count={s.count} renders={++renders.current} />;
}
function AnyReactorCounter() {
  useAnyReactor();
  const renders = useRef(0);
  return <CounterCard label="useAnyReactor" count={state.count} renders={++renders.current} />;
}
function ReactorSnapshotCounter() {
  const s = useReactorSnapshot(state),
    renders = useRef(0);
  return <CounterCard label="useReactorSnapshot" count={s.count} renders={++renders.current} />;
}
function SelectorCounter() {
  const count = useSelector(state, (s) => s.count),
    renders = useRef(0);
  return <CounterCard label="useSelector" count={count} renders={++renders.current} />;
}
function AnySelectorCounter() {
  const count = useAnySelector(() => state.count),
    renders = useRef(0);
  return <CounterCard label="useAnySelector" count={count} renders={++renders.current} />;
}
function SelectorSnapshotCounter() {
  const count = useSelectorSnapshot(state, (s) => s.count),
    renders = useRef(0);
  return <CounterCard label="useSelectorSnapshot" count={count} renders={++renders.current} />;
}
function PathCounter() {
  const count = usePath(state, "count"),
    renders = useRef(0);
  return <CounterCard label="usePath" count={count} renders={++renders.current} />;
}
function VanillaEffectPanel() {
  const valRef = useRef<HTMLDivElement | null>(null),
    runsRef = useRef<HTMLDivElement | null>(null);
  useEffect((runs = 0) => effect(() => (valRef.current && (valRef.current.textContent = String(state.count)), runsRef.current && (runsRef.current.textContent = String(++runs)))), []);
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
            <ReactorCounter />
            <AnyReactorCounter />
            <ReactorSnapshotCounter />
            <SelectorCounter />
            <AnySelectorCounter />
            <SelectorSnapshotCounter />
            <PathCounter />
          </div>
        </section>
        <VanillaEffectPanel />
      </div>
      <TimeTravelOverlay time={time} color="#43d2ff" startOpen={true} />
    </div>
  );
}
