import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import compression from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    compression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    compression({
      algorithm: 'brotli',
      ext: '.br',
    }),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Yamshat',
        short_name: 'Yamshat',
        description: 'تطبيق التواصل الاجتماعي الخاص بك',
        theme_color: '#0f172a',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  build: {
    target: 'esnext',
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor-react';
            if (id.includes('livekit')) return 'vendor-livekit';
            if (id.includes('signal')) return 'vendor-signal';
            return 'vendor';
          }
        },
      },
      plugins: [
        visualizer({
          filename: './dist/bundle-analyzer.html',
        }),
      ],
    },
  },
});
