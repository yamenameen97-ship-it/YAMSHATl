import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import compression from 'vite-plugin-compression';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const enableAnalyze = process.env.ANALYZE === 'true';
const enableCompression = process.env.COMPRESS === 'true';
const enablePwa = false; // Fixed to prevent Render serving old cached admin dashboard

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

    // Compression is opt-in to keep Render builds stable and lighter.
    ...(enableCompression ? [
      compression({
        verbose: true,
        disable: false,
        threshold: 10240,
        algorithm: 'gzip',
        ext: '.gz',
      }),
      compression({
        verbose: true,
        disable: false,
        threshold: 10240,
        algorithm: 'brotli',
        ext: '.br',
      }),
    ] : []),

    ...(enablePwa ? [
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        workbox: {
          clientsClaim: true,
          skipWaiting: true,
          cleanupOutdatedCaches: true,
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          runtimeCaching: [],
        },
        manifest: {
          name: 'Yamshat',
          short_name: 'Yamshat',
          description: 'تطبيق التواصل الاجتماعي الخاص بك',
          theme_color: '#0f172a',
          background_color: '#ffffff',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: '/icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
        devOptions: {
          enabled: true,
        },
      }),
    ] : []),
  ],

  build: {
    target: 'es2020',
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    minify: false,
    cssMinify: false,
    assetsInlineLimit: 4096,
    modulePreload: {
      polyfill: true,
    },
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: false,
    sourcemap: false,

    rollupOptions: {
      output: {
        ...(manualChunks ? { manualChunks } : {}),
        chunkFileNames: 'chunks/[name]-[hash].js',
        entryFileNames: '[name]-[hash].js',
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

  // Path aliases — يربط '@' بمجلد src حتى تعمل استيرادات
  // مثل '@/api/client' و '@/features/engagement/...'
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
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
