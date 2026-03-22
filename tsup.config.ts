import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.js"],
    format: ["esm"],
    clean: true,
  },
  {
    entry: ["src/index.js"],
    format: ["iife"],
    noExternal: ["@t007/utils"],
  },
  {
    entry: { standalone: "src/index.js" },
    format: ["esm"],
    noExternal: ["@t007/utils"],
  },
]);
