import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import packageJson from './package.json'

// Определяем base путь
const getBase = () => process.env.CI ? '/project-pwa' : ''

// Плагин для добавления iOS мета-тегов
const iosMetaTagsPlugin = () => {
  const base = getBase()
  const basePath = base ? `${base}/` : '/'
  return {
    name: 'ios-meta-tags',
    transformIndexHtml(html: string) {
      let result = html
      
      // Проверяем, есть ли уже iOS мета-теги
      if (!result.includes('apple-mobile-web-app-capable')) {
        // Добавляем iOS мета-теги перед закрывающим тегом </head>
        // Используем относительный путь - Vite сам добавит base path
        const iosTags = `
    <!-- iOS PWA мета-теги -->
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Привычки" />
    <link rel="apple-touch-icon" href="/pwa-192x192.png" />
    `
        result = result.replace('</head>', `${iosTags}</head>`)
      }
      
      return result
    }
  }
}

// Плагин для исправления путей в собранных файлах
const fixPathsPlugin = () => {
  const base = getBase()
  const basePath = base ? `${base}/` : '/'
  return {
    name: 'fix-paths',
    writeBundle() {
      if (!base) return
      
      const distPath = resolve(__dirname, 'dist')
      
      // Исправляем manifest.webmanifest
      const manifestPath = join(distPath, 'manifest.webmanifest')
      if (existsSync(manifestPath)) {
        let manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
        manifest.start_url = basePath
        manifest.scope = basePath
        // Исправляем пути к иконкам в манифесте (убираем двойной base если есть)
        if (manifest.icons) {
          manifest.icons = manifest.icons.map((icon: any) => {
            let src = icon.src
            // Если путь уже начинается с base path, оставляем как есть
            if (src.startsWith(basePath)) {
              return icon
            }
            // Если путь начинается с /, убираем / и добавляем base path
            if (src.startsWith('/')) {
              src = `${basePath}${src.slice(1)}`
            } else {
              src = `${basePath}${src}`
            }
            return { ...icon, src }
          })
        }
        writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
      }
      
      // Исправляем registerSW.js
      const registerSWPath = join(distPath, 'registerSW.js')
      if (existsSync(registerSWPath)) {
        let content = readFileSync(registerSWPath, 'utf-8')
        // Исправляем путь к service worker и scope
        content = content.replace(
          /register\('\/sw\.js',\s*\{\s*scope:\s*'\/'\s*\}\)/g,
          `register('${basePath}sw.js', { scope: '${basePath}' })`
        )
        // Также исправляем другие варианты регистрации
        content = content.replace(
          /register\(['"]\/sw\.js['"]/g,
          `register('${basePath}sw.js'`
        )
        content = content.replace(
          /scope:\s*['"]\/['"]/g,
          `scope: '${basePath}'`
        )
        writeFileSync(registerSWPath, content)
      }
      
      // Исправляем index.html - убираем двойные base path
      const indexPath = join(distPath, 'index.html')
      if (existsSync(indexPath)) {
        let html = readFileSync(indexPath, 'utf-8')
        if (base) {
          // Убираем двойные base path (если есть /project-pwa/project-pwa/ заменяем на /project-pwa/)
          const doubleBase = `${basePath}${base}/`
          html = html.replace(new RegExp(doubleBase.replace(/\//g, '\\/'), 'g'), basePath)
        }
        writeFileSync(indexPath, html)
      }
      
      // Исправляем service worker (sw.js) если там есть пути
      const swPath = join(distPath, 'sw.js')
      if (existsSync(swPath)) {
        let swContent = readFileSync(swPath, 'utf-8')
        // Исправляем пути в precacheAndRoute - заменяем все относительные пути на пути с base
        // Ищем паттерны вида {url:"path",revision:"..."} или {url:"path",revision:null}
        // Используем более точный regex для минифицированного кода
        swContent = swContent.replace(/\{url:"([^"]+)",revision:([^}]+)\}/g, (match, url, revisionPart) => {
          // Пропускаем внешние ссылки, уже исправленные пути и пути к workbox модулям
          if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith(basePath) || url.startsWith('./workbox-')) {
            return match
          }
          // Добавляем base path к относительным путям (убираем начальный / если есть)
          const cleanUrl = url.startsWith('/') ? url.slice(1) : url
          const fixedUrl = `${basePath}${cleanUrl}`
          return `{url:"${fixedUrl}",revision:${revisionPart}}`
        })
        // Исправляем createHandlerBoundToURL - ищем паттерны вида createHandlerBoundToURL("/path")
        swContent = swContent.replace(/createHandlerBoundToURL\("(\/[^"]+)"\)/g, (match, path) => {
          if (path.startsWith(basePath)) {
            return match
          }
          return `createHandlerBoundToURL("${basePath}${path.slice(1)}")`
        })
        writeFileSync(swPath, swContent)
      }
    }
  }
}

export default defineConfig({
  base: process.env.CI ? '/project-pwa/' : '/',
  build: {
    outDir: 'dist'
  },
  plugins: [
    vue(),
    iosMetaTagsPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'pwa-192x192.png', 'pwa-512x512.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        navigateFallback: process.env.CI ? '/project-pwa/index.html' : '/index.html'
      },
      manifest: {
        name: 'Трекер Привычек',
        short_name: 'Привычки',
        description: 'Приложение для отслеживания привычек с персонажами-мотиваторами',
        theme_color: '#4f46e5',
        background_color: '#ffffff',
        display: 'standalone',
        lang: 'ru',
        orientation: 'portrait',
        start_url: process.env.CI ? '/project-pwa/' : '/',
        scope: process.env.CI ? '/project-pwa/' : '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      devOptions: {
        enabled: false
      },
      injectRegister: 'script'
    }),
    fixPathsPlugin()
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

