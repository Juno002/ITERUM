import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['mask-icon.svg'],
        manifest: {
          name: 'Iterum Productivity',
          short_name: 'Iterum',
          description: 'Ecosistema de productividad minimalista y profesional.',
          theme_color: '#ffffff',
          icons: [
            {
              src: 'mask-icon.svg',
              sizes: '192x192',
              type: 'image/svg+xml',
            },
            {
              src: 'mask-icon.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
            },
            {
              src: 'mask-icon.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any maskable',
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom'],
            motion: ['motion'],
            vendor: ['date-fns', 'lucide-react', 'zustand'],
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
    },
  };
});
