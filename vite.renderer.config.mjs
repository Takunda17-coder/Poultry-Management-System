import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config
export default defineConfig({
  plugins: [react()],
  base: './',
  root: 'src/renderer',
  build: {
    outDir: '../../.vite/build/renderer',
    assetsDir: '.',
  },
  assetsInclude: ['**/*.wasm'],
  optimizeDeps: {
    exclude: ['path', 'fs']
  },
  ssr: {
    external: ['path', 'fs']
  }
});
