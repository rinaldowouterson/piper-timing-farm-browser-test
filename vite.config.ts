import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    open: true
  },
  // Ensure the worker is treated as a module and can resolve dependencies
  worker: {
    format: 'es',
    plugins: () => []
  }
});
