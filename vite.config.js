import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'firestore', test: /node_modules\/@firebase\/firestore/ },
            { name: 'motion', test: /node_modules\/(framer-motion|motion-dom|motion-utils)\// },
          ],
        },
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,woff2}', 'brand/matchday/*.webp'],
      },
      includeAssets: ['brand/crest.png', 'brand/icon-192.png', 'brand/icon-512.png', 'brand/stadium.webp', 'brand/stadium-portrait.webp'],
      manifest: {
        name: 'فانتزي التحرير | Fantasy El Tahrrer',
        short_name: 'فانتزي التحرير',
        description: 'المركز المباشر لدوري فانتزي التحرير — النتائج، الترتيب، والهدافون لحظة بلحظة',
        theme_color: '#091B32',
        background_color: '#091B32',
        display: 'standalone',
        icons: [192, 512].map(size => ({
          src: `/brand/icon-${size}.png`,
          sizes: `${size}x${size}`,
          type: 'image/png',
          purpose: 'any',
        })),
      },
    }),
  ],
})
