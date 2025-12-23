<template>
  <div class="notification-settings-view">
    <header class="page-header">
      <button class="back-btn" @click="goBack" :aria-label="t('settings.back')">
        <span class="back-icon">←</span>
      </button>
      <h1 class="page-title">{{ t('settings.notifications.title') }}</h1>
      <div style="width: 40px;"></div> <!-- Spacer для выравнивания -->
    </header>

    <div class="settings-content">
      <!-- Настройки Telegram -->
      <div class="settings-section">
        <TelegramSettings :key="locale" />
      </div>

      <!-- Настройки уведомлений для каждой привычки -->
      <div class="settings-section">
        <h3 class="section-title">{{ t('settings.notifications.habitsNotifications') }}</h3>
        <p class="section-description">
          {{ t('settings.notifications.habitsNotificationsDesc') }}
        </p>

        <div v-if="loading" class="loading">
          {{ t('common.loading') }}
        </div>

        <div v-else-if="habits.length === 0" class="empty">
          {{ t('settings.notifications.noHabits') }}
        </div>

        <div v-else class="habits-list">
          <div v-for="habit in habits" :key="habit.id" class="habit-card">
            <div class="habit-header">
              <div class="habit-title">
                <span class="habit-icon">{{ habit.icon || '🚫' }}</span>
                <span class="habit-name">{{ habit.name }}</span>
              </div>
            </div>

            <NotificationSettings
              :enabled="habit.notificationEnabled"
              :time="habit.notificationTime"
              @update:enabled="(v) => updateHabitNotifications(habit.id, v, habit.notificationTime)"
              @update:time="(v) => updateHabitNotifications(habit.id, true, v)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from '@/composables/useI18n'
import TelegramSettings from '@/components/TelegramSettings.vue'
import NotificationSettings from '@/components/NotificationSettings.vue'
import { useHabitsStore } from '@/stores/habitsStore'
import type { Habit } from '@/types'

const router = useRouter()
const { t, locale } = useI18n()
const store = useHabitsStore()
const loading = ref(true)

const habits = computed(() => store.habits)

onMounted(async () => {
  try {
    await store.loadHabits()
  } finally {
    loading.value = false
  }
})

function goBack() {
  router.push('/settings')
}

async function updateHabitNotifications(habitId: string, enabled: boolean, time?: string) {
  const habit = store.getHabitById(habitId)
  if (!habit) return

  const nextTime = enabled ? (time || habit.notificationTime || '09:00') : undefined

  const updated: Habit = {
    ...habit,
    notificationEnabled: enabled,
    notificationTime: nextTime,
  }

  await store.updateHabit(updated)
}
</script>

<style scoped>
.notification-settings-view {
  min-height: 100vh;
  background: var(--bg-primary);
  padding-bottom: 2rem;
  padding-top: 60px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.back-btn {
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  transition: background 0.2s;
}

.back-btn:hover {
  background: var(--bg-hover);
}

.back-icon {
  font-size: 1.5rem;
  color: var(--text-primary);
}

.page-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.settings-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 1.5rem;
}

.settings-section {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.section-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

.loading,
.empty {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.habits-list {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.habit-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1rem;
}

.habit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.habit-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.habit-icon {
  font-size: 1.25rem;
}

.habit-name {
  font-weight: 600;
  color: var(--text-primary);
}
</style>

