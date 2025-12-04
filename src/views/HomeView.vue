<template>
  <div class="home-view">
    <!-- Логотип приложения - маленький, по центру -->
    <div class="header-logo">
      <AppLogo size="48px" />
    </div>
    
    <!-- Заголовок H1 -->
    <h1 class="main-title">Привет! Начнём новую привычку?</h1>
    
    <!-- Мини-онбординг подзаголовок -->
    <h2 class="subtitle">
      Создавайте привычки, отмечайте прогресс каждый день<br>
      и получайте уведомления в Telegram.
    </h2>
    
    <div v-if="store.loading" class="loading">Загрузка...</div>

    <!-- Блок привычек -->
    <div v-else class="habits-section">
      <div v-if="store.habits.length > 0" class="habits-list">
        <div
          v-for="habit in store.habits"
          :key="habit.id"
          class="habit-card"
          :class="{ 'habit-completed': isHabitCompletedToday(habit) }"
          :style="getHabitCardStyle(habit)"
          @click="goToHabit(habit.id)"
        >
          <div class="habit-content">
            <div class="habit-icon-large">{{ habit.icon || '🚫' }}</div>
            <div class="habit-name-text">{{ habit.name }}</div>
          </div>
          <div class="habit-status-indicator" :class="{ 'completed': isHabitCompletedToday(habit) }"></div>
        </div>
      </div>
      
      <!-- Кнопка добавления привычки - показываем всегда -->
      <button class="btn-add-habit" @click="showForm = true">
        <span class="add-icon">+</span>
        <span class="add-text">Создать новую привычку</span>
      </button>
    </div>
    
    <!-- Telegram настройки - уменьшенные отступы -->
    <TelegramSettings v-if="!store.loading" class="telegram-section" />
    
    <!-- Модальное окно формы -->
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

// Проверка, выполнена ли привычка сегодня
function isHabitCompletedToday(habit: Habit): boolean {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  return habit.markedDays.includes(todayStr)
}

// Стили для карточки привычки
function getHabitCardStyle(habit: Habit) {
  const colorStyles = getProjectColorStyles(habit.color || 'blue', habit.customColor)
  const isCompleted = isHabitCompletedToday(habit)
  
  if (isCompleted) {
    return {
      backgroundColor: '#f0fdf4', // светло-зеленый фон для выполненных
    }
  }
  
  // Преобразуем hex в rgba с прозрачностью
  const hex = colorStyles.bg.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  return {
    backgroundColor: `rgba(${r}, ${g}, ${b}, 0.08)`, // легкий фон цвета привычки
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
  padding: 1rem 1rem 2rem;
  min-height: 100vh;
}

/* Логотип - маленький, по центру, без больших отступов */
.header-logo {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 1rem;
  padding-top: 0.5rem;
}

/* Заголовок H1 - крупный, жирный, тёплый */
.main-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  text-align: center;
  margin: 0 0 0.75rem 0;
  line-height: 1.3;
  padding: 0 0.5rem;
}

/* Подзаголовок - маленький, серый, две строки, по центру */
.subtitle {
  font-size: 0.875rem;
  font-weight: 400;
  color: #6b7280;
  text-align: center;
  margin: 0 0 2rem 0;
  line-height: 1.5;
  padding: 0 1rem;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}

/* Секция привычек */
.habits-section {
  margin-bottom: 1.5rem;
}

.habits-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

/* Карточка привычки - улучшенная */
.habit-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  min-height: 64px;
  position: relative;
}

.habit-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.habit-card.habit-completed {
  background-color: #f0fdf4;
}

.habit-content {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  flex: 1;
}

/* Иконка привычки - увеличенная */
.habit-icon-large {
  font-size: 1.75rem;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Название привычки */
.habit-name-text {
  font-size: 1rem;
  color: #1f2937;
  font-weight: 600;
  line-height: 1.4;
}

/* Индикатор статуса - точка справа */
.habit-status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #d1d5db;
  flex-shrink: 0;
  margin-left: 0.5rem;
}

.habit-status-indicator.completed {
  background-color: #10b981;
}

/* Кнопка добавления привычки - переработанная */
.btn-add-habit {
  width: 100%;
  height: 56px;
  padding: 0;
  background: #E8F3FF;
  border: none;
  border-radius: 14px;
  font-size: 1rem;
  font-weight: 600;
  color: #2563eb;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.btn-add-habit:hover {
  background: #dbeafe;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.btn-add-habit:active {
  transform: translateY(0);
}

.add-icon {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1;
}

.add-text {
  font-size: 1rem;
  font-weight: 600;
}

/* Telegram секция - уменьшенные отступы */
.telegram-section {
  margin-top: 1.5rem;
}

/* Модальное окно */
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
  background: white;
  border-radius: 16px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  animation: fadeIn 0.3s ease-out;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
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

/* Адаптивность */
@media (max-width: 480px) {
  .main-title {
    font-size: 1.5rem;
  }
  
  .subtitle {
    font-size: 0.8125rem;
  }
  
  .habit-card {
    padding: 0.875rem 1rem;
    min-height: 60px;
  }
  
  .habit-icon-large {
    font-size: 1.5rem;
    width: 1.75rem;
    height: 1.75rem;
  }
  
  .btn-add-habit {
    height: 52px;
  }
}

@media (min-width: 600px) {
  .home-view {
    padding: 1.5rem 1.5rem 2rem;
  }
}
</style>
