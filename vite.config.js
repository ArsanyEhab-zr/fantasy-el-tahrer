import { readdirSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const apps = {
  viewer: { name: 'فانتزي التحرير', theme: '#0B0D12', background: '#0B0D12' },
  admin: { name: 'إدارة الفنتازي', theme: '#111827', background: '#F5F2EB' },
  referee: { name: 'حكم الفنتازي', theme: '#080A0E', background: '#080A0E' },
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const target = env.VITE_APP_TARGET ?? 'viewer'
  const firebaseConfig = { apiKey: env.VITE_FIREBASE_API_KEY, projectId: env.VITE_FIREBASE_PROJECT_ID,
    appId: env.VITE_FIREBASE_APP_ID, messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID }
  if (!Object.hasOwn(apps, target)) throw new Error('VITE_APP_TARGET must be viewer, admin, or referee')
  const app = apps[target]
  const icons = 'icons/' + target
  const iconUrl = file => {
    const path = icons + '/' + file
    const bytes = readFileSync(new URL('./public/' + path, import.meta.url))
    const revision = createHash('sha256').update(bytes).digest('hex').slice(0, 12)
    return '/' + path + '?v=' + revision
  }
  const logos = readdirSync(new URL('./public/logos/', import.meta.url))
    .filter(file => file.endsWith('.svg')).sort().map(file => 'logos/' + file)
  const files = [...logos, '_redirects', 'league-logo.webp', 'league-logo.png', 'brand/stadium.webp',
    ...['favicon.png', 'icon-192.png', 'icon-512.png', 'maskable-512.png', 'apple-touch-icon.png'].map(file => icons + '/' + file)]
  if (target === 'viewer') {
    files.push('firebase-messaging-sw.js')
    files.push(...['portrait', 'wide', 'pitch', 'ball-frames'].map(file => 'brand/matchday/' + file + '.webp'))
  }

  return {
    define: {
      __APP_NAME__: JSON.stringify(app.name),
      __VERCEL_PIN_CHECK__: Boolean(process.env.VERCEL),
      __STAFF_PIN_LENGTH__: (target === 'admin' ? env.VITE_ADMIN_PIN || '2026' : env.VITE_REFEREE_PIN || '1111').length,
      __CREST_URLS__: JSON.stringify(logos.map(file => '/' + file)) },
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
          { tag: 'meta', attrs: { name: 'application-name', content: app.name } },
          { tag: 'meta', attrs: { name: 'apple-mobile-web-app-title', content: app.name } },
          { tag: 'meta', attrs: { name: 'theme-color', content: app.theme } },
          { tag: 'link', attrs: { rel: 'icon', type: 'image/png', href: iconUrl('favicon.png') } },
          { tag: 'link', attrs: { rel: 'apple-touch-icon', sizes: '180x180', href: iconUrl('apple-touch-icon.png') } },
        ],
        generateBundle() {
          if (target === 'viewer') {
            this.emitFile({type:'asset',fileName:'push/config.js',source:'self.fantaFirebaseConfig=' + JSON.stringify(firebaseConfig)})
            for (const name of ['firebase-app-compat.js','firebase-messaging-compat.js']) {
              this.emitFile({type:'asset',fileName:'push/' + name,source:readFileSync(new URL('./node_modules/firebase/' + name,import.meta.url))})
            }
          }
          for (const fileName of files) {
            this.emitFile({ type: 'asset', fileName, source: readFileSync(new URL('./public/' + fileName, import.meta.url)) })
          }
        },
      },
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          importScripts: target === 'viewer' ? ['/firebase-messaging-sw.js'] : [],
          ignoreURLParametersMatching: [/^utm_/, /^fbclid$/, /^v$/],
          navigateFallbackDenylist: [/^\/api\//],
          skipWaiting: true, clientsClaim: true, cleanupOutdatedCaches: true,
          globPatterns: ['**/*.{js,css,html,woff2,webp,png,svg}'],
        },
        manifest: {
          id: 'fanta-' + target + '-pwa', name: app.name, short_name: app.name,
          lang: 'ar', dir: 'rtl', theme_color: app.theme, background_color: app.background,
          start_url: '/', scope: '/', display: 'standalone', orientation: 'portrait',
          icons: [192, 512].map(size => ({
            src: iconUrl(`icon-${size}.png`), sizes: `${size}x${size}`, type: 'image/png', purpose: 'any',
          })).concat({src: iconUrl('maskable-512.png'), sizes:'512x512', type:'image/png', purpose:'maskable'}),
        },
      }),
    ],
  }
})
