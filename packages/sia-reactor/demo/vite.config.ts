import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "demo",
  base: "./",
  plugins: [react()],
  server: {
    port: 4173,
    open: "/",
  },
  preview: {
    port: 4173,
  },
});
