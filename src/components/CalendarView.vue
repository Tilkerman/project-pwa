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
          'has-note': day.hasNote
        }"
        @click="toggleDay(day.date)"
      >
        <span class="day-number">{{ day.date.getDate() }}</span>
        <span v-if="day.hasNote" class="note-indicator">📝</span>
      </div>
    </div>

    <div v-if="selectedDate" class="day-actions">
      <div class="selected-date">
        Выбран: {{ formatDate(selectedDate) }}
      </div>
      <div class="action-buttons">
        <button
          class="btn btn-primary"
          :class="{ 'btn-marked': isMarked(selectedDate) }"
          @click="toggleMarkDay"
        >
          {{ isMarked(selectedDate) ? '✓ Отмечено' : 'Отметить день' }}
        </button>
        <button class="btn btn-secondary" @click="showNoteDialog = true">
          {{ getNote(selectedDate) ? 'Изменить заметку' : 'Добавить заметку' }}
        </button>
      </div>
    </div>

    <div v-if="showNoteDialog" class="note-dialog-overlay" @click.self="closeNoteDialog">
      <div class="note-dialog">
        <h3>Заметка на {{ formatDate(selectedDate || new Date()) }}</h3>
        <textarea
          v-model="noteText"
          class="note-textarea"
          placeholder="Как прошел день?"
          rows="4"
        ></textarea>
        <div class="dialog-actions">
          <button class="btn btn-secondary" @click="closeNoteDialog">Отмена</button>
          <button class="btn btn-primary" @click="saveNote">Сохранить</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Habit } from '@/types'
import { useHabitsStore } from '@/stores/habitsStore'

const props = defineProps<{
  habit: Habit
}>()

const store = useHabitsStore()

const currentDate = ref(new Date())
const selectedDate = ref<Date | null>(null)
const showNoteDialog = ref(false)
const noteText = ref('')

const dayLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const monthYear = computed(() => {
  return currentDate.value.toLocaleDateString('ru-RU', {
    month: 'long',
    year: 'numeric'
  })
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
    hasNote: boolean
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
    const hasNote = !!props.habit.notes[dateStr]
    
    days.push({ date, isCurrentMonth, isMarked, isToday, hasNote })
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

function toggleDay(date: Date) {
  selectedDate.value = date
}

function isMarked(date: Date): boolean {
  const dateStr = date.toISOString().split('T')[0]
  return props.habit.markedDays.includes(dateStr)
}

function getNote(date: Date): string | undefined {
  const dateStr = date.toISOString().split('T')[0]
  return props.habit.notes[dateStr]
}

async function toggleMarkDay() {
  if (!selectedDate.value) return
  
  if (isMarked(selectedDate.value)) {
    await store.unmarkDay(props.habit.id, selectedDate.value)
  } else {
    await store.markDay(props.habit.id, selectedDate.value)
  }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

function closeNoteDialog() {
  showNoteDialog.value = false
  noteText.value = ''
}

async function saveNote() {
  if (!selectedDate.value) return
  
  await store.addNote(props.habit.id, selectedDate.value, noteText.value)
  closeNoteDialog()
}

watch(selectedDate, (newDate) => {
  if (newDate) {
    noteText.value = getNote(newDate) || ''
  }
})
</script>

<style scoped>
.calendar-view {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.nav-btn {
  background: #f3f4f6;
  border: none;
  border-radius: 8px;
  width: 2.5rem;
  height: 2.5rem;
  font-size: 1.5rem;
  cursor: pointer;
  transition: background 0.2s;
}

.nav-btn:hover {
  background: #e5e7eb;
}

.month-year {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  text-transform: capitalize;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

@media (max-width: 480px) {
  .calendar-grid {
    gap: 0.25rem;
  }
  
  .day-label {
    font-size: 0.75rem;
    padding: 0.25rem;
  }
  
  .day-number {
    font-size: 0.875rem;
  }
}

.day-label {
  text-align: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  padding: 0.5rem;
}

.calendar-day {
  aspect-ratio: 1;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition);
  position: relative;
  background: white;
}

.calendar-day:hover {
  border-color: #4f46e5;
  background: #f3f4f6;
}

.calendar-day.other-month {
  opacity: 0.3;
}

.calendar-day.marked {
  background: #eef2ff;
  border-color: var(--primary-color);
  animation: pulse 0.5s ease-out;
}

.calendar-day.today {
  border-color: #f59e0b;
  border-width: 3px;
}

.calendar-day.has-note .note-indicator {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  font-size: 0.75rem;
}

.day-number {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.day-actions {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.selected-date {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
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

.btn-primary.btn-marked {
  background: #10b981;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.note-dialog-overlay {
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
}

.note-dialog {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.note-dialog h3 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.note-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  margin-bottom: 1.5rem;
}

.note-textarea:focus {
  outline: none;
  border-color: #4f46e5;
}

.dialog-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}
</style>

