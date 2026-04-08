import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { reactive, TERMINATOR } from "../src";
import { effect } from "../src/adapters/vanilla";
import { TimeTravelPlugin, PersistPlugin, MemoryStorageAdapter } from "../src/plugins";

describe("S.I.A. Engine: 10,000 RPM Stress Test", () => {
  // ===========================================================================
  // MODULE 1: CORE PHYSICS & REACTIVITY
  // ===========================================================================
  describe("Core Physics & Mediation", () => {
    it("must maintain absolute batching integrity during nested mutations", async () => {
      const state = reactive({ count: 0, logs: [] as string[] });

      // Trap: A listener that triggers ANOTHER mutation during an active wave
      state.on("count", (e) => {
        if (e.value === 1) {
          state.logs.push("Caught 1, escalating to 2");
          state.count = 2; // Schedules a nested payload
        }
      });

      state.count = 1;
      state.tick(); // Synchronous flush

      // The engine must process the nested mutation without dropping payloads
      expect(state.count).toBe(2);
      expect(state.logs).toEqual(["Caught 1, escalating to 2"]);
    });

    it("must accurately track deep dot-notation paths and sibling isolation", () => {
      const state = reactive({ server: { status: "offline", latency: 0 } });
      let waveCount = 0;

      state.on("server.status", () => waveCount++);

      state.server.latency = 42;
      state.tick();

      // Sibling paths must not trigger each other's listeners
      expect(waveCount).toBe(0);
      expect(state.server.latency).toBe(42);
    });

    it("must differentiate between synchronous watchers and asynchronous listeners (Effects)", async () => {
      const state = reactive({ fuel: 100 });
      const timeline: string[] = [];

      state.watch("fuel", () => timeline.push("Sync Watcher"));
      state.on("fuel", () => timeline.push("Async Listener"));

      state.fuel = 90;
      timeline.push("Mutation Complete");

      state.tick(); // Flush async listeners

      // Watchers fire instantly, Listeners wait for the tick
      expect(timeline).toEqual(["Sync Watcher", "Mutation Complete", "Async Listener"]);
    });

    it("must respect TERMINATOR soft rejections from mediators", () => {
      const state = reactive({ user: { age: 20 } });

      // Reject any age below 18
      state.set("user.age", (val) => (val < 18 ? TERMINATOR : val));

      state.user.age = 15; // Should be rejected
      expect(state.user.age).toBe(20);

      state.user.age = 25; // Should be accepted
      expect(state.user.age).toBe(25);
    });

    it("must halt event bubbling when stopPropagation is invoked", () => {
      const state = reactive({ ui: { modal: { open: false } } });
      let rootFired = false;

      state.on("*", () => (rootFired = true));
      state.on("ui.modal.open", (e) => e.stopPropagation());

      state.ui.modal.open = true;
      state.tick();

      // The root listener should never see the event because the child stopped it
      expect(rootFired).toBe(false);
    });

    it("must surgically auto-track dependencies and isolate effect triggers", async () => {
      // Lineage Tracing MUST be on for the `get` traps to build the dependency tree
      const state = reactive(
        {
          player: { hp: 100, stamina: 50 },
          environment: { time: "day" },
        },
        { referenceTracking: true, lineageTracing: true }
      );

      let runCount = 0;
      let currentStats = "";

      // Initialize the Auto-Tracker
      const cleanup = effect(() => {
        runCount++;
        // We read from `player`, but we COMPLETELY ignore `environment`
        currentStats = `HP: ${state.player.hp} | Stam: ${state.player.stamina}`;
      });

      // 1. Initial execution
      expect(runCount).toBe(1);
      expect(currentStats).toBe("HP: 100 | Stam: 50");

      // 2. Mutate a tracked dependency
      state.player.hp -= 20;
      state.tick(); // Flush the Reactor batch

      expect(runCount).toBe(2);
      expect(currentStats).toBe("HP: 80 | Stam: 50");

      // 3. THE ISOLATION TEST: Mutate an untracked property
      state.environment.time = "night";
      state.tick();

      // If the auto-tracker is flawed, runCount will be 3.
      // If S.I.A.'s O(1) path isolation is perfect, runCount stays 2!
      expect(runCount).toBe(2);

      // 4. Teardown Test
      cleanup(); // Stop tracking
      state.player.stamina -= 10;
      state.tick();

      // The effect should no longer fire after cleanup
      expect(runCount).toBe(2);
    });
  });

  // ===========================================================================
  // MODULE 2: TIME TRAVEL & SPACETIME PHYSICS
  // ===========================================================================
  describe("TimeTravelPlugin: The Spacetime Engine", () => {
    it("must execute O(1) bidirectional teleportation and timeline branching", () => {
      const state = reactive({ volume: 50, playing: false });
      const timePlug = new TimeTravelPlugin();
      state.__Reactor__.plugIn(timePlug);

      state.volume = 60;
      state.tick(); // Frame 0
      state.playing = true;
      state.tick(); // Frame 1
      state.volume = 100;
      state.tick(); // Frame 2

      // Undo 2 steps (Back to Frame 0)
      timePlug.step(2, false);
      expect(state.volume).toBe(60);
      expect(state.playing).toBe(false);

      // Branch the timeline
      state.volume = 11;
      state.tick();

      // The timeline should have overwritten Frame 1 and 2
      expect(timePlug.state.history.length).toBe(2);
      expect(timePlug.state.history[1].value).toBe(11);
    });

    it("must solve the 'Explicit Undefined' paradox using keyExisted flags", () => {
      const state = reactive({ session: { token: "abc" } } as any);
      const timePlug = new TimeTravelPlugin();
      state.__Reactor__.plugIn(timePlug);

      // Frame 0: Explicitly set existing key to undefined
      state.session.token = undefined;
      state.tick();

      // Frame 1: Create a brand new key
      state.session.newFlag = true;
      state.tick();

      // Rewind to Genesis
      timePlug.jumpTo(-1);

      // It must know to delete `newFlag`, but RESTORE `token` to "abc"
      expect(state.session.newFlag).toBeUndefined();
      expect("newFlag" in state.session).toBe(false);
      expect(state.session.token).toBe("abc");
    });

    it("must accurately automate session playback using recorded VCR delays", async () => {
      vi.useRealTimers(); // Requires real-time physics for custom timeouts

      const state = reactive({ position: 0 });
      const timePlug = new TimeTravelPlugin({ maxPlaybackDelay: 100 });
      state.__Reactor__.plugIn(timePlug);

      state.position = 10;
      state.tick();
      await new Promise((r) => globalThis.setTimeout(r, 50));

      state.position = 20;
      state.tick();
      await new Promise((r) => globalThis.setTimeout(r, 150)); // Will cap at 100ms

      state.position = 30;
      state.tick();

      timePlug.jumpTo(-1); // Reset to Genesis
      expect(state.position).toBe(0);

      // Run the VCR
      await timePlug.play();

      expect(state.position).toBe(30);
    });
  });

  // ===========================================================================
  // MODULE 3: PERSISTENCE & HYDRATION
  // ===========================================================================
  describe("PersistPlugin: Storage & Sync", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("must securely isolate payload paths and throttle storage writes", async () => {
      const mockAdapter = new MemoryStorageAdapter();
      const state = reactive({
        settings: { theme: "light" },
        cache: { temp: "foo" },
      });

      state.__Reactor__.plugIn(
        new PersistPlugin({
          key: "REACTOR_TEST",
          paths: ["settings"], // Strict path isolation
          throttle: 1000,
          adapter: mockAdapter,
        })
      );

      // Flush hydration microtasks
      await Promise.resolve();

      // Mutate both paths
      state.settings.theme = "neon";
      state.cache.temp = "bar";
      state.tick();

      // Write should be throttled
      expect(mockAdapter.get("REACTOR_TEST")).toBeUndefined();

      // Fast-forward spacetime
      vi.advanceTimersByTime(1500);

      const stored = mockAdapter.get("REACTOR_TEST");
      expect(stored.settings.theme).toBe("neon");
      expect(stored.cache).toBeUndefined(); // Cache must be strictly ignored
    });

    it("must hydrate state cleanly from a populated adapter", async () => {
      const mockAdapter = new MemoryStorageAdapter();
      mockAdapter.set("APP_STATE", { user: { role: "admin" } });

      const state = reactive({ user: { role: "guest" } });

      state.__Reactor__.plugIn(
        new PersistPlugin({
          key: "APP_STATE",
          adapter: mockAdapter,
        })
      );

      await Promise.resolve(); // Await hydration

      expect(state.user.role).toBe("admin");
    });
  });
});
