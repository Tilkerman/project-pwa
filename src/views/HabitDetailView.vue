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

    <div 
      v-else 
      class="habit-content"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    >
      <div class="header-section">
        <button class="back-btn" @click="$router.push('/')">
          ← Назад
        </button>
      </div>

      <div class="main-section">
        <button class="arrow-up" @click="navigateToPreviousHabit">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 19V5M5 12l7-7 7 7"/>
          </svg>
        </button>
        <h1 class="habit-title">{{ habit.name }}</h1>
        <p class="habit-days">уже {{ stats.totalDays }} дней</p>

        <div class="calendar-section">
          <CalendarView :habit="habit" :project-color="habit.color || 'blue'" />
        </div>
      </div>

      <div class="footer-section">
        <div class="settings-link" @click="showSettings = true">настройки</div>
        <button class="arrow-down" @click="navigateToNextHabit">
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
          :habit="habit || undefined"
          @submit="handleUpdate"
          @cancel="closeSettings"
        />
        <div v-if="habit" class="settings-footer">
          <button class="btn-delete" @click="showDeleteConfirm = true">
            Удалить
          </button>
        </div>
      </div>
    </div>

    <!-- Модальное окно подтверждения удаления -->
    <div v-if="showDeleteConfirm" class="delete-confirm-modal" @click.self="showDeleteConfirm = false">
      <div class="delete-confirm-content" @click.stop>
        <h3 class="delete-confirm-title">Удалить привычку?</h3>
        <p class="delete-confirm-text">
          Вы уверены, что хотите удалить привычку "{{ habit?.name }}"? 
          Это действие нельзя отменить.
        </p>
        <div class="delete-confirm-actions">
          <button class="btn btn-secondary" @click="showDeleteConfirm = false">
            Отмена
          </button>
          <button class="btn btn-danger" @click="handleDelete">
            Удалить
          </button>
        </div>
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
const showDeleteConfirm = ref(false)

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

async function handleDelete() {
  if (!habit.value) return
  
  try {
    await store.removeHabit(habit.value.id)
    showDeleteConfirm.value = false
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

.main-section {
  padding: 1rem 1rem 0;
  text-align: center;
}

.arrow-up {
  width: 40px;
  height: 40px;
  margin-bottom: 0.5rem;
  background: transparent;
  border: 1.5px solid rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin: 0 auto 0.5rem;
  transition: all 0.2s;
  opacity: 0.9;
  color: rgba(255, 255, 255, 0.9);
  padding: 0;
}

.arrow-up svg {
  width: 20px;
  height: 20px;
}

.arrow-up:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 1);
}

.arrow-up:active {
  transform: scale(0.95);
  background: rgba(255, 255, 255, 0.15);
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
  margin-bottom: 1rem;
}

.calendar-section {
  margin-top: 1rem;
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
  width: 40px;
  height: 40px;
  background: transparent;
  border: 1.5px solid rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin: 0.5rem auto;
  transition: all 0.2s;
  opacity: 0.9;
  color: rgba(255, 255, 255, 0.9);
  padding: 0;
}

.arrow-down svg {
  width: 20px;
  height: 20px;
}

.arrow-down:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 1);
}

.arrow-down:active {
  transform: scale(0.95);
  background: rgba(255, 255, 255, 0.15);
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
  position: relative;
  display: flex;
  flex-direction: column;
}

.settings-footer {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1rem;
  background: white;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  border-radius: 0 0 16px 16px;
  margin-top: auto;
}

.btn-delete {
  padding: 0.75rem 1.5rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-delete:hover {
  background: #dc2626;
}

.btn-delete:active {
  transform: scale(0.95);
  background: #b91c1c;
}

.delete-confirm-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.delete-confirm-content {
  background: white;
  border-radius: 16px;
  max-width: 400px;
  width: 100%;
  padding: 2rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.delete-confirm-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  color: #1f2937;
}

.delete-confirm-text {
  font-size: 1rem;
  color: #6b7280;
  margin: 0 0 2rem 0;
  line-height: 1.5;
}

.delete-confirm-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn-secondary {
  padding: 0.75rem 1.5rem;
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-danger {
  padding: 0.75rem 1.5rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-danger:hover {
  background: #dc2626;
}

.btn-danger:active {
  transform: scale(0.95);
  background: #b91c1c;
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
