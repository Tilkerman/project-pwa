<template>
  <div class="about-view">
    <header class="page-header">
      <button class="back-btn" @click="goBack" :aria-label="t('settings.back')">
        <span class="back-icon">←</span>
      </button>
      <h1 class="page-title">{{ t('settings.about.title') }}</h1>
      <div style="width: 40px;"></div> <!-- Spacer для выравнивания -->
    </header>

    <div class="about-content">
      <div class="about-section">
        <h2 class="section-title">{{ t('settings.about.appName') }}</h2>
        <p class="section-text">
          {{ t('settings.about.appDescription') }} 
          Версия {{ appVersion }}
        </p>
        <p class="section-text">
          {{ t('settings.about.offlineInfo') }}
        </p>
      </div>

      <div class="about-section">
        <h2 class="section-title">{{ t('settings.about.philosophy') }}</h2>
        <p class="section-text">
          {{ t('settings.about.philosophyText1') }}
        </p>
        <p class="section-text">
          {{ t('settings.about.philosophyText2') }}
        </p>
      </div>

      <div class="about-section">
        <h2 class="section-title">{{ t('settings.about.advantages') }}</h2>
        <ul class="advantages-list">
          <li>
            <strong>{{ t('settings.about.advantage1') }}</strong> — {{ t('settings.about.advantage1Desc') }}
          </li>
          <li>
            <strong>{{ t('settings.about.advantage2') }}</strong> — {{ t('settings.about.advantage2Desc') }}
          </li>
          <li>
            <strong>{{ t('settings.about.advantage3') }}</strong> — {{ t('settings.about.advantage3Desc') }}
          </li>
          <li>
            <strong>{{ t('settings.about.advantage4') }}</strong> — {{ t('settings.about.advantage4Desc') }}
          </li>
          <li>
            <strong>{{ t('settings.about.advantage5') }}</strong> — {{ t('settings.about.advantage5Desc') }}
          </li>
          <li>
            <strong>{{ t('settings.about.advantage6') }}</strong> — {{ t('settings.about.advantage6Desc') }}
          </li>
          <li>
            <strong>{{ t('settings.about.advantage7') }}</strong> — {{ t('settings.about.advantage7Desc') }}
          </li>
        </ul>
      </div>

      <div class="about-section">
        <h2 class="section-title">{{ t('settings.about.author') }}</h2>
        <p class="section-text">
          {{ t('settings.about.authorText1') }}
        </p>
        <p class="section-text">
          {{ t('settings.about.authorText2') }}
        </p>
      </div>

      <div class="about-section">
        <h2 class="section-title">{{ t('settings.about.technologies') }}</h2>
        <p class="section-text">
          {{ t('settings.about.technologiesText') }}
        </p>
        <ul class="tech-list">
          <li>Vue 3 + TypeScript</li>
          <li>Vite</li>
          <li>Pinia</li>
          <li>IndexedDB для локального хранения</li>
          <li>PWA для работы офлайн</li>
          <li>Telegram Mini App SDK</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from '@/composables/useI18n'

const router = useRouter()
const { t } = useI18n()
const appVersion = __APP_VERSION__ || '1.0.0'

function goBack() {
  router.push('/settings')
}
</script>

<style scoped>
.about-view {
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

.about-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 1.5rem;
}

.about-section {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: var(--shadow-sm);
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
}

.section-text {
  font-size: 0.9375rem;
  color: var(--text-secondary);
  margin: 0 0 1rem 0;
  line-height: 1.6;
}

.section-text:last-child {
  margin-bottom: 0;
}

.advantages-list,
.tech-list {
  margin: 0;
  padding-left: 1.5rem;
  color: var(--text-secondary);
  line-height: 1.8;
}

.advantages-list li,
.tech-list li {
  margin-bottom: 0.75rem;
  font-size: 0.9375rem;
}

.advantages-list li:last-child,
.tech-list li:last-child {
  margin-bottom: 0;
}

.advantages-list strong {
  color: var(--text-primary);
  font-weight: 600;
}
</style>

