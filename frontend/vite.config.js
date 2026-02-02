import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_DEV_API_TARGET || 'http://localhost:5001';

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      // In development the browser only talks to localhost:5173. Vite forwards
      // /api (like vercel.json does in production) and the Socket.IO connection.
      proxy: {
        '/api': { target: apiTarget, changeOrigin: true },
        '/socket.io': { target: apiTarget, changeOrigin: true, ws: true },
      },
    },
    preview: { port: 4173 },
    build: {
      sourcemap: false,
      target: 'es2022',
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router'],
            realtime: ['socket.io-client'],
          },
        },
      },
    },
  };
});
