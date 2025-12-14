<template>
  <div class="achievements-view">
    <header class="page-header">
      <h1 class="page-title">{{ t('achievements.title') }}</h1>
    </header>

    <div v-if="store.loading" class="loading">{{ t('achievements.loading') }}</div>

    <div v-else-if="store.habits.length === 0" class="empty-state">
      <p>{{ t('achievements.empty') }}</p>
    </div>

    <div v-else class="achievements-content">
      <div class="overall-progress">
        <h2 class="section-title">{{ t('achievements.overallProgress') }}</h2>
        <div class="progress-card">
          <div class="progress-info">
            <span class="progress-label">{{ t('achievements.unlocked') }}</span>
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
import { useI18n } from '@/composables/useI18n'

const store = useHabitsStore()
const { t } = useI18n()

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
  padding: 0 1rem 2rem;
  padding-top: 60px;
  min-height: 100vh;
}

.page-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: var(--bg-secondary);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border-color);
  padding: 1rem 0;
  padding-left: 1rem;
  padding-right: 1rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.loading,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
}

.overall-progress {
  margin-bottom: 3rem;
}

.progress-card {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: var(--shadow-sm);
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
  color: var(--text-primary);
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
  background: var(--bg-secondary);
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.habit-header:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
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
  color: var(--text-primary);
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

