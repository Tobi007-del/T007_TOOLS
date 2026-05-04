import { defineConfig } from "tsup";
import { existsSync, mkdirSync, copyFileSync } from "node:fs";

export default defineConfig({
  entry: ["src/ts/index.ts", "src/ts/hooks/react.ts", "src/ts/hooks/vanilla.ts", "src/ts/components/react.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  async onSuccess() {
    const keys = ["ripple", "scroll-assist"];
    keys.forEach((key) => {
      const source = `src/css/${key}.css`;
      if (existsSync(source)) mkdirSync("dist/styles", { recursive: true }), copyFileSync(source, `dist/styles/${key}.css`), console.log(`✅ ${key} CSS stylesheet copied!`);
    });
  }
});
