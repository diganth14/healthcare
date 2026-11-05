import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'https://healthcare-api-xowz.onrender.com',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'https://healthcare-api-xowz.onrender.com',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
