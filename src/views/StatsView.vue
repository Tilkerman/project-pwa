<template>
  <div class="stats-view">
    <h1 class="page-title">Общая статистика</h1>

    <div v-if="store.loading" class="loading">Загрузка...</div>

    <div v-else-if="store.habits.length === 0" class="empty-state">
      <p>Нет данных для отображения. Создайте привычку, чтобы увидеть статистику.</p>
    </div>

    <div v-else class="stats-content">
      <div class="overall-stats">
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-value">{{ store.habits.length }}</div>
          <div class="stat-label">Всего привычек</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-value">{{ totalDays }}</div>
          <div class="stat-label">Всего отмеченных дней</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🔥</div>
          <div class="stat-value">{{ bestStreak }}</div>
          <div class="stat-label">Лучшая серия</div>
        </div>
      </div>

      <div class="habits-stats">
        <h2 class="section-title">Статистика по привычкам</h2>
        <div class="habits-list">
          <div
            v-for="habit in store.habits"
            :key="habit.id"
            class="habit-stat-item"
            @click="$router.push(`/habit/${habit.id}`)"
          >
            <div class="habit-stat-header">
              <h3>{{ habit.name }}</h3>
              <span class="character-icon">{{ characters[habit.character].icon }}</span>
            </div>
            <StatsChart :habit="habit" :days="30" />
            <div class="habit-stat-numbers">
              <div class="stat-number">
                <span class="label">Дней:</span>
                <span class="value">{{ store.getHabitStats(habit).totalDays }}</span>
              </div>
              <div class="stat-number">
                <span class="label">Серия:</span>
                <span class="value streak">{{ store.getHabitStats(habit).streak }}</span>
              </div>
              <div class="stat-number">
                <span class="label">Успех:</span>
                <span class="value">{{ store.getHabitStats(habit).successRate }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import StatsChart from '@/components/StatsChart.vue'
import { useHabitsStore } from '@/stores/habitsStore'
import { characters } from '@/utils/characters'

const store = useHabitsStore()

const totalDays = computed(() => {
  return store.habits.reduce((sum, habit) => {
    return sum + store.getHabitStats(habit).totalDays
  }, 0)
})

const bestStreak = computed(() => {
  if (store.habits.length === 0) return 0
  return Math.max(...store.habits.map(habit => store.getHabitStats(habit).streak))
})

onMounted(async () => {
  await store.loadHabits()
})
</script>

<style scoped>
.stats-view {
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

.overall-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #4f46e5;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.5rem;
}

.habits-list {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.habit-stat-item {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.habit-stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.habit-stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.habit-stat-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.character-icon {
  font-size: 2rem;
}

.habit-stat-numbers {
  display: flex;
  gap: 2rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.stat-number {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-number .label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-number .value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #4f46e5;
}

.stat-number .value.streak {
  color: #f59e0b;
}
</style>

