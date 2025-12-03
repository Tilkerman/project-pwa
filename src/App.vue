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
