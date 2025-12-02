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
      </div>

      <div class="main-section">
        <button class="arrow-up" @click="navigateToPreviousHabit">▲</button>
        <h1 class="habit-title">{{ habit.name }}</h1>
        <p class="habit-days">уже {{ stats.totalDays }} дней</p>

        <div class="calendar-section">
          <CalendarView :habit="habit" :project-color="habit.color || 'blue'" />
        </div>
      </div>

      <div class="footer-section">
        <div class="settings-link" @click="showSettings = true">настройки</div>
        <button class="arrow-down" @click="navigateToNextHabit">▼</button>
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

const habit = computed(() => {
  const id = route.params.id as string
  return store.getHabitById(id)
})

const allHabits = computed(() => store.habits)

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
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin: 0 auto 0.5rem;
  transition: all 0.2s;
  opacity: 0.9;
}

.arrow-up:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.arrow-up:active {
  transform: scale(0.95);
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
  font-size: 2.5rem;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin: 0.5rem auto;
  transition: all 0.2s;
  opacity: 0.9;
  color: inherit;
}

.arrow-down:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
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
