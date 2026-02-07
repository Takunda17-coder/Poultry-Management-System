import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config
export default defineConfig({
  plugins: [react()],
  root: 'src/renderer',
  build: {
    outDir: '../../.vite/build/renderer'
  },
  optimizeDeps: {
    exclude: ['sqlite3', 'path', 'fs']
  },
  ssr: {
    external: ['sqlite3', 'path', 'fs']
  }
});
