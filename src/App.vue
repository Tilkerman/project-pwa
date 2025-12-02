<template>
  <div id="app">
    <nav class="navbar">
      <div class="nav-container">
        <router-link to="/" class="nav-logo">
          <span class="logo-icon">📅</span>
          <span class="logo-text">Трекер Привычек</span>
        </router-link>
        <div class="nav-links">
          <router-link to="/" class="nav-link">Главная</router-link>
          <router-link to="/stats" class="nav-link">Статистика</router-link>
          <router-link to="/achievements" class="nav-link">Достижения</router-link>
          <div class="theme-toggle-container">
            <span class="theme-label">🌙</span>
            <label class="ios-toggle">
              <input type="checkbox" :checked="!themeStore.isDark" @change="themeStore.toggleTheme">
              <span class="ios-toggle-slider"></span>
            </label>
            <span class="theme-label">☀️</span>
          </div>
        </div>
      </div>
    </nav>
    <main class="main-content">
      <router-view />
    </main>
    <div class="pixel-grandma" aria-hidden="true"></div>
    <footer class="app-footer">
      © {{ currentYear }} Трекер Привычек · October · v{{ appVersion }}
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useHabitsStore } from './stores/habitsStore'
import { useThemeStore } from './stores/themeStore'

const store = useHabitsStore()
const themeStore = useThemeStore()
const currentYear = new Date().getFullYear()
const appVersion = __APP_VERSION__ ?? '1.0.0'

onMounted(async () => {
  themeStore.initTheme()
  await store.loadHabits()
})
</script>

<style>
#app {
  min-height: 100vh;
  background: var(--bg-primary);
  transition: background-color 0.3s ease;
}

.navbar {
  background: var(--bg-secondary);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 100;
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: var(--text-primary);
  font-size: 1.25rem;
  font-weight: 700;
  transition: color 0.3s ease;
}

.logo-icon {
  font-size: 1.5rem;
}

.nav-links {
  display: flex;
  gap: 2rem;
}

.nav-link {
  text-decoration: none;
  color: var(--text-secondary);
  font-weight: 500;
  transition: color 0.2s;
  position: relative;
}

.nav-link:hover {
  color: var(--primary-color);
}

.nav-link.router-link-active {
  color: var(--primary-color);
}

.nav-link.router-link-active::after {
  content: '';
  position: absolute;
  bottom: -0.5rem;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--primary-color);
  border-radius: 2px;
}

.theme-toggle-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: 1rem;
}

.theme-label {
  font-size: 1.125rem;
  user-select: none;
}

.ios-toggle {
  position: relative;
  display: inline-block;
  width: 51px;
  height: 31px;
}

.ios-toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.ios-toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--bg-tertiary);
  transition: 0.3s;
  border-radius: 34px;
  border: 1px solid var(--border-color);
}

.ios-toggle-slider:before {
  position: absolute;
  content: "";
  height: 27px;
  width: 27px;
  left: 2px;
  bottom: 1px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.ios-toggle input:checked + .ios-toggle-slider {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

.ios-toggle input:checked + .ios-toggle-slider:before {
  transform: translateX(20px);
}

.ios-toggle input:focus + .ios-toggle-slider {
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2);
}

.ios-toggle:hover .ios-toggle-slider {
  border-color: var(--primary-color);
}

.main-content {
  min-height: calc(100vh - 80px);
}

.pixel-grandma {
  position: fixed;
  right: 2rem;
  bottom: 5rem;
  width: 8px;
  height: 8px;
  pointer-events: none;
  z-index: 0;
  opacity: 0.8;
  image-rendering: pixelated;
}

.pixel-grandma::before {
  content: '';
  display: block;
  width: 4px;
  height: 4px;
  background: transparent;
  /* Простая пиксельная бабушка: волосы, лицо, платье */
  box-shadow:
    /* волосы */ 
    8px 0 #4b5563,
    12px 0 #4b5563,
    4px 4px #4b5563,
    8px 4px #4b5563,
    12px 4px #4b5563,
    16px 4px #4b5563,
    /* лицо */
    8px 8px #f9d7b5,
    12px 8px #f9d7b5,
    8px 12px #f9d7b5,
    12px 12px #f9d7b5,
    /* очки */
    6px 8px #111827,
    14px 8px #111827,
    /* платье */
    6px 16px var(--primary-color),
    10px 16px var(--primary-color),
    14px 16px var(--primary-color),
    6px 20px var(--primary-color),
    10px 20px var(--primary-color),
    14px 20px var(--primary-color),
    /* ноги */
    8px 24px #374151,
    12px 24px #374151;
}

.app-footer {
  border-top: 1px solid var(--border-color);
  padding: 1rem 2rem;
  text-align: center;
  font-size: 0.875rem;
  color: var(--text-secondary);
  background: var(--bg-secondary);
}

/* Адаптивность */
@media (max-width: 768px) {
  .nav-container {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
  }

  .nav-links {
    gap: 1rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  .nav-logo {
    font-size: 1.125rem;
  }
}

@media (max-width: 480px) {
  .nav-links {
    font-size: 0.875rem;
  }
}
</style>

