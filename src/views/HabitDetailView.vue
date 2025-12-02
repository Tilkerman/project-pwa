<template>
  <div
    class="habit-detail-view"
    :style="{ backgroundColor: projectColorStyles.bg, color: projectColorStyles.text }"
  >
    <div v-if="loading" class="loading">Загрузка...</div>
    
    <div v-else-if="!habit" class="not-found">
      <h2>Привычка не найдена</h2>
      <router-link to="/" class="btn btn-primary">Вернуться на главную</router-link>
    </div>

    <div v-else class="habit-content">
      <div class="header-section">
        <button class="back-btn" @click="$router.push('/')">
          ← Назад
        </button>
        <div class="header-top">
          <div class="header-center">bot</div>
          <div class="header-profile">👤</div>
        </div>
      </div>

      <div class="main-section">
        <div class="arrow-up">↑</div>
        <h1 class="habit-title">{{ habit.name }}</h1>
        <p class="habit-days">уже {{ stats.totalDays }} дней</p>

        <div class="calendar-section">
          <CalendarView :habit="habit" :project-color="habit.color || 'blue'" />
        </div>
      </div>

      <div class="footer-section">
        <div class="settings-link" @click="showSettings = true">настройки</div>
        <div class="arrow-down">↓</div>
        <div class="message-input-container">
          <input
            v-model="messageText"
            type="text"
            placeholder="Напишите сооб...."
            class="message-input"
            @keyup.enter="sendMessage"
          />
          <button class="attach-btn">📎</button>
          <button class="send-btn" @click="sendMessage">➤</button>
        </div>
      </div>
    </div>

    <div v-if="showSettings" class="settings-modal" @click.self="showSettings = false">
      <div class="settings-content">
        <HabitForm
          :habit="habit"
          @submit="handleUpdate"
          @cancel="showSettings = false"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CalendarView from '@/components/CalendarView.vue'
import HabitForm from '@/components/HabitForm.vue'
import { useHabitsStore } from '@/stores/habitsStore'
import { getProjectColorStyles } from '@/utils/projectColors'
import type { Habit } from '@/types'

const route = useRoute()
const router = useRouter()
const store = useHabitsStore()

const loading = ref(true)
const showSettings = ref(false)
const messageText = ref('')

const habit = computed(() => {
  const id = route.params.id as string
  return store.getHabitById(id)
})

const stats = computed(() => {
  if (!habit.value) return { totalDays: 0, streak: 0, successRate: 0, daysSinceCreation: 0 }
  return store.getHabitStats(habit.value)
})

const projectColorStyles = computed(() => {
  return getProjectColorStyles(habit.value?.color || 'blue')
})

onMounted(async () => {
  await store.loadHabits()
  loading.value = false
})

async function handleUpdate(data: {
  name: string
  character: Habit['character']
  notificationTime?: string
  notificationEnabled: boolean
  color?: Habit['color']
  icon?: string
  additionalMotivation?: boolean
}) {
  if (!habit.value) return

  habit.value.name = data.name
  habit.value.character = data.character
  habit.value.notificationTime = data.notificationTime
  habit.value.notificationEnabled = data.notificationEnabled
  habit.value.color = data.color
  habit.value.icon = data.icon
  habit.value.additionalMotivation = data.additionalMotivation

  await store.updateHabit(habit.value)
  showSettings.value = false
}

function sendMessage() {
  if (messageText.value.trim()) {
    // Здесь можно добавить логику отправки сообщения
    console.log('Message:', messageText.value)
    messageText.value = ''
  }
}
</script>

<style scoped>
.habit-detail-view {
  min-height: 100vh;
  padding: 0;
  position: relative;
  transition: background-color 0.3s ease;
}

.loading,
.not-found {
  text-align: center;
  padding: 3rem;
}

.header-section {
  padding: 1rem;
}

.back-btn {
  background: none;
  border: none;
  color: inherit;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem 0;
  margin-bottom: 0.5rem;
  opacity: 0.9;
}

.back-btn:hover {
  opacity: 1;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
}

.header-center {
  font-size: 0.875rem;
  opacity: 0.8;
}

.header-profile {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.main-section {
  padding: 2rem 1rem;
  text-align: center;
}

.arrow-up {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  opacity: 0.6;
}

.habit-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  text-transform: uppercase;
}

.habit-days {
  font-size: 1rem;
  opacity: 0.9;
  margin-bottom: 2rem;
}

.calendar-section {
  margin-top: 2rem;
}

.footer-section {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1rem;
  background: inherit;
}

.settings-link {
  text-align: center;
  font-size: 0.875rem;
  opacity: 0.8;
  margin-bottom: 0.5rem;
  cursor: pointer;
}

.arrow-down {
  text-align: center;
  font-size: 1.5rem;
  opacity: 0.6;
  margin-bottom: 0.5rem;
}

.message-input-container {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 0.5rem 1rem;
}

.message-input {
  flex: 1;
  background: transparent;
  border: none;
  color: inherit;
  font-size: 1rem;
  outline: none;
}

.message-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.attach-btn,
.send-btn {
  background: none;
  border: none;
  color: inherit;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem;
  opacity: 0.8;
}

.attach-btn:hover,
.send-btn:hover {
  opacity: 1;
}

.settings-modal {
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

.settings-content {
  background: white;
  border-radius: 16px;
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
</style>
