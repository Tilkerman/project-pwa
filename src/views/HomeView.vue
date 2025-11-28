<template>
  <div class="home-view">
    <div class="header">
      <h1 class="page-title">Мои привычки</h1>
      <button class="btn btn-primary add-btn" @click="showForm = true">
        + Новая привычка
      </button>
    </div>

    <div v-if="store.loading" class="loading">Загрузка...</div>

    <div v-else-if="store.habits.length === 0" class="empty-state fade-in">
      <div class="empty-icon">📝</div>
      <h2>Нет привычек</h2>
      <p>Создайте свою первую привычку, чтобы начать отслеживать прогресс!</p>
      <button class="btn btn-primary" @click="showForm = true">
        Создать привычку
      </button>
    </div>

    <div v-else class="habits-list">
      <HabitCard
        v-for="(habit, index) in store.habits"
        :key="habit.id"
        :habit="habit"
        :style="{ animationDelay: `${index * 0.1}s` }"
        @click="goToHabit(habit.id)"
      />
    </div>

    <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
      <div class="modal-content">
        <HabitForm
          @submit="handleSubmit"
          @cancel="closeForm"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import HabitCard from '@/components/HabitCard.vue'
import HabitForm from '@/components/HabitForm.vue'
import { useHabitsStore } from '@/stores/habitsStore'

const router = useRouter()
const store = useHabitsStore()
const showForm = ref(false)

onMounted(async () => {
  await store.loadHabits()
})

function goToHabit(id: string) {
  router.push(`/habit/${id}`)
}

async function handleSubmit(data: {
  name: string
  character: 'babushka' | 'gopnik'
  notificationTime?: string
  notificationEnabled: boolean
}) {
  await store.createHabit(data.name, data.character, data.notificationTime)
  closeForm()
}

function closeForm() {
  showForm.value = false
}
</script>

<style scoped>
.home-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.add-btn {
  white-space: nowrap;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--bg-secondary);
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  color: var(--text-secondary);
  margin: 0 0 2rem 0;
}

.habits-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.modal-overlay {
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
  padding: 1rem;
  animation: fadeIn 0.2s ease-out;
}

.modal-content {
  background: var(--bg-secondary);
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  animation: fadeIn 0.3s ease-out;
  border: 1px solid var(--border-color);
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
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
</style>

