import { defineConfig } from "tsup";
import fs from "fs";

export default defineConfig([
  // 1. The NPM Build (ESM)
  {
    entry: ["src/index.js"],
    format: ["esm"],
    clean: true,
  },
  // 2. The Browser IIFE Build
  {
    entry: ["src/index.js"],
    format: ["iife"],
    noExternal: ["@t007/utils"],
    async onSuccess() {
      const typePath = "src/ts/types/index.d.ts";
      if (fs.existsSync(typePath)) fs.copyFileSync(typePath, "dist/index.d.ts"), console.log("✅ Custom types copied to dist!");
    },
  },
]);
