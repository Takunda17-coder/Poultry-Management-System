import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      external: ['sqlite3', 'electron'],
      output: {
        format: 'cjs'
      }
    }
  },
  optimizeDeps: {
    exclude: ['sqlite3', 'electron']
  }
});
