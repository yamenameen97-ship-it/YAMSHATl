import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import compression from 'vite-plugin-compression';

const enableAnalyze = process.env.ANALYZE === 'true';
const enableCompression = process.env.COMPRESS === 'true';
const enablePwa = false; // Service worker is intentionally disabled to avoid stale Render deployments.
const buildTime = new Date().toISOString();
const buildId = (process.env.RENDER_GIT_COMMIT || process.env.VITE_BUILD_ID || buildTime)
  .toString()
  .replace(/[^a-zA-Z0-9_-]/g, '-')
  .slice(0, 32);

// Split only the heaviest libraries and leave the rest to Vite.
// Avoid a generic fallback vendor chunk because it caused circular output.
const manualChunks = (id) => {
  if (!id.includes('node_modules')) return undefined;
  if (/node_modules\/(react|react-dom)\//.test(id)) return 'vendor-react';
  if (/node_modules\/(react-router|react-router-dom)\//.test(id)) return 'vendor-router';
  if (/node_modules\/@tanstack\//.test(id)) return 'vendor-query';
  if (/node_modules\/(socket\.io-client|livekit-client|@signalapp\/libsignal-client)\//.test(id)) return 'vendor-realtime';
  if (/node_modules\/(recharts|framer-motion)\//.test(id)) return 'vendor-ui';
  return undefined;
};

export default defineConfig({
  define: {
    __APP_BUILD_ID__: JSON.stringify(buildId),
    __APP_BUILD_TIME__: JSON.stringify(buildTime),
  },
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
    cssCodeSplit: true,
    minify: 'esbuild',
    cssMinify: true,
    assetsInlineLimit: 0,
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
