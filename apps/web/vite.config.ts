import basicSsl from '@vitejs/plugin-basic-ssl'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages serves the app from /<repo>/; locally it stays at the root.
const base = process.env.PAGES_BASE ?? '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    // A service worker (and therefore install + offline) needs a secure context.
    // On the LAN that means HTTPS, so the phone gets a self-signed cert to accept once.
    basicSsl(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Wellness Tracker',
        short_name: 'Wellness',
        description: 'Gunluk kilo, protein, antrenman ve retro takibi',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: base,
        scope: base,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      devOptions: { enabled: true },
    }),
  ],
  server: {
    host: true,
    port: 5174,
    proxy: { '/api': { target: 'http://127.0.0.1:3011', changeOrigin: true } },
  },
  preview: {
    host: true,
    port: 4173,
    proxy: { '/api': { target: 'http://127.0.0.1:3011', changeOrigin: true } },
  },
})
