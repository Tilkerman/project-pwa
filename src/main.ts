import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)

// Глобальная обработка ошибок для предотвращения белого экрана
app.config.errorHandler = (err, instance, info) => {
  console.error('⚠️ Глобальная ошибка Vue:', err, info)
  // Не позволяем ошибке сломать всё приложение
}

// Обработка необработанных ошибок
window.addEventListener('error', (event) => {
  console.error('⚠️ Необработанная ошибка:', event.error)
  // Предотвращаем показ белого экрана
  event.preventDefault()
})

// Обработка необработанных промисов
window.addEventListener('unhandledrejection', (event) => {
  console.error('⚠️ Необработанное отклонение промиса:', event.reason)
  // Предотвращаем показ белого экрана
  event.preventDefault()
})

app.use(createPinia())
app.use(router)

app.mount('#app')

// Регистрируем периодическую проверку уведомлений в Service Worker
if ('serviceWorker' in navigator) {
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

