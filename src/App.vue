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
          <button class="theme-toggle" @click="themeStore.toggleTheme" :title="themeStore.isDark ? 'Светлая тема' : 'Темная тема'">
            <span v-if="themeStore.isDark">☀️</span>
            <span v-else>🌙</span>
          </button>
        </div>
      </div>
    </nav>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useHabitsStore } from './stores/habitsStore'
import { useThemeStore } from './stores/themeStore'

const store = useHabitsStore()
const themeStore = useThemeStore()

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

.theme-toggle {
  background: var(--bg-tertiary);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.25rem;
  transition: all 0.3s ease;
  margin-left: 1rem;
}

.theme-toggle:hover {
  background: var(--bg-hover);
  border-color: var(--primary-color);
  transform: scale(1.1);
}

.main-content {
  min-height: calc(100vh - 80px);
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

