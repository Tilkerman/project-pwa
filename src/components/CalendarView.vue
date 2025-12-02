<template>
  <div class="calendar-view">
    <div class="calendar-header">
      <button class="nav-btn" @click="previousMonth">‹</button>
      <h3 class="month-year">{{ monthYear }}</h3>
      <button class="nav-btn" @click="nextMonth">›</button>
    </div>
    
    <div class="calendar-grid">
      <div class="day-label" v-for="day in dayLabels" :key="day">
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
        @click="toggleDay(day.date)"
      >
        <span class="day-number">{{ day.date.getDate() }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Habit, ProjectColor } from '@/types'
import { useHabitsStore } from '@/stores/habitsStore'
import { getProjectColorStyles } from '@/utils/projectColors'

const props = defineProps<{
  habit: Habit
  projectColor?: ProjectColor
}>()

const store = useHabitsStore()

const currentDate = ref(new Date())

const dayLabels = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС']

const monthYear = computed(() => {
  return currentDate.value.toLocaleDateString('ru-RU', {
    month: 'long',
    year: 'numeric'
  })
})

const projectColorStyles = computed(() => {
  return getProjectColorStyles(props.projectColor || 'blue')
})

const calendarDays = computed(() => {
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
  today.setHours(0, 0, 0, 0)
  
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    
    const dateStr = date.toISOString().split('T')[0]
    const isCurrentMonth = date.getMonth() === month
    const isMarked = props.habit.markedDays.includes(dateStr)
    const dateForToday = new Date(date)
    dateForToday.setHours(0, 0, 0, 0)
    const isToday = dateForToday.getTime() === today.getTime()
    const isFuture = dateForToday.getTime() > today.getTime()
    
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

async function toggleDay(date: Date) {
  const dateStr = date.toISOString().split('T')[0]
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dateForCheck = new Date(date)
  dateForCheck.setHours(0, 0, 0, 0)
  
  // Не позволяем отмечать будущие дни
  if (dateForCheck.getTime() > today.getTime()) {
    return
  }
  
  if (props.habit.markedDays.includes(dateStr)) {
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
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 8px;
  width: 2.5rem;
  height: 2.5rem;
  font-size: 1.5rem;
  cursor: pointer;
  transition: background 0.2s;
  color: inherit;
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.month-year {
  font-size: 1.125rem;
  font-weight: 600;
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
  opacity: 0.7;
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
  opacity: 0.3;
}

.calendar-day.marked {
  background: #10b981;
  color: white;
}

.calendar-day.future {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
}

.calendar-day.today {
  border: 2px solid rgba(255, 255, 255, 0.5);
}

.calendar-day:not(.other-month):not(.future):not(.marked) {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.5);
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
