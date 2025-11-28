<template>
  <div class="habit-card fade-in" @click="$emit('click')">
    <div class="habit-header">
      <div class="character-icon">{{ characterIcon }}</div>
      <div class="habit-info">
        <h3>{{ habit.name }}</h3>
        <p class="character-name">{{ characterName }}</p>
      </div>
    </div>
    <div class="habit-stats">
      <div class="stat">
        <span class="stat-value">{{ stats.totalDays }}</span>
        <span class="stat-label">дней</span>
      </div>
      <div class="stat">
        <span class="stat-value streak">{{ stats.streak }}</span>
        <span class="stat-label">подряд</span>
      </div>
      <div class="stat">
        <span class="stat-value">{{ stats.successRate }}%</span>
        <span class="stat-label">успех</span>
      </div>
    </div>
    <div v-if="stats.streak > 0" class="streak-badge">
      🔥 {{ stats.streak }} дней подряд!
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Habit } from '@/types'
import { characters } from '@/utils/characters'
import { useHabitsStore } from '@/stores/habitsStore'

const props = defineProps<{
  habit: Habit
}>()

defineEmits<{
  click: []
}>()

const store = useHabitsStore()

const characterIcon = computed(() => characters[props.habit.character].icon)
const characterName = computed(() => characters[props.habit.character].name)
const stats = computed(() => store.getHabitStats(props.habit))
</script>

<style scoped>
.habit-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: var(--transition);
  margin-bottom: 1rem;
  animation: fadeIn 0.3s ease-out;
}

.habit-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.habit-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.character-icon {
  font-size: 3rem;
  line-height: 1;
}

.habit-info {
  flex: 1;
}

.habit-info h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.character-name {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.habit-stats {
  display: flex;
  gap: 1.5rem;
  margin-top: 1rem;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #4f46e5;
}

.stat-value.streak {
  color: #f59e0b;
}

.stat-label {
  font-size: 0.75rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.streak-badge {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
  color: white;
  border-radius: 20px;
  text-align: center;
  font-weight: 600;
  font-size: 0.875rem;
}
</style>

