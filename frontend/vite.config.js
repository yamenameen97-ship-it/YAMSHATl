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
      injectRegister: 'auto',
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB

        // Advanced offline cache strategies
        runtimeCaching: [
          // Google Fonts - Cache first with long expiration
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 365 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },

          // Google Static Fonts - Cache first
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 365 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },

          // Images - Stale while revalidate
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },

          // Videos - Cache first with size limit
          {
            urlPattern: /\.(?:mp4|webm|ogg)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'videos-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },

          // API calls - Network first with fallback
          {
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },

          // Static assets - Cache first
          {
            urlPattern: /\.(?:js|css|woff|woff2)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
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
            purpose: 'any',
          },
          {
            src: '/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        screenshots: [
          {
            src: '/screenshots/screenshot-540.png',
            sizes: '540x720',
            type: 'image/png',
            form_factor: 'narrow',
          },
          {
            src: '/screenshots/screenshot-1280.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
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
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
      output: {
        comments: false,
      },
    },
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
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];

          if (/png|jpe?g|gif|svg|webp/.test(ext)) {
            return `images/[name]-[hash][extname]`;
          }

          if (/woff|woff2|ttf|otf|eot/.test(ext)) {
            return `fonts/[name]-[hash][extname]`;
          }

          if (ext === 'css') {
            return `styles/[name]-[hash][extname]`;
          }

          return `assets/[name]-[hash][extname]`;
        },
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
