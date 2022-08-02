import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [viteSingleFile()],
  css: {
    modules: {
        scopeBehaviour: 'global'
    }
  },
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
  build: {
    target: 'esnext',
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 100000000,
    cssCodeSplit: false,
    brotliSize: false,
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      inlineDynamicImports: true,
      output: {
        manualChunks: () => 'everything.js'
      }
    },
    outDir: './dist/ui'
  }
});
