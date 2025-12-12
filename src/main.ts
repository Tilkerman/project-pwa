import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import './style.css'
import { initTelegramMiniApp } from './utils/telegramMiniApp'

// Инициализация Telegram Mini App (если запущено в Telegram)
const telegramApp = initTelegramMiniApp()
if (telegramApp) {
  console.log('📱 Telegram Mini App активен')
  console.log('👤 Пользователь:', telegramApp.user)
  console.log('🎨 Тема:', telegramApp.theme)
  
  // Автоматически сохраняем chat_id для уведомлений
  import('./utils/telegram').then(({ autoSaveTelegramChatId }) => {
    try {
      autoSaveTelegramChatId()
    } catch (error) {
      console.warn('⚠️ Не удалось автоматически сохранить chat_id:', error)
    }
  }).catch((error) => {
    console.warn('⚠️ Не удалось загрузить модуль telegram:', error)
  })
}

const app = createApp(App)

app.use(i18n)

// Глобальная обработка ошибок для предотвращения белого экрана
app.config.errorHandler = (err, instance, info) => {
  console.error('⚠️ Глобальная ошибка Vue:', err, info)
  // Показываем ошибку пользователю
  const errorDiv = document.createElement('div')
  errorDiv.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: #fee2e2; color: #991b1b; padding: 1rem; z-index: 10000; text-align: center;'
  errorDiv.textContent = 'Произошла ошибка. Пожалуйста, обновите страницу.'
  document.body.appendChild(errorDiv)
  setTimeout(() => errorDiv.remove(), 5000)
}

// Обработка необработанных ошибок
window.addEventListener('error', (event) => {
  console.error('⚠️ Необработанная ошибка:', event.error, event.filename, event.lineno)
  // Показываем ошибку пользователю
  const errorDiv = document.createElement('div')
  errorDiv.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: #fee2e2; color: #991b1b; padding: 1rem; z-index: 10000; text-align: center;'
  errorDiv.textContent = 'Ошибка загрузки. Пожалуйста, обновите страницу.'
  document.body.appendChild(errorDiv)
  setTimeout(() => errorDiv.remove(), 5000)
})

// Обработка необработанных промисов
window.addEventListener('unhandledrejection', (event) => {
  console.error('⚠️ Необработанное отклонение промиса:', event.reason)
  // Показываем ошибку пользователю
  const errorDiv = document.createElement('div')
  errorDiv.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: #fee2e2; color: #991b1b; padding: 1rem; z-index: 10000; text-align: center;'
  errorDiv.textContent = 'Ошибка загрузки данных. Пожалуйста, обновите страницу.'
  document.body.appendChild(errorDiv)
  setTimeout(() => errorDiv.remove(), 5000)
})

app.use(createPinia())
app.use(router)

app.mount('#app')

// Регистрируем периодическую проверку уведомлений в Service Worker и принудительное обновление
if ('serviceWorker' in navigator) {
  const APP_VERSION = __APP_VERSION__ || '1.0.0'
  const CACHE_VERSION_KEY = 'app-cache-version'
  const storedVersion = localStorage.getItem(CACHE_VERSION_KEY)
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  
  // Очищаем кэш только если версия изменилась
  if (storedVersion !== APP_VERSION) {
    console.log(`🔄 Обнаружена новая версия: ${APP_VERSION} (было: ${storedVersion})`)
    
    // Удаляем все Service Workers
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      return Promise.all(registrations.map((reg) => reg.unregister()))
    }).then(() => {
      // Очищаем все кэши
      return caches.keys()
    }).then((cacheNames) => {
      return Promise.all(cacheNames.map((name) => caches.delete(name)))
    }).then(() => {
      console.log('✅ Кэши очищены')
      localStorage.setItem(CACHE_VERSION_KEY, APP_VERSION)
      // Перезагружаем только если версия изменилась
      setTimeout(() => {
        window.location.reload(true)
      }, 1000)
    }).catch((err) => {
      console.error('Ошибка очистки:', err)
    })
  } else {
    // На десктопе обычная логика обновления
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration) {
        setInterval(() => registration.update(), 30000)
        window.addEventListener('focus', () => registration.update())
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                localStorage.setItem(CACHE_VERSION_KEY, APP_VERSION)
                window.location.reload()
              }
            })
          }
        })
      }
    })
  }
  
  // Запускаем сразу при загрузке
  navigator.serviceWorker.ready.then(async (registration) => {
    try {
      // Запускаем периодическую проверку уведомлений
      if (registration.active) {
        registration.active.postMessage({ type: 'START_PERIODIC_CHECK' })
      }
      
      // Пытаемся зарегистрировать Periodic Background Sync для работы в фоне
      // @ts-ignore
      if ('PeriodicBackgroundSync' in window && registration.periodicSync) {
        try {
          // @ts-ignore
          await registration.periodicSync.register('check-notifications', {
            minInterval: 60 * 1000
          })
          console.log('✅ Periodic Background Sync зарегистрирован')
        } catch (error) {
          console.log('ℹ️ Periodic Background Sync недоступен, используется альтернативный метод')
        }
      }
    } catch (error) {
      console.warn('⚠️ Ошибка при запуске периодической проверки уведомлений:', error)
    }
  })
  
  // Также запускаем при событии load (на случай, если Service Worker еще не готов)
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      if (registration.active) {
        registration.active.postMessage({ type: 'START_PERIODIC_CHECK' })
      }
    } catch (error) {
      console.warn('⚠️ Ошибка при запуске периодической проверки уведомлений:', error)
    }
  })
}

