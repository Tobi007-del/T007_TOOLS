import { useEffect, useRef, useState } from "react";
import { reactive } from "../../src/core/mixins";
import { effect } from "../../src/adapters/vanilla";
import { useAnyReactor, useAnySelector, usePath, useReactor, useSelector } from "../../src/adapters/react";
import { PersistPlugin, TimeTravelPlugin } from "../../src/plugins";
import { formatKeyForDisplay, keyEventAllowed, parseForARIAKS, type keysSettings } from "../../src/utils";

const state = reactive({ count: 0 });
const timeTravel = new TimeTravelPlugin();
const persist = new PersistPlugin({ key: "SIA_DEMO_STATE", throttle: 150 });
const ttPersist = new PersistPlugin({ key: "SIA_DEMO_TIMETRAVEL", throttle: 150 });
timeTravel.state.__Reactor__.plugIn(ttPersist);
state.__Reactor__.plugIn(persist).plugIn(timeTravel);

const demoKeys: keysSettings = {
  overrides: ["Ctrl+z", "Cmd+z", "Ctrl+y", "Cmd+y", "Ctrl+Shift+z", "Cmd+Shift+z", "Ctrl+g", "Cmd+g", ",", ".", "ArrowLeft", "ArrowRight", "Space", "Alt+Space"],
  shortcuts: { undo: ["Ctrl+z", "Cmd+z"], redo: ["Ctrl+y", "Cmd+y", "Ctrl+Shift+z", "Cmd+Shift+z"], genesis: ["Ctrl+g", "Cmd+g"], prevFrame: ",", nextFrame: ".", skipBwd: "ArrowLeft", skipFwd: "ArrowRight", playPause: "Space", rewind: "Alt+Space" },
};

function increment() {
  state.count += 1;
}
function decrement() {
  state.count -= 1;
}
function reset() {
  state.count = 0;
}

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
  const s = useReactor(state);
  const renders = useRef(0);
  renders.current += 1;

  return <CounterCard label="useReactor" count={s.count} renders={renders.current} />;
}

function UseAnyReactorCounter() {
  useAnyReactor();
  const renders = useRef(0);
  renders.current += 1;

  return <CounterCard label="useAnyReactor" count={state.count} renders={renders.current} />;
}

function UseSelectorCounter() {
  const count = useSelector(state, (s) => s.count);
  const renders = useRef(0);
  renders.current += 1;

  return <CounterCard label="useSelector" count={count} renders={renders.current} />;
}

function UseAnySelectorCounter() {
  const count = useAnySelector(() => state.count);
  const renders = useRef(0);
  renders.current += 1;

  return <CounterCard label="useAnySelector" count={count} renders={renders.current} />;
}

function UsePathCounter() {
  const count = usePath(state, "count");
  const renders = useRef(0);
  renders.current += 1;

  return <CounterCard label="usePath" count={count} renders={renders.current} />;
}

function VanillaEffectPanel() {
  const valRef = useRef<HTMLDivElement | null>(null);
  const runsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let runs = 0;
    const stop = effect(() => {
      runs += 1;
      if (valRef.current) valRef.current.textContent = String(state.count);
      if (runsRef.current) runsRef.current.textContent = String(runs);
    });
    return stop;
  }, []);

  return (
    <section className="panel">
      <h2>Vanilla JS Effect</h2>
      <p className="meta">Live side-by-side subscription using the vanilla adapter.</p>
      <div className="card">
        <div className="title">effect(() =&gt; ...)</div>
        <div className="count" ref={valRef}>
          0
        </div>
        <div className="muted">
          effect runs: <span ref={runsRef}>0</span>
        </div>
      </div>
    </section>
  );
}

function TimeTravelOverlay() {
  const ttState = useReactor(timeTravel.state);
  const [open, setOpen] = useState(true);
  const [exported, setExported] = useState("");
  const clearAll = () => (timeTravel.clear(), ttPersist.clear(), setExported(""));

  return (
    <>
      <button className="overlay-toggle" onClick={() => setOpen((v) => !v)}>
        {open ? "Hide" : "Show"} TimeTravel
      </button>
      {open && (
        <aside className="tt-overlay">
          <div className="title">TimeTravel Overlay</div>
          <div className="status-row">
            <div className="status-box">
              <span className="muted">
                frame: {ttState.currentFrame} / {ttState.history.length}
              </span>
              <span className="muted">history: {ttState.history.length}</span>
              <span className="muted">playing: {!ttState.paused ? "yes" : "no"}</span>
            </div>
            <button onClick={clearAll} disabled={!ttState.history.length}>
              Clear History
            </button>
          </div>
          <div className="row">
            <button onClick={timeTravel.undo} disabled={ttState.currentFrame <= 0} aria-keyshortcuts={parseForARIAKS(demoKeys.shortcuts!.undo, false)}>
              Undo{formatKeyForDisplay(demoKeys.shortcuts!.undo[0])}
            </button>
            <button onClick={timeTravel.redo} disabled={ttState.currentFrame >= ttState.history.length} aria-keyshortcuts={parseForARIAKS(demoKeys.shortcuts!.redo, false)}>
              Redo{formatKeyForDisplay(demoKeys.shortcuts!.redo[0])}
            </button>
            <button onClick={() => timeTravel.jumpTo(0)} disabled={ttState.currentFrame <= 0} aria-keyshortcuts={parseForARIAKS(demoKeys.shortcuts!.genesis, false)}>
              Genesis{formatKeyForDisplay(demoKeys.shortcuts!.genesis[0])}
            </button>
          </div>
          <div className="row">
            <button onClick={() => (ttState.paused ? timeTravel.play() : timeTravel.pause())} disabled={!ttState.history.length} aria-keyshortcuts={parseForARIAKS(demoKeys.shortcuts!.playPause, false)}>
              {ttState.paused ? "Play" : "Pause"}
              {formatKeyForDisplay(demoKeys.shortcuts!.playPause)}
            </button>
            <button onClick={timeTravel.rewind} disabled={!ttState.history.length} aria-keyshortcuts={parseForARIAKS(demoKeys.shortcuts!.rewind, false)}>
              Rewind{formatKeyForDisplay(demoKeys.shortcuts!.rewind)}
            </button>
          </div>
          <input type="range" min={0} max={ttState.history.length} value={Math.min(ttState.currentFrame, ttState.history.length)} disabled={!ttState.history.length} title="time travel frame" aria-label="time travel frame" onChange={(e) => timeTravel.jumpTo(Number(e.currentTarget.value))} />
          <div className="row">
            <button onClick={() => setExported(timeTravel.export())}>Export</button>
            <button onClick={() => exported.trim().length && timeTravel.import(exported)} disabled={!exported.trim().length}>
              Import
            </button>
            <button onClick={() => setExported("")} disabled={!exported.trim().length}>
              Clear
            </button>
          </div>
          <textarea className="tt-io" value={exported} onChange={(e) => setExported(e.currentTarget.value)} placeholder="timeline payload json" />
        </aside>
      )}
    </>
  );
}

export function App() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const action = keyEventAllowed(e, demoKeys);
      if (action === "undo") return void timeTravel.undo();
      if (action === "redo") return void timeTravel.redo();
      if (action === "genesis") return void timeTravel.jumpTo(0);
      if (action === "prevFrame") return void timeTravel.step(1, false);
      if (action === "nextFrame") return void timeTravel.step(1, true);
      if (action === "skipBwd") return void timeTravel.step(5, false);
      if (action === "skipFwd") return void timeTravel.step(5, true);
      if (action === "rewind") return void timeTravel.rewind();
      if (action === "playPause") return void (timeTravel.state.paused ? timeTravel.play() : timeTravel.pause());
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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
      <TimeTravelOverlay />
    </div>
  );
}
