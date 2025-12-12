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
      <div
        v-for="day in calendarDays"
        :key="day.date.toISOString()"
        class="calendar-day"
        :class="{
          'other-month': !day.isCurrentMonth,
          'marked': day.isMarked,
          'today': day.isToday,
          'future': day.isFuture
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
import { useI18n } from '@/composables/useI18n'

const props = defineProps<{
  habit: Habit
  projectColor?: ProjectColor
  textColor?: string
  isLightBackground?: boolean
}>()

const store = useHabitsStore()
const { t, locale: currentLocale } = useI18n()

const currentDate = ref(new Date())

// Отслеживаем изменения в store для реактивности
watch(() => store.habits, () => {
  // Принудительно обновляем computed при изменении habits
}, { deep: true })

const dayLabels = computed(() => {
  return [
    t('calendar.weekdays.mon'),
    t('calendar.weekdays.tue'),
    t('calendar.weekdays.wed'),
    t('calendar.weekdays.thu'),
    t('calendar.weekdays.fri'),
    t('calendar.weekdays.sat'),
    t('calendar.weekdays.sun')
  ]
})

const monthYear = computed(() => {
  const month = currentDate.value.getMonth()
  const year = currentDate.value.getFullYear()
  
  const monthNames = [
    t('calendar.months.january'),
    t('calendar.months.february'),
    t('calendar.months.march'),
    t('calendar.months.april'),
    t('calendar.months.may'),
    t('calendar.months.june'),
    t('calendar.months.july'),
    t('calendar.months.august'),
    t('calendar.months.september'),
    t('calendar.months.october'),
    t('calendar.months.november'),
    t('calendar.months.december')
  ]
  
  return `${monthNames[month]} ${year}`
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
  
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - (firstDay.getDay() || 7) + 1)
  
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
  
  // Вычисляем количество дней, которые нужно показать
  // Показываем только дни текущего месяца + дни предыдущего месяца для заполнения первой недели
  const daysInMonth = lastDay.getDate()
  const firstDayOfWeek = (firstDay.getDay() || 7) - 1 // 0 = понедельник, 6 = воскресенье
  const totalDaysToShow = firstDayOfWeek + daysInMonth
  
  // Ограничиваем до 35 дней максимум (5 недель), чтобы не показывать лишний ряд следующего месяца
  const maxDays = 35
  
  for (let i = 0; i < Math.min(totalDaysToShow, maxDays); i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    
    const dateStr = date.toISOString().split('T')[0]
    const isCurrentMonth = date.getMonth() === month
    
    const dateYear = date.getFullYear()
    const dateMonth = date.getMonth()
    const dateDay = date.getDate()
    
    // Используем локальное время для определения сегодня и будущих дней
    const isToday = dateYear === todayYear && dateMonth === todayMonth && dateDay === todayDate
    const isFuture = dateYear > todayYear || 
                     (dateYear === todayYear && dateMonth > todayMonth) ||
                     (dateYear === todayYear && dateMonth === todayMonth && dateDay > todayDate)
    
    const isMarked = currentHabit.markedDays.includes(dateStr)
    
    days.push({ date, isCurrentMonth, isMarked, isToday, isFuture })
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
  
  // Все дни имеют обводку
  if (!day.isCurrentMonth) {
    // Дни из другого месяца - очень прозрачные
    return {
      border: `1px solid ${textColor}`,
      background: 'transparent',
      opacity: 0.2
    }
  }
  
  const opacity = day.isFuture ? (isLight ? 0.4 : 0.5) : 1
  
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
    // Выполненные дни - всегда зелёный
    return '#FFFFFF'
  }
  
  if (day.isFuture) {
    // Будущие дни
    return isLight ? '#DDD' : '#666'
  }
  
  if (day.isToday) {
    // Текущий день - используем цвет текста
    return props.textColor || (isLight ? '#1A1A1A' : '#FFFFFF')
  }
  
  // Невыполненные прошедшие дни
  return isLight ? '#999' : '#BBB'
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
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
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
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
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
  background: transparent;
}

.calendar-day.other-month {
  cursor: default;
}

.calendar-day.marked {
  background: #10b981 !important;
  color: white;
  border: none !important;
}

.calendar-day.today {
  /* Стили для сегодняшнего дня задаются через inline style */
}

.calendar-day:hover:not(.other-month) {
  transform: scale(1.1);
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
