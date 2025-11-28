<template>
  <div class="habit-detail-view">
    <div v-if="loading" class="loading">Загрузка...</div>
    
    <div v-else-if="!habit" class="not-found">
      <h2>Привычка не найдена</h2>
      <router-link to="/" class="btn btn-primary">Вернуться на главную</router-link>
    </div>

    <div v-else class="habit-content">
      <div class="header-section">
        <button class="back-btn" @click="$router.push('/')">← Назад</button>
        <div class="habit-header">
          <div class="character-icon-large">{{ characterIcon }}</div>
          <div class="habit-info">
            <h1>{{ habit.name }}</h1>
            <p class="character-name">{{ characterName }}</p>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" @click="showEditForm = true">
            Редактировать
          </button>
          <button class="btn btn-danger" @click="confirmDelete">
            Удалить
          </button>
        </div>
      </div>

      <div class="motivation-message fade-in">
        <div class="message-bubble">
          {{ motivationMessage }}
        </div>
      </div>

      <div class="stats-overview">
        <div class="stat-card">
          <div class="stat-value">{{ stats.totalDays }}</div>
          <div class="stat-label">Всего дней</div>
        </div>
        <div class="stat-card streak">
          <div class="stat-value">{{ stats.streak }}</div>
          <div class="stat-label">Дней подряд</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.successRate }}%</div>
          <div class="stat-label">Успешность</div>
        </div>
      </div>

      <div class="calendar-section">
        <CalendarView :habit="habit" />
      </div>

      <div class="tabs">
        <button
          class="tab"
          :class="{ active: activeTab === 'stats' }"
          @click="activeTab = 'stats'"
        >
          Статистика
        </button>
        <button
          class="tab"
          :class="{ active: activeTab === 'achievements' }"
          @click="activeTab = 'achievements'"
        >
          Достижения
        </button>
        <button
          class="tab"
          :class="{ active: activeTab === 'settings' }"
          @click="activeTab = 'settings'"
        >
          Настройки
        </button>
      </div>

      <div class="tab-content">
        <div v-if="activeTab === 'stats'" class="stats-tab">
          <StatsChart :habit="habit" title="Прогресс за последние 30 дней" :days="30" />
        </div>

        <div v-if="activeTab === 'achievements'" class="achievements-tab">
          <div class="achievements-grid">
            <AchievementBadge
              v-for="achievement in store.allAchievements"
              :key="achievement.id"
              :achievement="achievement"
              :habit="habit"
            />
          </div>
        </div>

        <div v-if="activeTab === 'settings'" class="settings-tab">
          <NotificationSettings
            :enabled="habit.notificationEnabled"
            :time="habit.notificationTime"
            @update:enabled="updateNotificationEnabled"
            @update:time="updateNotificationTime"
          />
        </div>
      </div>
    </div>

    <div v-if="showEditForm" class="modal-overlay" @click.self="showEditForm = false">
      <div class="modal-content">
        <HabitForm
          :habit="habit"
          @submit="handleUpdate"
          @cancel="showEditForm = false"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CalendarView from '@/components/CalendarView.vue'
import StatsChart from '@/components/StatsChart.vue'
import AchievementBadge from '@/components/AchievementBadge.vue'
import NotificationSettings from '@/components/NotificationSettings.vue'
import HabitForm from '@/components/HabitForm.vue'
import { useHabitsStore } from '@/stores/habitsStore'
import { characters } from '@/utils/characters'

const route = useRoute()
const router = useRouter()
const store = useHabitsStore()

const loading = ref(true)
const activeTab = ref<'stats' | 'achievements' | 'settings'>('stats')
const showEditForm = ref(false)

const habit = computed(() => {
  const id = route.params.id as string
  return store.getHabitById(id)
})

const characterIcon = computed(() => {
  if (!habit.value) return ''
  return characters[habit.value.character].icon
})

const characterName = computed(() => {
  if (!habit.value) return ''
  return characters[habit.value.character].name
})

const stats = computed(() => {
  if (!habit.value) return { totalDays: 0, streak: 0, successRate: 0, daysSinceCreation: 0 }
  return store.getHabitStats(habit.value)
})

const motivationMessage = computed(() => {
  if (!habit.value) return ''
  return store.getCharacterMessageForHabit(habit.value, 'daily')
})

onMounted(async () => {
  await store.loadHabits()
  loading.value = false
})

async function handleUpdate(data: {
  name: string
  character: 'babushka' | 'gopnik'
  notificationTime?: string
  notificationEnabled: boolean
}) {
  if (!habit.value) return

  habit.value.name = data.name
  habit.value.character = data.character
  habit.value.notificationTime = data.notificationTime
  habit.value.notificationEnabled = data.notificationEnabled

  await store.updateHabit(habit.value)
  showEditForm.value = false
}

async function updateNotificationEnabled(enabled: boolean) {
  if (!habit.value) return
  habit.value.notificationEnabled = enabled
  await store.updateHabit(habit.value)
}

async function updateNotificationTime(time: string) {
  if (!habit.value) return
  habit.value.notificationTime = time
  await store.updateHabit(habit.value)
}

async function confirmDelete() {
  if (!habit.value) return
  if (confirm('Вы уверены, что хотите удалить эту привычку?')) {
    await store.removeHabit(habit.value.id)
    router.push('/')
  }
}
</script>

<style scoped>
.habit-detail-view {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.loading,
.not-found {
  text-align: center;
  padding: 3rem;
}

.header-section {
  margin-bottom: 2rem;
}

.back-btn {
  background: none;
  border: none;
  color: #4f46e5;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem 0;
  margin-bottom: 1rem;
  transition: color 0.2s;
}

.back-btn:hover {
  color: #4338ca;
}

.habit-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.character-icon-large {
  font-size: 4rem;
  line-height: 1;
}

.habit-info h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
}

.character-name {
  margin: 0.5rem 0 0 0;
  font-size: 1rem;
  color: var(--text-secondary);
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.motivation-message {
  margin-bottom: 2rem;
}

.message-bubble {
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  border-left: 4px solid #4f46e5;
  border-radius: 12px;
  padding: 1.5rem;
  font-size: 1.125rem;
  color: var(--text-primary);
  line-height: 1.6;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

@media (max-width: 480px) {
  .stats-overview {
    grid-template-columns: 1fr;
  }
  
  .header-actions {
    flex-direction: column;
  }
  
  .habit-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}

.stat-card {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: var(--shadow-sm);
}

.stat-card.streak {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #4f46e5;
  margin-bottom: 0.5rem;
}

.stat-card.streak .stat-value {
  color: #f59e0b;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.calendar-section {
  margin-bottom: 2rem;
}

.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #e5e7eb;
}

.tab {
  background: none;
  border: none;
  padding: 1rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
  transition: all 0.2s;
}

.tab:hover {
  color: #4f46e5;
}

.tab.active {
  color: #4f46e5;
  border-bottom-color: #4f46e5;
}

.tab-content {
  min-height: 300px;
}

.achievements-grid {
  display: grid;
  gap: 1rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: var(--bg-secondary);
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #4f46e5;
  color: white;
}

.btn-primary:hover {
  background: #4338ca;
}

.btn-secondary {
  background: #f3f4f6;
  color: var(--text-primary);
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}
</style>

