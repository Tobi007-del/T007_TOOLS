import { defineConfig } from "tsup";
import fs from "fs";

export default defineConfig([
  {
    entry: ["src/ts/index.ts", "src/ts/utils.ts", "src/ts/plugins.ts", "src/ts/adapters/vanilla.ts", "src/ts/adapters/react.ts"],
    format: ["cjs", "esm"],
    dts: true,
    clean: true,
    async onSuccess() {
      const cssSource = "src/css/time-travel-overlay.css";
      if (fs.existsSync(cssSource)) fs.mkdirSync("dist/styles", { recursive: true }), fs.copyFileSync(cssSource, "dist/styles/time-travel-overlay.css"), console.log("✅ CSS stylesheets copied!");
    },
  },
  {
    entry: ["src/ts/super.ts"],
    format: ["iife"], // browser courtesy: use esm.sh if u want this for modules
    globalName: "sia",
    external: ["react"],
    dts: true,
  },
]);
