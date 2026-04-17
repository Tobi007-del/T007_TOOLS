import { describe, it, expect } from "vitest";
import { reactive } from "../src/ts";

describe("S.I.A. Engine: preserveContext + lineage tracing", () => {
  it("must preserve prototype context for custom objects when preserveContext=true", () => {
    class User {
      public first = "Kosi";
      public last = "O";

      get fullName() {
        return `${this.first} ${this.last}`;
      }

      set fullName(value: string) {
        const [first, last] = value.split(" ");
        this.first = first;
        this.last = last;
      }

      public greet() {
        return `hi ${this.fullName}`;
      }
    }

    const state = reactive({ user: new User() }, { preserveContext: true });

    expect(state.user.greet()).toBe("hi Kosi O");
    state.user.fullName = "Tobi 007";
    expect(state.user.first).toBe("Tobi");
    expect(state.user.greet()).toBe("hi Tobi 007");
    expect(Object.getPrototypeOf(state.user)).toBe(User.prototype);
  });

  it("must trace alias lineage paths when referenceTracking and lineageTracing are enabled", () => {
    const state = reactive(
      {
        shared: { count: 0 },
        alias: { target: null as any },
      },
      { preserveContext: true, referenceTracking: true, lineageTracing: true }
    );

    state.alias.target = state.shared;

    const hits = new Set<string>();

    state.on("shared.count", () => hits.add("shared"));
    state.on("alias.target.count", () => hits.add("alias"));

    state.shared.count = 1;
    state.tick();

    expect(hits.has("shared")).toBe(true);
    expect(hits.has("alias")).toBe(true);
  });
});
