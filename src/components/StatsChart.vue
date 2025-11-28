<template>
  <div class="stats-chart">
    <h3 class="chart-title">{{ title }}</h3>
    <div class="chart-container">
      <div class="chart-bars">
        <div
          v-for="(day, index) in chartData"
          :key="index"
          class="bar-container"
          :title="day.label"
        >
          <div
            class="bar"
            :style="{ height: `${day.percentage}%` }"
            :class="{ marked: day.marked }"
          ></div>
          <span class="bar-label">{{ day.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Habit } from '@/types'

const props = defineProps<{
  habit: Habit
  title?: string
  days?: number
}>()

const daysToShow = props.days || 30

const chartData = computed(() => {
  const today = new Date()
  const data = []
  
  for (let i = daysToShow - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const isMarked = props.habit.markedDays.includes(dateStr)
    
    data.push({
      date: dateStr,
      marked: isMarked,
      percentage: isMarked ? 100 : 20,
      label: date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
    })
  }
  
  return data
})
</script>

<style scoped>
.stats-chart {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
}

.chart-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
}

.chart-container {
  overflow-x: auto;
}

.chart-bars {
  display: flex;
  gap: 0.5rem;
  align-items: flex-end;
  min-height: 200px;
  padding: 1rem 0;
}

.bar-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 30px;
}

.bar {
  width: 100%;
  background: #e5e7eb;
  border-radius: 4px 4px 0 0;
  transition: all 0.3s;
  min-height: 4px;
}

.bar.marked {
  background: linear-gradient(180deg, #4f46e5 0%, #6366f1 100%);
}

.bar-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 0.5rem;
  text-align: center;
  writing-mode: horizontal-tb;
  transform: rotate(-45deg);
  transform-origin: center;
  white-space: nowrap;
}
</style>

