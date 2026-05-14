import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import compression from 'vite-plugin-compression';

/**
 * Advanced manual chunk splitting strategy
 */
function manualChunks(id) {
  // Vendor chunks
  if (!id.includes('node_modules')) return undefined;

  // Core React ecosystem
  if (id.includes('react-dom') || id.includes('react-router-dom') || id.includes('/react/')) {
    return 'vendor-react';
  }

  // Animation library
  if (id.includes('framer-motion')) {
    return 'vendor-motion';
  }

  // Real-time communication
  if (id.includes('livekit-client')) {
    return 'vendor-livekit';
  }

  // WebSocket
  if (id.includes('socket.io-client')) {
    return 'vendor-socket';
  }

  // Encryption / heavy crypto client
  if (id.includes('@signalapp/libsignal-client')) {
    return 'vendor-signal';
  }

  // State management
  if (id.includes('zustand')) {
    return 'vendor-state';
  }

  // Data fetching
  if (id.includes('@tanstack/react-query') || id.includes('axios')) {
    return 'vendor-network';
  }

  // UI libraries
  if (id.includes('@radix-ui') || id.includes('react-hook-form')) {
    return 'vendor-ui';
  }

  // Utilities
  if (id.includes('lodash') || id.includes('date-fns') || id.includes('uuid')) {
    return 'vendor-utils';
  }

  // Default vendor chunk
  return 'vendor';
}

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

    // PWA configuration
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
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
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-512.png',
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
    reportCompressedSize: true,
    sourcemap: false,

    rollupOptions: {
      output: {
        // Advanced chunk splitting
        manualChunks,

        // Optimize chunk names
        chunkFileNames: 'chunks/[name]-[hash].js',
        entryFileNames: '[name]-[hash].js',
        // Keep a static asset naming pattern to avoid edge cases with
        // vite:css-post / PWA generated assets on Render builds.
        assetFileNames: 'assets/[name]-[hash][extname]',
      },

      plugins: [
        // Bundle analyzer
        visualizer({
          open: false,
          filename: './dist/bundle-analyzer.html',
          title: 'Bundle Analyzer',
          gzipSize: true,
          brotliSize: true,
        }),
      ],
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
    allowedHosts: true,
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
