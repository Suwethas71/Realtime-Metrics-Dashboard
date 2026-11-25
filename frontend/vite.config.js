import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

// The dev server proxies API calls to the Express backend, so the browser
// talks to one origin and no CORS round-trips are needed during the demo.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.BACKEND_URL || 'http://localhost:5000';

  return {
    plugins: [vue()],
    server: {
      port: 5173,
      proxy: {
        '/api': { target, changeOrigin: true },
        '/health': { target, changeOrigin: true }
      }
    },
    preview: {
      port: 4173,
      proxy: {
        '/api': { target, changeOrigin: true },
        '/health': { target, changeOrigin: true }
      }
    }
  };
});
