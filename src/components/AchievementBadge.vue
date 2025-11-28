<template>
  <div class="achievement-badge" :class="{ unlocked: isUnlocked }">
    <div class="badge-icon">{{ achievement.icon }}</div>
    <div class="badge-info">
      <h4 class="badge-name">{{ achievement.name }}</h4>
      <p class="badge-description">{{ achievement.description }}</p>
      <div v-if="achievement.daysRequired" class="badge-progress">
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: `${progressPercentage}%` }"
          ></div>
        </div>
        <span class="progress-text">{{ currentDays }} / {{ achievement.daysRequired }}</span>
      </div>
    </div>
    <div v-if="isUnlocked" class="unlocked-badge">✓</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Achievement, Habit } from '@/types'
import { getCurrentStreak } from '@/utils/characters'

const props = defineProps<{
  achievement: Achievement
  habit: Habit
}>()

const isUnlocked = computed(() => props.achievement.condition(props.habit))

const currentDays = computed(() => {
  if (props.achievement.id.includes('streak')) {
    return getCurrentStreak(props.habit)
  }
  return props.habit.markedDays.length
})

const progressPercentage = computed(() => {
  if (!props.achievement.daysRequired) return 100
  return Math.min(100, (currentDays.value / props.achievement.daysRequired) * 100)
})
</script>

<style scoped>
.achievement-badge {
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
  transition: all 0.3s;
  opacity: 0.6;
}

.achievement-badge.unlocked {
  border-color: var(--success-color);
  background: #f0fdf4;
  opacity: 1;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
  animation: fadeIn 0.5s ease-out;
}

.badge-icon {
  font-size: 3rem;
  line-height: 1;
}

.badge-info {
  flex: 1;
}

.badge-name {
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.badge-description {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.badge-progress {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4f46e5 0%, #6366f1 100%);
  transition: width 0.3s;
}

.progress-text {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-weight: 600;
  min-width: 60px;
  text-align: right;
}

.unlocked-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 2rem;
  height: 2rem;
  background: #10b981;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.25rem;
}
</style>

