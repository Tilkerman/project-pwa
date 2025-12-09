import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(false)

  // Загружаем тему из localStorage при инициализации
  function initTheme() {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      isDark.value = savedTheme === 'dark'
    } else {
      // Мобильным по умолчанию включаем тёмную, если пользователь ещё не выбирал
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
      const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(ua)
      const prefersDark = typeof window !== 'undefined'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : false
      isDark.value = isMobile ? true : prefersDark
    }
    applyTheme()
  }

  // Применяем тему к документу
  function applyTheme() {
    if (isDark.value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  }

  // Переключаем тему
  function toggleTheme() {
    isDark.value = !isDark.value
    applyTheme()
  }

  // Устанавливаем тему явно
  function setTheme(dark: boolean) {
    isDark.value = dark
    applyTheme()
  }

  // Слушаем изменения системной темы
  if (typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        isDark.value = e.matches
        applyTheme()
      }
    })
  }

  return {
    isDark,
    initTheme,
    toggleTheme,
    setTheme
  }
})


