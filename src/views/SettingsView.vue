<template>
  <div class="settings-view">
    <!-- Header с кнопкой назад -->
    <header class="settings-header">
      <button class="back-btn" @click="goBack" aria-label="Назад">
        <span class="back-icon">←</span>
      </button>
      <h1 class="settings-title">Настройки</h1>
      <div class="header-spacer"></div>
    </header>

    <!-- Telegram настройки -->
    <div class="settings-content">
      <TelegramSettings />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import TelegramSettings from '@/components/TelegramSettings.vue'

const router = useRouter()

function goBack() {
  router.back()
}
</script>

<style scoped>
.settings-view {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 1rem 2rem;
  min-height: 100vh;
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  margin-bottom: 1.5rem;
  position: sticky;
  top: 0;
  background: var(--bg-primary);
  z-index: 10;
}

.back-btn {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  transition: background-color 0.2s ease;
  font-size: 24px;
  color: var(--text-primary);
}

.back-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.dark .back-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.back-btn:active {
  background-color: rgba(0, 0, 0, 0.1);
}

.dark .back-btn:active {
  background-color: rgba(255, 255, 255, 0.15);
}

.back-icon {
  font-size: 24px;
  line-height: 1;
}

.settings-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  text-align: center;
  margin: 0;
  flex: 1;
}

.header-spacer {
  width: 40px;
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 1.75rem; /* ~28px для разделения блоков */
}

/* Адаптивность */
@media (max-width: 480px) {
  .settings-view {
    padding: 0 0.75rem 2rem;
  }
  
  .settings-title {
    font-size: 1.25rem;
  }
}

@media (min-width: 600px) {
  .settings-view {
    padding: 0 1.5rem 2rem;
  }
}
</style>

