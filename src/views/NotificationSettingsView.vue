<template>
  <div class="notification-settings-view">
    <header class="page-header">
      <button class="back-btn" @click="goBack" :aria-label="t('settings.back')">
        <span class="back-icon">←</span>
      </button>
      <h1 class="page-title">{{ t('settings.notifications.title') }}</h1>
      <div style="width: 40px;"></div> <!-- Spacer для выравнивания -->
    </header>

    <div class="settings-content">
      <!-- Настройки Telegram -->
      <div class="settings-section">
        <TelegramSettings />
      </div>

      <!-- Настройки уведомлений для каждой привычки -->
      <div class="settings-section">
        <h3 class="section-title">{{ t('settings.notifications.habitsNotifications') }}</h3>
        <p class="section-description">
          {{ t('settings.notifications.habitsNotificationsDesc') }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from '@/composables/useI18n'
import TelegramSettings from '@/components/TelegramSettings.vue'

const router = useRouter()
const { t } = useI18n()

function goBack() {
  router.push('/settings')
}
</script>

<style scoped>
.notification-settings-view {
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

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.section-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}
</style>

