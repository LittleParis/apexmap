import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api/image': {
        target: 'https://apexlegendsstatus.com/assets/maps',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api\/image/, ''),
      },
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
