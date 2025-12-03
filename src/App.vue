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
  themeStore.initTheme()
  await store.loadHabits()
  
  // Проверяем пропущенные уведомления при загрузке
  if (store.habits.length > 0) {
    await checkMissedNotifications(store.habits)
  }
  
  // Для iOS: проверяем пропущенные уведомления при открытии приложения
  if (/iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    // Проверяем расписания из localStorage
    try {
      const schedules = JSON.parse(localStorage.getItem('ios_notification_schedules') || '{}')
      const now = new Date()
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()
      
      for (const [habitId, schedule] of Object.entries(schedules)) {
        if (!schedule.enabled) continue
        
        const [hours, minutes] = schedule.time.split(':').map(Number)
        const lastCheck = schedule.lastCheck ? new Date(schedule.lastCheck) : null
        
        // Если время уведомления было в последние 2 часа и мы его еще не показывали сегодня
        const notificationTime = new Date()
        notificationTime.setHours(hours, minutes, 0, 0)
        const timeDiff = now.getTime() - notificationTime.getTime()
        const twoHours = 2 * 60 * 60 * 1000
        
        if (timeDiff > 0 && timeDiff < twoHours) {
          const habit = store.habits.find(h => h.id === habitId)
          if (habit && (!lastCheck || lastCheck.toDateString() !== now.toDateString())) {
            // Показываем пропущенное уведомление
            const { showNotification } = await import('./utils/notifications')
            await showNotification(habit)
            // Обновляем время последней проверки
            schedules[habitId].lastCheck = now.toISOString()
            localStorage.setItem('ios_notification_schedules', JSON.stringify(schedules))
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Ошибка при проверке пропущенных уведомлений на iOS:', error)
    }
  }
})
</script>

<style>
#app {
  min-height: 100vh;
  background: var(--bg-primary);
  transition: background-color 0.3s ease;
}

.main-content {
  min-height: calc(100vh - 60px);
}

.app-footer {
  border-top: 1px solid var(--border-color);
  padding: 1rem 2rem;
  text-align: center;
  font-size: 0.875rem;
  color: var(--text-secondary);
  background: var(--bg-secondary);
}
</style>
