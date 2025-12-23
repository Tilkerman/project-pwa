import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'
import packageJson from './package.json'

const basePath = process.env.CI ? '/project-pwa/' : '/'

export default defineConfig({
  // Четкий base для роутера и ассетов:
  // - локально/Render: '/'
  // - GitHub Pages: '/project-pwa/'
  base: basePath,
  build: {
    outDir: 'dist'
  },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'icon.svg',
        'icons/icon-192x192.png',
        'icons/icon-512x512.png',
        'icon-new.png'
      ],
      manifest: {
        name: 'Трекер Привычек',
        short_name: 'Привычки',
        description: 'Приложение для отслеживания привычек с персонажами-мотиваторами',
        // Используем относительные пути, чтобы на GitHub Pages (base=/project-pwa/)
        // браузер не искал иконки в корне домена и не показывал дефолтную букву.
        start_url: '.',
        display: 'standalone',
        scope: '.',
        lang: 'ru',
        theme_color: '#6366f1',
        background_color: '#6366f1',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{html,ico,png,svg,webmanifest}'],
        // Не кэшируем JS и CSS в precache, используем runtime caching
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/_/, /\/[^/?]+\.[^/]+$/],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /\.(?:js|css)$/,
            handler: 'NetworkOnly', // Вообще не кэшируем JS и CSS
            options: {
              cacheName: `js-css-cache-v${packageJson.version}`,
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 год
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: false
      }
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version)
  }
})

