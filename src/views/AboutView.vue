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
          {{ t('settings.about.appDescription') }} {{ t('settings.about.version') }} {{ appVersion }}
        </p>
        <p class="section-text">
          {{ t('settings.about.usageInfo') }}
        </p>
      </div>

      <div class="about-section">
        <h2 class="section-title">{{ t('settings.about.philosophy.title') }}</h2>
        <p class="section-text">
          {{ t('settings.about.philosophy.text1') }}
        </p>
        <p class="section-text">
          {{ t('settings.about.philosophy.text2') }}
        </p>
      </div>

      <div class="about-section">
        <h2 class="section-title">{{ t('settings.about.advantages.title') }}</h2>
        <ul class="advantages-list">
          <li>
            <strong>{{ t('settings.about.advantages.localStorage') }}</strong> — {{ t('settings.about.advantages.localStorageDesc') }}
          </li>
          <li>
            <strong>{{ t('settings.about.advantages.offline') }}</strong> — {{ t('settings.about.advantages.offlineDesc') }}
          </li>
          <li>
            <strong>{{ t('settings.about.advantages.characters') }}</strong> — {{ t('settings.about.advantages.charactersDesc') }}
          </li>
          <li>
            <strong>{{ t('settings.about.advantages.achievements') }}</strong> — {{ t('settings.about.advantages.achievementsDesc') }}
          </li>
          <li>
            <strong>{{ t('settings.about.advantages.notifications') }}</strong> — {{ t('settings.about.advantages.notificationsDesc') }}
          </li>
          <li>
            <strong>{{ t('settings.about.advantages.telegram') }}</strong> — {{ t('settings.about.advantages.telegramDesc') }}
          </li>
          <li>
            <strong>{{ t('settings.about.advantages.responsive') }}</strong> — {{ t('settings.about.advantages.responsiveDesc') }}
          </li>
        </ul>
      </div>

      <div class="about-section">
        <h2 class="section-title">{{ t('settings.about.author.title') }}</h2>
        <p class="section-text">
          {{ t('settings.about.author.text1') }}
        </p>
        <p class="section-text">
          {{ t('settings.about.author.text2') }}
        </p>
      </div>

      <div class="about-section">
        <h2 class="section-title">{{ t('settings.about.tech.title') }}</h2>
        <p class="section-text">
          {{ t('settings.about.tech.text') }}
        </p>
        <ul class="tech-list">
          <li>{{ t('settings.about.tech.vue') }}</li>
          <li>{{ t('settings.about.tech.vite') }}</li>
          <li>{{ t('settings.about.tech.pinia') }}</li>
          <li>{{ t('settings.about.tech.indexeddb') }}</li>
          <li>{{ t('settings.about.tech.pwa') }}</li>
          <li>{{ t('settings.about.tech.telegram') }}</li>
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

