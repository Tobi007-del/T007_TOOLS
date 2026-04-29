import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/hooks/react.ts", "src/hooks/vanilla.ts", "src/components/react.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
});
