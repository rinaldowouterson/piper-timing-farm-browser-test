import { defineConfig } from 'vite';

export default defineConfig({
  // Use relative base for subfolder indifference
  base: './', 
  server: {
    port: 5173,
    open: true
  },
  build: {
    // Flatten the assets folder: index.js will land in the root
    assetsDir: '', 
  },
  // Ensure the worker is treated as a module and can resolve dependencies
  worker: {
    format: 'es',
    plugins: () => []
  }
});
