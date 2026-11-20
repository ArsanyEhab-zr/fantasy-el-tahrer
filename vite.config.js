import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const apps = {
  viewer: { name: 'فانتا | Fanta', shortName: 'Fanta', theme: '#0B0D12', background: '#0B0D12' },
  admin: { name: 'فانتا الإدارة | Fanta Admin', shortName: 'Fanta Admin', theme: '#111827', background: '#F5F2EB' },
  referee: { name: 'فانتا الحكم | Fanta Ref', shortName: 'Fanta Ref', theme: '#080A0E', background: '#080A0E' },
}

export default defineConfig(({ mode }) => {
  const target = loadEnv(mode, process.cwd(), 'VITE_APP_TARGET').VITE_APP_TARGET ?? 'viewer'
  if (!Object.hasOwn(apps, target)) throw new Error('VITE_APP_TARGET must be viewer, admin, or referee')
  const app = apps[target]
  const icons = 'icons/' + target
  const logos = readdirSync(new URL('./public/logos/', import.meta.url))
    .filter(file => file.endsWith('.svg')).sort().map(file => 'logos/' + file)
  const files = [...logos, '_redirects', 'brand/icon-192.png', 'brand/stadium.webp',
    ...['icon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'].map(file => icons + '/' + file)]
  if (target === 'viewer') {
    files.push(...['portrait', 'wide', 'pitch', 'ball-frames'].map(file => 'brand/matchday/' + file + '.webp'))
  }

  return {
    define: { __CREST_URLS__: JSON.stringify(logos.map(file => '/' + file)) },
    resolve: { alias: { '@app-routes': fileURLToPath(new URL('./src/routes/' + target + '.jsx', import.meta.url)) } },
    build: {
      copyPublicDir: false,
      rolldownOptions: {
        output: { codeSplitting: { groups: [
          { name: 'firestore', test: /node_modules\/@firebase\/firestore/ },
          { name: 'motion', test: /node_modules\/(framer-motion|motion-dom|motion-utils)\// },
        ] } },
      },
    },
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'fanta-target-assets',
        transformIndexHtml: () => [
          { tag: 'title', children: app.name },
          { tag: 'meta', attrs: { name: 'theme-color', content: app.theme } },
          { tag: 'link', attrs: { rel: 'icon', type: 'image/svg+xml', href: '/' + icons + '/icon.svg' } },
          { tag: 'link', attrs: { rel: 'apple-touch-icon', sizes: '180x180', href: '/' + icons + '/apple-touch-icon.png' } },
        ],
        generateBundle() {
          for (const fileName of files) {
            this.emitFile({ type: 'asset', fileName, source: readFileSync(new URL('./public/' + fileName, import.meta.url)) })
          }
        },
      },
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          skipWaiting: true, clientsClaim: true, cleanupOutdatedCaches: true,
          globPatterns: ['**/*.{js,css,html,woff2,webp,png,svg}'],
        },
        manifest: {
          id: 'fanta-' + target + '-pwa', name: app.name, short_name: app.shortName,
          lang: 'ar', dir: 'rtl', theme_color: app.theme, background_color: app.background,
          start_url: '/', scope: '/', display: 'standalone', orientation: 'portrait',
          icons: [192, 512].map(size => ({
            src: `/${icons}/icon-${size}.png`, sizes: `${size}x${size}`, type: 'image/png', purpose: 'any maskable',
          })),
        },
      }),
    ],
  }
})
