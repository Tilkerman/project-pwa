<template>
  <div
    class="habit-detail-view"
    :style="{ 
      backgroundColor: projectColorStyles.bg, 
      color: textColor,
      '--text-color': textColor,
      '--is-light': isLightBackground ? '1' : '0'
    }"
  >
    <div v-if="loading" class="loading">Загрузка...</div>
    
    <div v-else-if="!habit" class="not-found">
      <h2>Привычка не найдена</h2>
      <router-link to="/" class="btn btn-primary">Вернуться на главную</router-link>
    </div>

    <div 
      v-else 
      class="habit-content"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    >
      <div class="header-section">
        <button class="back-btn" @click="$router.push('/')">
          <span class="back-icon">←</span>
          <span class="back-text">Назад</span>
        </button>
      </div>

      <div class="main-section">
        <button 
          class="arrow-up" 
          :style="getArrowButtonStyle()"
          @click="navigateToPreviousHabit"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 19V5M5 12l7-7 7 7"/>
          </svg>
        </button>
        <h1 class="habit-title">{{ habit.name }}</h1>
        <p class="habit-days">уже {{ stats.totalDays }} дней</p>

        <div class="calendar-section">
          <CalendarView 
            :habit="habit" 
            :project-color="habit.color || 'blue'"
            :text-color="textColor"
            :is-light-background="isLightBackground"
          />
        </div>
      </div>

      <div class="footer-section">
        <button 
          class="habit-settings-btn" 
          :style="getSettingsButtonStyle()"
          @click="showSettings = true"
        >
          <span class="settings-icon">⚙️</span>
          <span class="settings-text">Настройки</span>
        </button>
        <button 
          class="arrow-down" 
          :style="getArrowButtonStyle()"
          @click="navigateToNextHabit"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M19 12l-7 7-7-7"/>
          </svg>
        </button>
      </div>
    </div>

    <div v-if="showSettings" class="settings-modal" @click.self="closeSettings">
      <div class="settings-content" @click.stop>
        <HabitForm
          :key="habit?.id || 'new'"
          :habit="habit"
          @submit="handleUpdate"
          @cancel="closeSettings"
          @delete="handleDelete"
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
import { getProjectColorStyles, calculateLuminance } from '@/utils/projectColors'
import type { Habit } from '@/types'

const route = useRoute()
const router = useRouter()
const store = useHabitsStore()

const loading = ref(true)
const showSettings = ref(false)

// Для обработки свайпов
const touchStartY = ref(0)
const touchStartX = ref(0)
const touchEndY = ref(0)
const touchEndX = ref(0)
const touchStartTime = ref(0)
const minSwipeDistance = 50 // Минимальное расстояние для свайпа
const maxSwipeTime = 300 // Максимальное время для свайпа (мс)

const habit = computed(() => {
  const id = route.params.id as string
  return store.getHabitById(id)
})

const allHabits = computed(() => store.habits)

function handleTouchStart(e: TouchEvent) {
  // Сохраняем начальную позицию и время для всех касаний
  touchStartY.value = e.touches[0].clientY
  touchStartX.value = e.touches[0].clientX
  touchStartTime.value = Date.now()
}

function handleTouchMove(e: TouchEvent) {
  // Не предотвращаем скролл - пусть календарь скроллится нормально
  // Только отслеживаем движение для определения свайпа
}

function handleTouchEnd(e: TouchEvent) {
  const target = e.target as HTMLElement
  
  // Проверяем, не был ли это клик по кнопке или ссылке
  if (target.closest('button') || target.closest('a') || target.closest('.settings-link')) {
    // Если это был клик по интерактивному элементу, игнорируем свайп
    touchStartY.value = 0
    touchEndY.value = 0
    return
  }
  
  touchEndY.value = e.changedTouches[0].clientY
  touchEndX.value = e.changedTouches[0].clientX
  const touchEndTime = Date.now()
  const touchDuration = touchEndTime - touchStartTime.value
  
  // Проверяем, что это был быстрый жест (не долгое удержание)
  if (touchDuration > maxSwipeTime) {
    touchStartY.value = 0
    touchEndY.value = 0
    return
  }
  
  handleSwipe()
}

function handleSwipe() {
  if (touchStartY.value === 0) return
  
  const distanceY = touchStartY.value - touchEndY.value
  const distanceX = Math.abs(touchStartX.value - touchEndX.value)
  
  // Проверяем, что это вертикальный свайп (вертикальное движение больше горизонтального)
  if (Math.abs(distanceY) < minSwipeDistance || Math.abs(distanceY) < distanceX) {
    touchStartY.value = 0
    touchEndY.value = 0
    return
  }
  
  // Свайп вверх (палец движется вверх, touchStartY > touchEndY) - следующая привычка
  // Свайп вниз (палец движется вниз, touchStartY < touchEndY) - предыдущая привычка
  if (distanceY > 0) {
    // Свайп вверх - следующая привычка
    navigateToNextHabit()
  } else {
    // Свайп вниз - предыдущая привычка
    navigateToPreviousHabit()
  }
  
  // Сбрасываем значения
  touchStartY.value = 0
  touchEndY.value = 0
}

function navigateToPreviousHabit() {
  if (allHabits.value.length === 0 || !habit.value) return
  
  const currentIndex = allHabits.value.findIndex(h => h.id === habit.value!.id)
  if (currentIndex === -1) return
  
  // Переходим к предыдущей привычке, если достигли начала - переходим к последней (циклически)
  const previousIndex = currentIndex === 0 ? allHabits.value.length - 1 : currentIndex - 1
  const previousHabit = allHabits.value[previousIndex]
  
  router.push(`/habit/${previousHabit.id}`)
}

function navigateToNextHabit() {
  if (allHabits.value.length === 0 || !habit.value) return
  
  const currentIndex = allHabits.value.findIndex(h => h.id === habit.value!.id)
  if (currentIndex === -1) return
  
  // Переходим к следующей привычке, если достигли конца - переходим к первой (циклически)
  const nextIndex = currentIndex === allHabits.value.length - 1 ? 0 : currentIndex + 1
  const nextHabit = allHabits.value[nextIndex]
  
  router.push(`/habit/${nextHabit.id}`)
}

const stats = computed(() => {
  if (!habit.value) return { totalDays: 0, streak: 0, successRate: 0, daysSinceCreation: 0 }
  return store.getHabitStats(habit.value)
})

const projectColorStyles = computed(() => {
  return getProjectColorStyles(habit.value?.color || 'blue', habit.value?.customColor)
})

// Вычисляем цвет текста на основе контрастности фона
const textColor = computed(() => {
  return projectColorStyles.value.text
})

// Определяем, является ли фон светлым
const isLightBackground = computed(() => {
  const bg = projectColorStyles.value.bg.toLowerCase().replace('#', '')
  // Проверяем на белый или очень светлый цвет
  if (bg === 'ffffff' || bg === 'fff' || bg === 'f7f7f7') return true
  // Используем luminance для определения
  return calculateLuminance(projectColorStyles.value.bg) > 0.6
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
  customNotificationMessage?: string
  color?: Habit['color']
  customColor?: string
  icon?: string
  additionalMotivation?: boolean
}) {
  console.log('handleUpdate called with data:', data)
  
  if (!habit.value) {
    console.error('habit.value is null')
    return
  }

  try {
    // Получаем актуальную привычку из store и создаем обновленную копию
    const currentHabit = store.getHabitById(habit.value.id)
    if (!currentHabit) {
      console.error('Habit not found in store')
      return
    }

    console.log('Current habit:', currentHabit)

    const updatedHabit: Habit = {
      ...currentHabit,
      name: data.name.trim(),
      character: data.character,
      notificationTime: data.notificationEnabled ? (data.notificationTime || '09:00') : undefined,
      notificationEnabled: data.notificationEnabled,
      customNotificationMessage: data.customNotificationMessage,
      color: data.color || 'blue',
      customColor: data.customColor,
      icon: data.icon || '🚫',
      additionalMotivation: data.additionalMotivation !== undefined ? data.additionalMotivation : true
    }

    console.log('Updated habit:', updatedHabit)

    await store.updateHabit(updatedHabit)
    console.log('Habit updated successfully')
    
    // Перезагружаем привычки для обновления UI
    await store.loadHabits()
    console.log('Habits reloaded')
    
    // Закрываем модальное окно
    showSettings.value = false
    console.log('Modal closed')
  } catch (error) {
    console.error('Failed to update habit:', error)
    alert('Ошибка при сохранении: ' + (error instanceof Error ? error.message : String(error)))
  }
}

function closeSettings() {
  showSettings.value = false
}

// Стили для кнопки настроек в зависимости от фона
function getSettingsButtonStyle() {
  return {
    background: isLightBackground.value 
      ? 'rgba(0, 0, 0, 0.05)' 
      : 'rgba(255, 255, 255, 0.15)'
  }
}

// Стили для стрелок в зависимости от фона
function getArrowButtonStyle() {
  return {
    borderColor: textColor.value,
    color: textColor.value
  }
}

async function handleDelete() {
  if (!habit.value) return
  
  try {
    await store.removeHabit(habit.value.id)
    showSettings.value = false
    router.push('/')
  } catch (error) {
    console.error('Failed to delete habit:', error)
    alert('Ошибка при удалении: ' + (error instanceof Error ? error.message : String(error)))
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
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 1rem;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  background: inherit;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid;
  border-bottom-color: rgba(0, 0, 0, 0.1);
}

.habit-detail-view[style*="--is-light: 1"] .header-section {
  border-bottom-color: rgba(0, 0, 0, 0.15);
  background: rgba(255, 255, 255, 0.95);
}

.habit-detail-view[style*="--is-light: 0"] .header-section {
  border-bottom-color: rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.3);
}

.back-btn {
  background: transparent;
  border: none;
  border-radius: 12px;
  color: var(--text-color);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.5rem 0.75rem;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  transition: all 0.2s ease;
  opacity: 0.8;
}

.habit-detail-view[style*="--is-light: 1"] .back-btn {
  background: rgba(0, 0, 0, 0.05);
}

.habit-detail-view[style*="--is-light: 0"] .back-btn {
  background: rgba(255, 255, 255, 0.15);
}

.back-btn:hover {
  opacity: 1;
}

.back-btn:active {
  opacity: 0.9;
  transform: scale(0.98);
}

.back-icon {
  font-size: 1rem;
  font-weight: 700;
  line-height: 1;
}

.back-text {
  font-weight: 600;
  font-size: 0.875rem;
}

.main-section {
  padding: 1rem 1rem 0;
  text-align: center;
}

.arrow-up {
  width: 40px;
  height: 40px;
  margin-bottom: 0.5rem;
  background: transparent;
  border: 1.5px solid;
  opacity: 0.5;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin: 0 auto 0.5rem;
  transition: all 0.2s;
  padding: 0;
}

.arrow-up svg {
  width: 20px;
  height: 20px;
}

.arrow-up:hover {
  opacity: 1;
}

.arrow-up:active {
  transform: scale(0.95);
}

.habit-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 4px 0;
  text-transform: uppercase;
  color: var(--text-color);
}

.habit-days {
  font-size: 16px;
  opacity: 0.8;
  margin-bottom: 1.5rem;
  color: var(--text-color);
}

.calendar-section {
  margin-top: 1.75rem;
}

.footer-section {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1rem;
  padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
  background: inherit;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.habit-settings-btn {
  width: calc(100% - 32px);
  max-width: 600px;
  height: 52px;
  border-radius: 12px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
  padding: 0;
  margin-bottom: 0.5rem;
}

.habit-settings-btn:hover {
  opacity: 0.8;
}

.habit-settings-btn:active {
  opacity: 0.7;
  transform: scale(0.98);
}

.settings-icon {
  font-size: 1.25rem;
  line-height: 1;
}

.settings-text {
  font-size: 1rem;
  font-weight: 600;
}

.arrow-down {
  width: 40px;
  height: 40px;
  background: transparent;
  border: 1.5px solid;
  opacity: 0.5;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin: 0;
  transition: all 0.2s;
  padding: 0;
}

.arrow-down svg {
  width: 20px;
  height: 20px;
}

.arrow-down:hover {
  opacity: 1;
}

.arrow-down:active {
  transform: scale(0.95);
}

.settings-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  z-index: 1000;
  overflow-y: auto;
}

.settings-content {
  background: #ffffff;
  width: 100%;
  max-width: 100%;
  min-height: 100vh;
  overflow-y: auto;
  position: relative;
  display: flex;
  flex-direction: column;
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
