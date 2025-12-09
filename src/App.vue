<template>
  <div id="app">
    <main class="main-content">
      <router-view />
    </main>
    <footer class="app-footer">
      © {{ currentYear }} Трекер Привычек · October · v{{ appVersion }}
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useHabitsStore } from './stores/habitsStore'
import { useThemeStore } from './stores/themeStore'
import { checkMissedNotifications } from './utils/notifications'

const store = useHabitsStore()
const themeStore = useThemeStore()
const currentYear = new Date().getFullYear()
const appVersion = __APP_VERSION__ ?? '1.0.0'

onMounted(async () => {
  try {
    themeStore.initTheme()
    await store.loadHabits()
    
    // Проверяем пропущенные уведомления при загрузке
    if (store.habits.length > 0) {
      try {
        await checkMissedNotifications(store.habits)
      } catch (error) {
        console.error('⚠️ Ошибка при проверке пропущенных уведомлений:', error)
      }
    }
    
    // Для iOS: проверяем пропущенные уведомления при открытии приложения
    try {
      const isIOSDevice = typeof navigator !== 'undefined' && 
                          (/iPad|iPhone|iPod/.test(navigator.userAgent) || 
                           (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1))
      if (isIOSDevice) {
      // Проверяем расписания из localStorage
      try {
        const schedulesStr = localStorage.getItem('ios_notification_schedules')
        if (!schedulesStr) return
        
        const schedules = JSON.parse(schedulesStr)
        if (!schedules || typeof schedules !== 'object') return
        
        const now = new Date()
        
        for (const [habitId, schedule] of Object.entries(schedules)) {
          try {
            // Проверяем, что schedule - это объект и имеет нужные поля
            if (!schedule || typeof schedule !== 'object') continue
            if (!schedule.enabled) continue
            if (!schedule.time || typeof schedule.time !== 'string') continue
            
            const timeParts = schedule.time.split(':')
            if (timeParts.length !== 2) continue
            
            const hours = parseInt(timeParts[0], 10)
            const minutes = parseInt(timeParts[1], 10)
            
            if (isNaN(hours) || isNaN(minutes)) continue
            
            const lastCheck = schedule.lastCheck ? new Date(schedule.lastCheck) : null
            
            // Если время уведомления было в последние 2 часа и мы его еще не показывали сегодня
            const notificationTime = new Date()
            notificationTime.setHours(hours, minutes, 0, 0)
            const timeDiff = now.getTime() - notificationTime.getTime()
            const twoHours = 2 * 60 * 60 * 1000
            
            if (timeDiff > 0 && timeDiff < twoHours) {
              const habit = store.habits.find(h => h.id === habitId)
              if (habit && (!lastCheck || lastCheck.toDateString() !== now.toDateString())) {
                try {
                  // Показываем пропущенное уведомление
                  const { showNotification } = await import('./utils/notifications')
                  await showNotification(habit)
                  // Обновляем время последней проверки
                  schedules[habitId].lastCheck = now.toISOString()
                  localStorage.setItem('ios_notification_schedules', JSON.stringify(schedules))
                } catch (error) {
                  console.error('⚠️ Ошибка при показе пропущенного уведомления:', error)
                }
              }
            }
          } catch (error) {
            console.error(`⚠️ Ошибка при обработке расписания для привычки ${habitId}:`, error)
            // Продолжаем обработку других привычек
            continue
          }
        }
      } catch (error) {
        console.error('⚠️ Ошибка при проверке пропущенных уведомлений на iOS:', error)
      }
      }
    } catch (error) {
      console.error('⚠️ Ошибка при проверке iOS устройства:', error)
    }
  } catch (error) {
    console.error('⚠️ Критическая ошибка при инициализации приложения:', error)
    // Не позволяем ошибке сломать всё приложение
  }
})
</script>

<style>
#app {
  min-height: 100vh;
  background: transparent;
  transition: background-color 0.3s ease;
  margin: 0;
  padding: 0;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
}

.main-content {
  min-height: calc(100vh - 60px);
  margin: 0;
  padding: 0;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
}

.app-footer {
  border-top: 1px solid var(--border-color);
  padding: 1rem 2rem;
  text-align: center;
  font-size: 0.875rem;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
}
</style>
