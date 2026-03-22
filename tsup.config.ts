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
  },
  // 3. The Browser Standalone Build (ESM)
  {
    entry: { standalone: "src/index.js" },
    format: ["esm"],
    noExternal: ["@t007/utils"],
    async onSuccess() {
      const typePath = "src/ts/types/index.d.ts";
      // 1. Only copy the types IF the file actually exists in this package!
      if (fs.existsSync(typePath)) {
        fs.copyFileSync(typePath, "dist/index.d.ts");
        console.log("✅ Custom types copied to dist!");
      }
      // 2. Nuke the duplicate CSS if it was generated
      if (fs.existsSync("dist/standalone.css")) {
        fs.rmSync("dist/standalone.css", { force: true });
        console.log("✅ Duplicate CSS nuked!");
      }
    },
  },
]);
