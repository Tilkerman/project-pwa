<template>
  <div class="settings-view">
    <header class="page-header">
      <button class="back-btn" @click="goBack" :aria-label="t('settings.back')">
        <span class="back-icon">←</span>
      </button>
      <h1 class="page-title">{{ t('settings.title') }}</h1>
      <div style="width: 40px;"></div> <!-- Spacer для выравнивания -->
    </header>

    <div class="settings-content">
      <div class="settings-menu">
        <button 
          class="menu-item" 
          @click="goToNotifications"
        >
          <span class="menu-icon">🔔</span>
          <div class="menu-content">
            <span class="menu-title">{{ t('settings.notifications.title') }}</span>
            <span class="menu-description">{{ t('settings.notifications.description') }}</span>
          </div>
          <span class="menu-arrow">→</span>
        </button>

        <button 
          class="menu-item" 
          @click="goToAbout"
        >
          <span class="menu-icon">ℹ️</span>
          <div class="menu-content">
            <span class="menu-title">{{ t('settings.about.title') }}</span>
            <span class="menu-description">{{ t('settings.about.description') }}</span>
      </div>
          <span class="menu-arrow">→</span>
        </button>

        <button 
          class="menu-item" 
          @click="goToShare"
        >
          <span class="menu-icon">📤</span>
          <div class="menu-content">
            <span class="menu-title">{{ t('settings.share.title') }}</span>
            <span class="menu-description">{{ t('settings.share.description') }}</span>
        </div>
          <span class="menu-arrow">→</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from '@/composables/useI18n'

const router = useRouter()
const { t } = useI18n()

function goBack() {
  router.push('/')
}

function goToNotifications() {
  router.push('/settings/notifications')
}

function goToAbout() {
  router.push('/settings/about')
}

function goToShare() {
  router.push('/settings/share')
}
</script>

<style scoped>
.settings-view {
  min-height: 100vh;
  background: var(--bg-primary);
  padding-bottom: 2rem;
  padding-top: 60px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
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

.settings-menu {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  width: 100%;
}

.menu-item:hover {
  background: var(--bg-hover);
  border-color: #4f46e5;
  transform: translateX(4px);
}

.menu-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.menu-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.menu-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.menu-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.menu-arrow {
  font-size: 1.25rem;
  color: var(--text-secondary);
  flex-shrink: 0;
}
</style>

