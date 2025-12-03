<template>
  <div class="home-view">
    <div class="header-logo">
      <AppLogo size="80px" />
    </div>
    
    <div v-if="store.loading" class="loading">Загрузка...</div>

    <div v-else-if="store.habits.length === 0" class="empty-state fade-in">
      <div class="empty-icon">📝</div>
      <h2>Нет привычек</h2>
      <p>Создайте свою первую привычку, чтобы начать отслеживать прогресс!</p>
      <button class="btn btn-primary" @click="showForm = true">
        Создать привычку
      </button>
    </div>

    <div v-else class="habits-container">
      <div class="habits-card">
        <h2 class="habits-title">Привычки</h2>
        <div class="habits-list">
          <div
            v-for="habit in store.habits"
            :key="habit.id"
            class="habit-item"
            :style="getHabitBorderStyle(habit)"
            @click="goToHabit(habit.id)"
          >
            <div class="habit-icon">{{ habit.icon || '🚫' }}</div>
            <div class="habit-name">{{ habit.name }}</div>
          </div>
        </div>
        <button class="btn-add-habit" @click="showForm = true">
          Добавить привычку
        </button>
      </div>
      
      <!-- Telegram настройки -->
      <TelegramSettings />
    </div>

    <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
      <div class="modal-content">
        <HabitForm
          @submit="handleSubmit"
          @cancel="closeForm"
        />
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import HabitForm from '@/components/HabitForm.vue'
import AppLogo from '@/components/AppLogo.vue'
import TelegramSettings from '@/components/TelegramSettings.vue'
import { useHabitsStore } from '@/stores/habitsStore'
import { getProjectColorStyles } from '@/utils/projectColors'
import type { Habit } from '@/types'

const router = useRouter()
const store = useHabitsStore()
const showForm = ref(false)

onMounted(async () => {
  await store.loadHabits()
})

function goToHabit(id: string) {
  router.push(`/habit/${id}`)
}

function getHabitBorderStyle(habit: Habit) {
  const colorStyles = getProjectColorStyles(habit.color || 'blue', habit.customColor)
  return {
    border: `2px solid ${colorStyles.border}`,
    boxShadow: `0 0 0 1px ${colorStyles.border}20`
  }
}

async function handleSubmit(data: {
  name: string
  character: Habit['character']
  notificationTime?: string
  notificationEnabled: boolean
  customNotificationMessage?: string
  color?: Habit['color']
  customColor?: string
  icon?: string
  additionalMotivation?: boolean
}) {
  await store.createHabit(
    data.name,
    data.character,
    data.notificationTime,
    data.color || 'blue',
    data.icon,
    data.additionalMotivation !== undefined ? data.additionalMotivation : true,
    data.customNotificationMessage,
    data.customColor
  )
  closeForm()
}

function closeForm() {
  showForm.value = false
}
</script>

<style scoped>
.home-view {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.header-logo {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 2rem;
  padding-top: 1rem;
  position: relative;
}

.settings-btn {
  position: absolute;
  right: 0;
  top: 1rem;
  background: #f3f4f6;
  border: 2px solid #e5e7eb;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.settings-btn:hover {
  background: #e5e7eb;
  transform: scale(1.1);
}

.btn-telegram-settings {
  width: 100%;
  margin-top: 0.75rem;
  padding: 0.875rem;
  background: #e0f2fe;
  color: #0369a1;
  border: 2px solid #bae6fd;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-telegram-settings:hover {
  background: #bae6fd;
  border-color: #7dd3fc;
  transform: translateY(-1px);
}

.telegram-icon {
  font-size: 1.25rem;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--bg-secondary);
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  color: var(--text-secondary);
  margin: 0 0 2rem 0;
}

.habits-container {
  display: flex;
  justify-content: center;
}

.habits-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;
}

.habits-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1.5rem 0;
}

.habits-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.habit-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.habit-item:hover {
  background-color: #f9fafb;
  transform: translateY(-1px);
}

.habit-icon {
  font-size: 1.5rem;
  width: 2rem;
  text-align: center;
}

.habit-name {
  flex: 1;
  font-size: 1rem;
  color: #1f2937;
  font-weight: 500;
}


.btn-add-habit {
  width: 100%;
  padding: 0.875rem;
  background: #e0f2fe;
  color: #0369a1;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-add-habit:hover {
  background: #bae6fd;
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

.btn-telegram-empty {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: #e0f2fe;
  color: #0369a1;
  border: 2px solid #bae6fd;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-left: auto;
  margin-right: auto;
}

.btn-telegram-empty:hover {
  background: #bae6fd;
  border-color: #7dd3fc;
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
  animation: fadeIn 0.2s ease-out;
}

.modal-content {
  background: var(--bg-secondary);
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  animation: fadeIn 0.3s ease-out;
  border: 1px solid var(--border-color);
}

.modal-actions {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
