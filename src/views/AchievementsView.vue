<template>
  <div class="achievements-view">
    <h1 class="page-title">Достижения</h1>

    <div v-if="store.loading" class="loading">Загрузка...</div>

    <div v-else-if="store.habits.length === 0" class="empty-state">
      <p>Нет привычек для отслеживания достижений. Создайте привычку, чтобы начать зарабатывать достижения!</p>
    </div>

    <div v-else class="achievements-content">
      <div class="overall-progress">
        <h2 class="section-title">Общий прогресс</h2>
        <div class="progress-card">
          <div class="progress-info">
            <span class="progress-label">Разблокировано достижений</span>
            <span class="progress-value">{{ unlockedCount }} / {{ totalCount }}</span>
          </div>
          <div class="progress-bar-large">
            <div
              class="progress-fill-large"
              :style="{ width: `${progressPercentage}%` }"
            ></div>
          </div>
        </div>
      </div>

      <div
        v-for="habit in store.habits"
        :key="habit.id"
        class="habit-achievements-section"
      >
        <div class="habit-header" @click="$router.push(`/habit/${habit.id}`)">
          <div class="habit-title">
            <span class="character-icon">{{ characters[habit.character].icon }}</span>
            <h2>{{ habit.name }}</h2>
          </div>
          <span class="habit-progress">
            {{ getHabitUnlockedCount(habit) }} / {{ store.allAchievements.length }}
          </span>
        </div>
        <div class="achievements-grid">
          <AchievementBadge
            v-for="achievement in store.allAchievements"
            :key="achievement.id"
            :achievement="achievement"
            :habit="habit"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import AchievementBadge from '@/components/AchievementBadge.vue'
import { useHabitsStore } from '@/stores/habitsStore'
import { characters } from '@/utils/characters'

const store = useHabitsStore()

const totalCount = computed(() => {
  return store.allAchievements.length * store.habits.length
})

const unlockedCount = computed(() => {
  return store.habits.reduce((total, habit) => {
    return total + getHabitUnlockedCount(habit)
  }, 0)
})

const progressPercentage = computed(() => {
  if (totalCount.value === 0) return 0
  return (unlockedCount.value / totalCount.value) * 100
})

function getHabitUnlockedCount(habit: typeof store.habits[0]) {
  return store.allAchievements.filter(achievement =>
    achievement.condition(habit)
  ).length
}

onMounted(async () => {
  await store.loadHabits()
})
</script>

<style scoped>
.achievements-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 2rem;
}

.loading,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.5rem;
}

.overall-progress {
  margin-bottom: 3rem;
}

.progress-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.progress-label {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.progress-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #4f46e5;
}

.progress-bar-large {
  height: 16px;
  background: #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.progress-fill-large {
  height: 100%;
  background: linear-gradient(90deg, #4f46e5 0%, #6366f1 100%);
  transition: width 0.3s;
  border-radius: 8px;
}

.habit-achievements-section {
  margin-bottom: 3rem;
}

.habit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.habit-header:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.habit-title {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.character-icon {
  font-size: 2rem;
}

.habit-title h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
}

.habit-progress {
  font-size: 1.125rem;
  font-weight: 600;
  color: #4f46e5;
}

.achievements-grid {
  display: grid;
  gap: 1rem;
}
</style>

