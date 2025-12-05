<template>
  <div class="calendar-view">
    <div class="calendar-header">
      <button class="nav-btn" @click="previousMonth">‹</button>
      <h3 class="month-year" :style="{ color: props.textColor || 'inherit' }">{{ monthYear }}</h3>
      <button class="nav-btn" @click="nextMonth">›</button>
    </div>
    
    <div class="calendar-grid">
      <div 
        class="day-label" 
        v-for="day in dayLabels" 
        :key="day"
        :style="{ color: props.textColor || 'inherit' }"
      >
        {{ day }}
      </div>
      <!-- Дни календаря (включая дни предыдущего/следующего месяца) -->
      <div
        v-for="day in calendarDays"
        :key="day.date.toISOString()"
        class="calendar-day"
        :class="{
          'marked': day.isMarked,
          'today': day.isToday,
          'future': day.isFuture,
          'other-month': !day.isCurrentMonth
        }"
        :style="getDayStyle(day)"
        @click="toggleDay(day.date)"
      >
        <span 
          class="day-number"
          :style="{ color: getDayNumberColor(day) }"
        >{{ day.date.getDate() }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Habit, ProjectColor } from '@/types'
import { useHabitsStore } from '@/stores/habitsStore'
import { getProjectColorStyles } from '@/utils/projectColors'

const props = defineProps<{
  habit: Habit
  projectColor?: ProjectColor
  textColor?: string
  isLightBackground?: boolean
}>()

const store = useHabitsStore()

const currentDate = ref(new Date())

// Отслеживаем изменения в store для реактивности
watch(() => store.habits, () => {
  // Принудительно обновляем computed при изменении habits
}, { deep: true })

const dayLabels = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС']

const monthYear = computed(() => {
  return currentDate.value.toLocaleDateString('ru-RU', {
    month: 'long',
    year: 'numeric'
  })
})

const projectColorStyles = computed(() => {
  const habit = store.getHabitById(props.habit.id)
  return getProjectColorStyles(props.projectColor || 'blue', habit?.customColor)
})

const calendarDays = computed(() => {
  // Получаем актуальную привычку из store для реактивности
  const currentHabit = store.getHabitById(props.habit.id)
  if (!currentHabit) return []
  
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  // Вычисляем день недели первого дня месяца (1 = понедельник, 7 = воскресенье)
  const firstDayOfWeek = (firstDay.getDay() || 7) - 1 // Преобразуем: 0 (воскресенье) -> 6, 1 (понедельник) -> 0
  
  // Начало календаря - первый день недели, который попадает в календарь
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - firstDayOfWeek)
  
  // Конец календаря - последний день недели, который попадает в календарь
  const daysInMonth = lastDay.getDate()
  const lastDayOfWeek = (lastDay.getDay() || 7) - 1
  const endDate = new Date(lastDay)
  endDate.setDate(endDate.getDate() + (6 - lastDayOfWeek))
  
  const days: Array<{
    date: Date
    isCurrentMonth: boolean
    isMarked: boolean
    isToday: boolean
    isFuture: boolean
  }> = []
  
  const today = new Date()
  const todayYear = today.getFullYear()
  const todayMonth = today.getMonth()
  const todayDate = today.getDate()
  
  // Проходим по всем дням от начала до конца календаря
  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    const dateYear = currentDate.getFullYear()
    const dateMonth = currentDate.getMonth()
    const dateDay = currentDate.getDate()
    
    // Проверяем, относится ли день к текущему месяцу
    const isCurrentMonth = dateYear === year && dateMonth === month
    
    const dateStr = currentDate.toISOString().split('T')[0]
    
    // Используем локальное время для определения сегодня и будущих дней
    const isToday = dateYear === todayYear && dateMonth === todayMonth && dateDay === todayDate
    const isFuture = dateYear > todayYear || 
                     (dateYear === todayYear && dateMonth > todayMonth) ||
                     (dateYear === todayYear && dateMonth === todayMonth && dateDay > todayDate)
    
    const isMarked = currentHabit.markedDays.includes(dateStr)
    
    days.push({ 
      date: new Date(currentDate), 
      isCurrentMonth, 
      isMarked, 
      isToday, 
      isFuture 
    })
    
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return days
})

function previousMonth() {
  const newDate = new Date(currentDate.value)
  newDate.setMonth(newDate.getMonth() - 1)
  currentDate.value = newDate
}

function nextMonth() {
  const newDate = new Date(currentDate.value)
  newDate.setMonth(newDate.getMonth() + 1)
  currentDate.value = newDate
}


// Определяем стили для дня (обводка)
function getDayStyle(day: { isMarked: boolean; isFuture: boolean; isToday: boolean; isCurrentMonth: boolean }) {
  const isLight = props.isLightBackground ?? false
  const textColor = props.textColor || (isLight ? '#1A1A1A' : '#FFFFFF')
  
  if (day.isMarked) {
    // Выполненные дни - зелёный фон, без обводки
    return {
      border: 'none',
      background: '#10b981'
    }
  }
  
  // Все дни имеют одинаковую толщину обводки (1px)
  // Дни из другого месяца делаем менее заметными
  const opacity = !day.isCurrentMonth ? 0.2 : (day.isFuture ? (isLight ? 0.3 : 0.4) : 1)
  
  return {
    border: `1px solid ${textColor}`,
    background: 'transparent',
    opacity: opacity
  }
}

// Определяем цвет цифры дня в зависимости от состояния и фона
function getDayNumberColor(day: { isMarked: boolean; isFuture: boolean; isToday: boolean; isCurrentMonth: boolean }): string {
  const isLight = props.isLightBackground ?? false
  
  if (day.isMarked) {
    // Выполненные дни - белый текст на зелёном фоне
    return '#FFFFFF'
  }
  
  // Дни из другого месяца - очень приглушённый цвет
  if (!day.isCurrentMonth) {
    return isLight ? '#ccc' : '#666'
  }
  
  if (day.isFuture) {
    // Будущие дни - приглушённый цвет
    return isLight ? '#999' : '#999'
  }
  
  // Остальные дни - цвет зависит от фона
  // Светлый фон → темные цифры, темный фон → светлые цифры
  return isLight ? '#1A1A1A' : '#FFFFFF'
}

async function toggleDay(date: Date) {
  // Используем локальное время для корректной работы с часовыми поясами
  const today = new Date()
  const todayYear = today.getFullYear()
  const todayMonth = today.getMonth()
  const todayDate = today.getDate()
  
  const dateYear = date.getFullYear()
  const dateMonth = date.getMonth()
  const dateDay = date.getDate()
  
  // Не позволяем отмечать будущие дни (сравниваем по локальному времени)
  if (dateYear > todayYear || 
      (dateYear === todayYear && dateMonth > todayMonth) ||
      (dateYear === todayYear && dateMonth === todayMonth && dateDay > todayDate)) {
    return
  }
  
  const dateStr = date.toISOString().split('T')[0]
  
  // Получаем актуальную привычку из store
  const currentHabit = store.getHabitById(props.habit.id)
  if (!currentHabit) return
  
  if (currentHabit.markedDays.includes(dateStr)) {
    await store.unmarkDay(props.habit.id, date)
  } else {
    await store.markDay(props.habit.id, date)
  }
}
</script>

<style scoped>
.calendar-view {
  background: transparent;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.nav-btn {
  background: transparent;
  border: 1px solid;
  border-color: inherit;
  opacity: 0.5;
  border-radius: 8px;
  width: 2.5rem;
  height: 2.5rem;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  color: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-btn:hover {
  opacity: 0.8;
}

.month-year {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  text-transform: capitalize;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
}

.day-label {
  text-align: center;
  font-size: 0.75rem;
  font-weight: 600;
  opacity: 0.8;
  padding: 0.5rem;
}

.calendar-day {
  aspect-ratio: 1;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  box-sizing: border-box;
}

.calendar-day.other-month {
  cursor: default;
}

.calendar-day:hover:not(.other-month):not(.marked) {
  transform: scale(1.1);
  opacity: 1 !important;
}

.calendar-day.other-month:hover {
  transform: none;
}

.day-number {
  font-size: 0.875rem;
  font-weight: 600;
}

@media (max-width: 480px) {
  .calendar-grid {
    gap: 0.25rem;
  }
  
  .day-label {
    font-size: 0.625rem;
    padding: 0.25rem;
  }
  
  .day-number {
    font-size: 0.75rem;
  }
}
</style>
