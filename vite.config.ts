import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3001,
      host: 'localhost',
    },
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // Core React
              if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
                return 'react-vendor';
              }
              // Supabase
              if (id.includes('@supabase')) {
                return 'supabase-vendor';
              }
              // UI Libraries
              if (id.includes('lucide') || id.includes('sonner') || id.includes('radix-ui')) {
                return 'ui-vendor';
              }
              // PDF Generation
              if (id.includes('jspdf')) {
                return 'pdf-vendor';
              }
              // Charts
              if (id.includes('recharts')) {
                return 'charts-vendor';
              }
              // Utilities
              if (id.includes('date-fns') || id.includes('lodash')) {
                return 'utils-vendor';
              }
              return 'vendor';
            }
          }
        }
      }
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    }
  };
});
