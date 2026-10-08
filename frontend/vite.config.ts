import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');

    // Порт бэкенда можно переопределить: DJANGO_URL=http://127.0.0.1:8010 npm run dev
    // (полезно, когда 8000 занят другим сервисом).
    const djangoTarget = process.env.DJANGO_URL || 'http://127.0.0.1:8000';

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',

        // 👇 ДОБАВЛЯЕМ БЛОК PROXY 👇
        // Это заставляет Vite пересылать запросы /api... на Django
        proxy: {
            '/api': {
                target: djangoTarget,
                changeOrigin: true,
                secure: false,
            },
            '/media': {
                target: djangoTarget,
                changeOrigin: true,
                secure: false,
            },
            '/permits_scans': {
                target: djangoTarget,
                changeOrigin: true,
                secure: false,
            }
        }
        // 👆 КОНЕЦ БЛОКА PROXY 👆
      },

      plugins: [react()],

      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },

      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});