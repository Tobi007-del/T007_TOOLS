import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts", "src/utils.ts", "src/plugins.ts", "src/adapters/vanilla.ts", "src/adapters/react.ts"],
    format: ["cjs", "esm"],
    dts: true,
    clean: true,
  },
  {
    entry: ["src/super.ts"],
    format: ["iife"], // browser courtesy: use esm.sh if u want this for modules
    globalName: "sia",
    external: ["react"],
    dts: true,
  },
]);
