import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom', // Tells Vitest to simulate a browser (adds `window`, `localStorage`, etc.)
  },
});