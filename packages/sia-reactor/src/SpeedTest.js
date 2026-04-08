"use strict";
import log from "../../../assets/scripts/logger.js";
import { reactive as createSIAProxy } from "https://esm.sh/sia-reactor";
import { reactive as createVueProxy } from "https://esm.sh/@vue/reactivity";
import { observable as createMobxProxy } from "https://esm.sh/mobx";
import { proxy as createValtioProxy } from "https://esm.sh/valtio";
import { observable as createLegendProxy } from "https://esm.sh/@legendapp/state";
window.createSIAProxy ??= createSIAProxy;
window.createVueProxy ??= createVueProxy;
window.createMobxProxy ??= createMobxProxy;
window.createValtioProxy ??= createValtioProxy;
window.createLegendProxy ??= createLegendProxy;

// ==========================================
// PROFESSIONAL BENCHMARK SUITE
// ==========================================

var TEST_WARMUP_ITERATIONS = 20_000;
var TEST_ITERATIONS = TEST_WARMUP_ITERATIONS * 50;
var TEST_CYCLES = 5;

const breathe = () => new Promise((resolve) => setTimeout(resolve, 50));

window.runBenchmark = async function runBenchmark() {
  document.querySelectorAll("button").forEach((btn) => (btn.disabled = true));
  log(`%c🧪 S.I.A. REACTOR PERFORMANCE EVALUATION`, "color: #E91E63; font-size: 16px; font-weight: bold; padding-bottom: 4px;");
  log(`Initializing suite: ${TEST_CYCLES} cycles of ${TEST_ITERATIONS.toLocaleString()} operations...\n`);

  window.rawObj = { val: 0 };
  window.proxy = new Proxy(
    { val: 0 },
    {
      set(t, k, v) {
        return (t[k] = v), true;
      },
    }
  );
  // const proxy2 = new Proxy(
  //   { val: 0 },
  //   {
  //     set(t, k, v, r) {
  //       return Reflect.set(t, k, v, r);
  //     },
  //   }
  // );
  window.siaState = createSIAProxy({ val: 0 });
  // const siaState2 = createSIAProxy({ val: 0 }, { preserveContext: true });
  window.vueState = createVueProxy({ val: 0 });
  window.mobxState = createMobxProxy({ val: 0 });
  window.valtioState = createValtioProxy({ val: 0 });
  window.legendState = createLegendProxy({ val: 0 });

  log(`🔥 Warming up JIT compiler to stabilize execution environments...`);
  for (let i = 0; i < TEST_WARMUP_ITERATIONS; i++) {
    rawObj.val = i;
    proxy.val = i;
    // proxy2.val = i;
    siaState.val = i;
    // siaState2.val = i;
    vueState.val = i;
    mobxState.val = i;
    valtioState.val = i;
    // legendState.val.set(i);
  }
  await breathe();

  log(`⏱️ Executing timed cycles after (${TEST_WARMUP_ITERATIONS.toLocaleString()} ops) warm up...\n`);
  const results = { raw: [], proxy: [], proxy2: [], reactor: [], reactor2: [], vue: [], mobx: [], valtio: [], legend: [] };

  for (let cycle = 1; cycle <= TEST_CYCLES; cycle++) {
    let start = performance.now();
    for (let i = 0; i < TEST_ITERATIONS; i++) rawObj.val = i;
    results.raw.push(performance.now() - start);
    await breathe();
    start = performance.now();
    for (let i = 0; i < TEST_ITERATIONS; i++) proxy.val = i;
    results.proxy.push(performance.now() - start);
    // await breathe();
    // start = performance.now();
    // for (let i = 0; i < TEST_ITERATIONS; i++) proxy2.val = i;
    // results.proxy2.push(performance.now() - start);
    await breathe();
    start = performance.now();
    for (let i = 0; i < TEST_ITERATIONS; i++) siaState.val = i;
    results.reactor.push(performance.now() - start);
    // await breathe();
    // start = performance.now();
    // for (let i = 0; i < TEST_ITERATIONS; i++) siaState2.val = i;
    // results.reactor2.push(performance.now() - start);
    await breathe();
    start = performance.now();
    for (let i = 0; i < TEST_ITERATIONS; i++) vueState.val = i;
    results.vue.push(performance.now() - start);
    await breathe();
    start = performance.now();
    for (let i = 0; i < TEST_ITERATIONS; i++) mobxState.val = i;
    results.mobx.push(performance.now() - start);
    await breathe();
    start = performance.now();
    for (let i = 0; i < TEST_ITERATIONS; i++) valtioState.val = i;
    results.valtio.push(performance.now() - start);
    await breathe();
    // start = performance.now();
    // for (let i = 0; i < TEST_ITERATIONS; i++) legendState.val.set(i);
    // results.legend.push(performance.now() - start);
    // await breathe();
  }

  // --- STATISTICAL ANALYSIS ---
  const getStats = (arr) => {
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    const opsSec = Math.floor(TEST_ITERATIONS / (avg / 1000));
    return { avg, opsSec };
  };

  const rawStats = getStats(results.raw);
  const proxyStats = getStats(results.proxy);
  const proxy2Stats = getStats(results.proxy2);
  const reactorStats = getStats(results.reactor);
  const reactor2Stats = getStats(results.reactor2);
  const vueStats = getStats(results.vue);
  const mobxStats = getStats(results.mobx);
  const valtioStats = getStats(results.valtio);
  const legendStats = getStats(results.legend);

  // --- DEVICE PROFILING (Based on 1,000,000 raw object mutations) ---
  const rawMs = parseFloat(rawStats.avg);
  let deviceProfile = "";
  let hardwareSpecs = "";

  if (rawMs <= 1.2 * (TEST_ITERATIONS / 1_000_000)) {
    deviceProfile = "Tier 0: God-Tier Workstation / Bleeding-Edge Silicon";
    hardwareSpecs = "Apple M4 Max, Intel Core i9-14900K, Ryzen 9 9950X, Liquid-cooled Overclocks";
  } else if (rawMs <= 2.5 * (TEST_ITERATIONS / 1_000_000)) {
    deviceProfile = "Tier 1: Elite Workstation / Pro-Grade Silicon";
    hardwareSpecs = "Apple M2/M3 Max, AMD Ryzen 9, Intel Core i9";
  } else if (rawMs <= 5.0 * (TEST_ITERATIONS / 1_000_000)) {
    deviceProfile = "Tier 2: High-Performance Workstation / Flagship Silicon";
    hardwareSpecs = "Apple M1/M2, Intel Core i7, AMD Ryzen 7";
  } else if (rawMs <= 9.0 * (TEST_ITERATIONS / 1_000_000)) {
    deviceProfile = "Tier 3: Standard Workstation / Premium Mobile";
    hardwareSpecs = "Standard Ultrabooks, iPhone 13+, Snapdragon 8 Gen 2";
  } else if (rawMs <= 16.0 * (TEST_ITERATIONS / 1_000_000)) {
    deviceProfile = "Tier 4: Mid-Range Mobile / Thermally Throttled";
    hardwareSpecs = "Standard Android, 5+ year old laptops, Power-Saving modes";
  } else if (rawMs <= 30.0 * (TEST_ITERATIONS / 1_000_000)) {
    deviceProfile = "Tier 5: Entry-Level Mobile / Legacy Hardware";
    hardwareSpecs = "Budget smartphones, aggressive background throttling";
  } else {
    deviceProfile = "Tier 6: Severely Constrained Environment";
    hardwareSpecs = "Extreme battery saver, legacy devices, CPU starvation";
  }

  log(`%c=== ENVIRONMENT PROFILE ===`, "color: darkturquoise; font-weight: bold;");
  log(`Performance Class:  ${deviceProfile}`);
  log(`Equivalent Specs:   ${hardwareSpecs}`);
  log(`Base Memory Speed:  ~${rawStats.opsSec.toLocaleString()} ops/sec (Raw Object)\n`);

  log(`%c=== ABSOLUTE PERFORMANCE (Average over ${(TEST_CYCLES * TEST_ITERATIONS).toLocaleString()} ops) ===`, "color: darkturquoise; font-weight: bold;");
  const logPad = (name, avg, ops, style = "color: grey;") => log(`${name.padEnd(20)} | ${avg.toFixed(2).padStart(8)} ms | ${ops.toLocaleString().padStart(12)} ops/sec`, style);

  logPad("1. Bare Metal", rawStats.avg, rawStats.opsSec, "color: white");
  logPad("2. Native Proxy", proxyStats.avg, proxyStats.opsSec, "color: white");
  // logPad("(With Reflect API)", proxy2Stats.avg, proxy2Stats.opsSec);
  logPad("3. S.I.A Reactor", reactorStats.avg, reactorStats.opsSec, "color: white");
  // logPad("(With Reflect API)", reactor2Stats.avg, reactor2Stats.opsSec);
  logPad("4. Vue Reactivity", vueStats.avg, vueStats.opsSec);
  logPad("5. MobX Observable", mobxStats.avg, mobxStats.opsSec);
  logPad("6. Valtio Proxy", valtioStats.avg, valtioStats.opsSec);
  // logPad("7. Legend-State", legendStats.avg, legendStats.opsSec);
  // log("The Reflect API is opt-in due to it's slowdown and unnecessity in S.I.A."); // A Magician never reveals his tricks :), except to u who came searching...

  log(`%c=== OVERHEAD ANALYSIS & FRAME BUDGET ===`, "color: darkturquoise; font-weight: bold;");
  const proxyOverhead = (proxyStats.avg / rawStats.avg).toFixed(1);
  const reactorOverhead = (reactorStats.avg / proxyStats.avg).toFixed(1);
  const opsPerFrame = Math.floor(reactorStats.opsSec / 60); // Frame budget math (16.6ms per 60fps frame)

  log(`• Native Proxy Penalty: ~${proxyOverhead}x slower than Bare Metal`);
  log(`• Reactor Framework Cost: ~${reactorOverhead}x slower than Native Proxy`);
  log(`• Total Reactor Penalty: ~${(reactorStats.avg / rawStats.avg).toFixed(1)}x slower than Bare Metal`);

  log(`%c🎯 CONCLUSION:`, "color: #FF9800; font-weight: bold;");
  log(`At ~${reactorStats.opsSec.toLocaleString()} ops/sec, the Reactor can process ${opsPerFrame.toLocaleString()} reactive state changes within a frame.`);
  log(`---------------------------------------------------------------------------\n`);
  document.querySelectorAll("button").forEach((btn) => (btn.disabled = false));
};

window.addEventListener("load", () => setTimeout(runBenchmark, 2000));

// ==========================================
// REACTOR ARCHITECTURE BRIEFING
// ==========================================
log(`%c🧠 WHAT IS THE S.I.A. REACTOR?`, "color: #FF9800; font-size: 16px; font-weight: bold; padding-bottom: 4px;");
log(`The State Intent Architecture (S.I.A.) Reactor is a high-performance reactivity engine.`);
log(`At its core, it is a surgical wrapper around a native JavaScript Proxy, designed to`);
log(`give raw data objects a DOM-like nervous system without destroying the frame budget.\n`);

log(`%c⚙️ CORE PHILOSOPHY`, "color: darkturquoise; font-weight: bold;");
log(`• Progressive: Zero overhead for unused features. Only scales when listeners are attached.`);
log(`• Event Routing: Implements Capture, At-Target, and Bubble phases for deep object trees.`);
log(`• Intent-Based: Mediators can intercept, alter, or completely TERMINATE state changes.\n`);

log(`%c🛠️ THE API SURFACE`, "color: darkturquoise; font-weight: bold;");
log(`%c➤ MEDIATORS (The Gatekeepers)`, "color: #9C27B0; font-weight: bold;");
log(`  .get() / .noget()       : Intercept and alter property reads on the fly.`);
log(`  .set() / .noset()       : Intercept, validate, or reject property writes.`);
log(`  .delete() / .nodelete() : Intercept and govern property deletions.\n`);

log(`%c➤ OBSERVERS (The Reactivity)`, "color: #9C27B0; font-weight: bold;");
log(`  .watch() / .nowatch()   : Listen to precise path mutations (Fast, isolated).`);
log(`  .on() / .off() / .once(): DOM-like event listeners with path propagation and depth limits.\n`);

log(`%c📉 THE BENCHMARK OBJECTIVE`, "color: #E91E63; font-weight: bold;");
log(`Native Proxies are inherently slower than bare-metal objects. By adding an entire event system,`);
log(`opt-in reference tracking with lineage tracing, batched microtask scheduling on top of a Proxy,`);
log(`we introduce overhead. This benchmark proves that the S.I.A Reactor handles this weight`);
log(`gracefully, executing deeply reactive state changes well within the 16.6ms(60fps) frame budget.\n`);
log(`---------------------------------------------------------------------------\n`);
