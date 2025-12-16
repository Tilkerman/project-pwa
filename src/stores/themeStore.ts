import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { isTelegramMiniApp, getTelegramTheme } from '@/utils/telegramMiniApp'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(false)

  // Загружаем тему из localStorage при инициализации
  function initTheme() {
    // Сначала проверяем, запущено ли приложение в Telegram Mini App
    if (isTelegramMiniApp()) {
      const telegramTheme = getTelegramTheme()
      if (telegramTheme) {
        // Используем тему из Telegram
        isDark.value = telegramTheme.colorScheme === 'dark'
        applyTheme()
        applyTelegramTheme(telegramTheme)
        return
      }
    }

    // Если не в Telegram, используем стандартную логику
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

  // Применяем цвета Telegram к документу
  function applyTelegramTheme(theme: any) {
    if (!theme) return
    
    const root = document.documentElement
    const body = document.body
    const html = document.documentElement
    
    // Устанавливаем класс dark если тема темная
    if (theme.colorScheme === 'dark') {
      root.classList.add('dark')
      console.log('✅ Класс dark установлен из applyTelegramTheme')
    } else {
      root.classList.remove('dark')
      console.log('✅ Класс dark удален из applyTelegramTheme')
    }
    
    // Применяем фон Telegram к body и html с высоким приоритетом
    if (theme.backgroundColor) {
      root.style.setProperty('--tg-bg-color', theme.backgroundColor)
      // Используем setProperty с important для переопределения CSS
      body.style.setProperty('background-color', theme.backgroundColor, 'important')
      html.style.setProperty('background-color', theme.backgroundColor, 'important')
      // Также устанавливаем напрямую для совместимости
      body.style.backgroundColor = theme.backgroundColor
      html.style.backgroundColor = theme.backgroundColor
      
      // Устанавливаем цвет заголовка Telegram
      try {
        const tg = (window as any).Telegram?.WebApp || (window as any).TelegramWebApp
        if (tg && tg.setHeaderColor) {
          // Используем ключ темы 'bg_color' для автоматического соответствия
          try {
            tg.setHeaderColor('bg_color')
            console.log('✅ Цвет заголовка Telegram установлен из themeStore через bg_color')
          } catch (e) {
            // Fallback: передаем цвет напрямую
            tg.setHeaderColor(theme.backgroundColor)
            console.log('✅ Цвет заголовка Telegram установлен из themeStore напрямую:', theme.backgroundColor)
          }
        }
      } catch (error) {
        console.warn('⚠️ Не удалось установить цвет заголовка из themeStore:', error)
      }
    }
    
    // Применяем цвета Telegram как CSS переменные (опционально)
    if (theme.textColor) {
      root.style.setProperty('--tg-text-color', theme.textColor)
    }
    if (theme.buttonColor) {
      root.style.setProperty('--tg-button-color', theme.buttonColor)
    }
    if (theme.buttonTextColor) {
      root.style.setProperty('--tg-button-text-color', theme.buttonTextColor)
    }
  }

  // Применяем тему к документу
  function applyTheme() {
    const root = document.documentElement
    
    if (isDark.value) {
      root.classList.add('dark')
      // Устанавливаем темный фон
      const darkBg = '#212121'
      root.style.setProperty('background-color', darkBg, 'important')
      if (document.body) {
        document.body.style.setProperty('background-color', darkBg, 'important')
      }
      console.log('✅ Темная тема применена')
    } else {
      root.classList.remove('dark')
      // Устанавливаем светлый фон
      const lightBg = '#ffffff'
      root.style.setProperty('background-color', lightBg, 'important')
      if (document.body) {
        document.body.style.setProperty('background-color', lightBg, 'important')
      }
      console.log('✅ Светлая тема применена')
    }
    
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  }

  // Переключаем тему
  function toggleTheme() {
    isDark.value = !isDark.value
    applyTheme()
    
    // Если в Telegram, также обновляем фон и синхронизируем с Telegram
    if (isTelegramMiniApp()) {
      const telegramTheme = getTelegramTheme()
      if (telegramTheme) {
        // Обновляем тему Telegram в соответствии с переключением
        const newColorScheme = isDark.value ? 'dark' : 'light'
        // Применяем тему с обновленным colorScheme
        applyTelegramTheme({
          ...telegramTheme,
          colorScheme: newColorScheme
        })
      } else {
        // Если тема Telegram недоступна, применяем стандартные цвета
        const bgColor = isDark.value ? '#212121' : '#ffffff'
        if (document.body) {
          document.body.style.setProperty('background-color', bgColor, 'important')
        }
        if (document.documentElement) {
          document.documentElement.style.setProperty('background-color', bgColor, 'important')
        }
      }
    }
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


