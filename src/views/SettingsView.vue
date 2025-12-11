<template>
  <div class="settings-view">
    <header class="page-header">
      <button class="back-btn" @click="goBack" aria-label="Назад">
        <span class="back-icon">←</span>
      </button>
      <h1 class="page-title">Настройки</h1>
      <div style="width: 40px;"></div> <!-- Spacer для выравнивания -->
    </header>

    <div class="settings-content">
      <!-- Настройки Telegram -->
      <div class="settings-section">
        <TelegramSettings />
      </div>

      <!-- Информация о приложении -->
      <div class="settings-section">
        <div class="app-info">
          <h3 class="info-title">О приложении</h3>
          <p class="info-text">Трекер Привычек v{{ appVersion }}</p>
          <p class="info-text">Приложение для отслеживания привычек с персонажами-мотиваторами</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import TelegramSettings from '@/components/TelegramSettings.vue'
import { useHabitsStore } from '@/stores/habitsStore'

const router = useRouter()
const store = useHabitsStore()

const appVersion = __APP_VERSION__ || '1.0.0'

function goBack() {
  router.push('/')
}

onMounted(() => {
  // Можно загрузить сохраненные настройки уведомлений
  // Пока используем значения по умолчанию
})
</script>

<style scoped>
.settings-view {
  min-height: 100vh;
  background: var(--bg-primary);
  padding-bottom: 2rem;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn {
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  transition: background 0.2s;
}

.back-btn:hover {
  background: var(--bg-hover);
}

.back-icon {
  font-size: 1.5rem;
  color: var(--text-primary);
}

.page-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.settings-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 1.5rem;
}

.settings-section {
  margin-bottom: 1.5rem;
}

.app-info {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
}

.info-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
}

.info-text {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0.5rem 0;
  line-height: 1.5;
}
</style>

