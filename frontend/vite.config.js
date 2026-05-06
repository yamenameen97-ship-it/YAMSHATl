import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function manualChunks(id) {
  if (!id.includes('node_modules')) return undefined;
  if (id.includes('react-dom') || id.includes('react-router-dom') || id.includes('/react/')) return 'react';
  if (id.includes('framer-motion')) return 'motion';
  if (id.includes('livekit-client')) return 'livekit';
  if (id.includes('socket.io-client')) return 'socket';
  if (id.includes('@tanstack/react-query')) return 'query';
  return undefined;
}

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
  },
});
