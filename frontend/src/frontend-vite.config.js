import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
import react from '@vitejs/plugin-react';
import compression from 'vite-plugin-compression';

const enableAnalyze = process.env.ANALYZE === 'true';

/**
 * Keep chunking conservative to avoid circular dependencies between
 * React, React Router, and packages that consume React context.
 *
 * The previous aggressive vendor splitting produced a runtime crash on
 * Render: `Cannot read properties of undefined (reading 'createContext')`.
 * Let Vite/Rollup own the chunk graph for safety and deployment stability.
 */
const manualChunks = undefined;

export default defineConfig({
  plugins: [
    react({
      // Enable JSX fast refresh
      fastRefresh: true,
    }),

    // Compression plugin for gzip and brotli
    compression({
      verbose: true,
      disable: false,
      threshold: 10240, // 10kb
      algorithm: 'gzip',
      ext: '.gz',
    }),

    // Brotli compression
    compression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: 'brotli',
      ext: '.br',
    }),

  ],

  build: {
    target: 'es2020',
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: true,
    minify: 'esbuild',
    cssMinify: true,
    assetsInlineLimit: 4096,
    modulePreload: {
      polyfill: true,
    },
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: false,
    sourcemap: false,

    rollupOptions: {
      output: {
        // Avoid custom vendor chunk graphs that can break React runtime on Render.
        ...(manualChunks ? { manualChunks } : {}),

        // Optimize chunk names
        chunkFileNames: 'chunks/[name]-[hash].js',
        entryFileNames: '[name]-[hash].js',
        // Keep a static asset naming pattern to avoid edge cases with
        // vite:css-post / PWA generated assets on Render builds.
        assetFileNames: 'assets/[name]-[hash][extname]',
      },

      plugins: enableAnalyze ? [
        // Bundle analyzer
        visualizer({
          open: false,
          filename: './dist/bundle-analyzer.html',
          title: 'Bundle Analyzer',
          gzipSize: true,
          brotliSize: false,
        }),
      ] : [],
    },
  },

  // Optimization settings
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'zustand',
      'axios',
      'framer-motion',
      'socket.io-client',
    ],
    exclude: ['@vite/client', '@vite/env'],
  },

  // Server configuration
  server: {
    middlewareMode: false,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
    },
  },

  // Preview configuration
  preview: {
    port: 4173,
  },
});
