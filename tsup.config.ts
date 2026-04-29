import { defineConfig, type Options } from "tsup";
import { copyFileSync, existsSync } from "node:fs";

const config: Options[] = [
  // 1. The NPM Build (ESM)
  {
    entry: ["src/js/index.js"],
    format: ["esm"],
    clean: true,
  },
  // 2. The Browser IIFE Build
  {
    entry: ["src/js/index.js"],
    format: ["iife"],
    noExternal: ["@t007/utils"],
    async onSuccess() {
      const typePath = "src/ts/types/index.d.ts";
      if (existsSync(typePath)) copyFileSync(typePath, "dist/index.d.ts"), console.log("✅ Custom types copied to dist!");
    },
  },
];

if (existsSync("src/ts/react.ts")) {
  config.push({
    entry: ["src/ts/react.ts"],
    format: ["esm"],
    dts: true
  });
}

export default defineConfig(config);
