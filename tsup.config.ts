import { defineConfig, type Options } from "tsup";
import { copyFileSync, existsSync } from "node:fs";
import { sassPlugin } from "esbuild-sass-plugin";

const config: Options[] = [
  // 1. The NPM Build (ESM)
  {
    entry: ["src/js/index.js"],
    format: ["esm"],
    clean: true,
    esbuildPlugins: [sassPlugin()],
  },
  // 2. The Browser IIFE Build
  {
    entry: ["src/js/index.js"],
    format: ["iife"],
    noExternal: ["@t007/utils"],
    async onSuccess() {
      const source = "src/ts/types/index.d.ts";
      if (existsSync(source)) copyFileSync(source, "dist/index.d.ts"), console.log("✅ Types copied to dist!");
    },
    esbuildPlugins: [sassPlugin()],
  },
];
existsSync("src/ts/react.ts") &&
  config.push({
    entry: ["src/ts/react.ts"],
    format: ["esm"],
    dts: true,
    esbuildPlugins: [sassPlugin()],
  });

export default defineConfig(config);
