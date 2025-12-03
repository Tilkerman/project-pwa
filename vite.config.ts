import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'
import packageJson from './package.json'

export default defineConfig({
  base: process.env.CI ? '/project-pwa/' : '/',
  build: {
    outDir: 'dist'
  },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // Импортируем кастомный скрипт для уведомлений
        importScripts: ['/sw-custom.js']
      },
      manifest: {
        name: 'Трекер Привычек',
        short_name: 'Привычки',
        description: 'Приложение для отслеживания привычек с персонажами-мотиваторами',
        theme_color: '#4f46e5',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // Импортируем кастомный скрипт для уведомлений
        importScripts: ['/sw-custom.js']
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

