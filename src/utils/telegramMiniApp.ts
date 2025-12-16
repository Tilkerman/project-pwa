// Утилита для работы с Telegram Mini App API
// Использует @twa-dev/sdk для интеграции с Telegram Web Apps

import { initDataRaw, initData, viewport, backButton, mainButton, themeParams, initDataUnsafe } from '@twa-dev/sdk'

// Дополнительная проверка на Telegram по User-Agent (на случай, если WebApp не проинициализировался)
function isTelegramUserAgent(): boolean {
  try {
    return typeof navigator !== 'undefined' && /Telegram/i.test(navigator.userAgent)
  } catch {
    return false
  }
}

/**
 * Проверяет, запущено ли приложение внутри Telegram Mini App
 */
export function isTelegramMiniApp(): boolean {
  if (typeof window === 'undefined') return false
  
  // Проверяем наличие Telegram WebApp API
  return !!(
    window.Telegram?.WebApp ||
    (window as any).TelegramWebApp ||
    initDataRaw !== undefined ||
    isTelegramUserAgent()
  )
}

/**
 * Получает данные пользователя Telegram (если доступны)
 */
export function getTelegramUser() {
  if (!isTelegramMiniApp()) return null
  
  try {
    // Используем initDataUnsafe из SDK или напрямую из window
    const user = initDataUnsafe?.user || (window as any).Telegram?.WebApp?.initDataUnsafe?.user
    return user || null
  } catch (error) {
    console.warn('⚠️ Не удалось получить данные пользователя Telegram:', error)
    return null
  }
}

/**
 * Инициализирует Telegram Mini App
 * Вызывает tg.ready() и tg.expand() для правильной работы
 */
export function initTelegramMiniApp() {
  if (!isTelegramMiniApp()) {
    console.log('ℹ️ Приложение запущено не в Telegram Mini App')
    return null
  }

  try {
    const tg = (window as any).Telegram?.WebApp || (window as any).TelegramWebApp
    
    if (!tg) {
      console.warn('⚠️ Telegram WebApp API не найден')
      return null
    }

    // Инициализация
    tg.ready()
    tg.expand() // Разворачиваем на весь экран
    
    console.log('✅ Telegram Mini App инициализирован')
    
    return {
      // Данные пользователя
      user: tg.initDataUnsafe?.user || null,
      
      // Тема Telegram
      theme: tg.colorScheme || 'light', // 'light' или 'dark'
      backgroundColor: tg.backgroundColor || '#ffffff',
      
      // Методы управления
      close: () => {
        try {
          tg.close()
        } catch (error) {
          console.warn('⚠️ Не удалось закрыть приложение:', error)
        }
      },
      
      showAlert: (message: string) => {
        try {
          tg.showAlert(message)
        } catch (error) {
          console.warn('⚠️ Не удалось показать alert:', error)
        }
      },
      
      showConfirm: (message: string): Promise<boolean> => {
        return new Promise((resolve) => {
          try {
            tg.showConfirm(message, (confirmed: boolean) => {
              resolve(confirmed)
            })
          } catch (error) {
            console.warn('⚠️ Не удалось показать confirm:', error)
            resolve(false)
          }
        })
      },
      
      // Вибрация (Haptic Feedback)
      vibrate: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') => {
        try {
          tg.HapticFeedback?.impactOccurred(style)
        } catch (error) {
          console.warn('⚠️ Вибрация недоступна:', error)
        }
      },
      
      // Уведомление об успехе
      notifySuccess: () => {
        try {
          tg.HapticFeedback?.notificationOccurred('success')
        } catch (error) {
          console.warn('⚠️ Уведомление недоступно:', error)
        }
      },
      
      // Уведомление об ошибке
      notifyError: () => {
        try {
          tg.HapticFeedback?.notificationOccurred('error')
        } catch (error) {
          console.warn('⚠️ Уведомление недоступно:', error)
        }
      },
      
      // Получить версию Telegram
      version: tg.version || 'unknown',
      
      // Проверить, является ли пользователь ботом
      isBot: tg.initDataUnsafe?.user?.is_bot || false,
    }
  } catch (error) {
    console.error('❌ Ошибка при инициализации Telegram Mini App:', error)
    return null
  }
}

/**
 * Получает тему Telegram для применения в приложении
 */
export function getTelegramTheme() {
  if (!isTelegramMiniApp()) return null
  
  try {
    const tg = (window as any).Telegram?.WebApp || (window as any).TelegramWebApp
    if (!tg) return null
    
    const colorScheme = tg.colorScheme || 'light'
    // Если цвет фона не определен, используем цвет по умолчанию в зависимости от темы
    let backgroundColor = tg.backgroundColor || tg.themeParams?.bg_color
    if (!backgroundColor) {
      backgroundColor = colorScheme === 'dark' ? '#212121' : '#ffffff'
    }
    
    return {
      colorScheme,
      backgroundColor,
      textColor: tg.themeParams?.text_color || (colorScheme === 'dark' ? '#ffffff' : '#000000'),
      hintColor: tg.themeParams?.hint_color || (colorScheme === 'dark' ? '#999999' : '#666666'),
      linkColor: tg.themeParams?.link_color || '#2481cc',
      buttonColor: tg.themeParams?.button_color || '#2481cc',
      buttonTextColor: tg.themeParams?.button_text_color || '#ffffff',
      secondaryBgColor: tg.themeParams?.secondary_bg_color || (colorScheme === 'dark' ? '#1f2937' : '#f1f1f1'),
    }
  } catch (error) {
    console.warn('⚠️ Не удалось получить тему Telegram:', error)
    return null
  }
}

/**
 * Настраивает главную кнопку Telegram (Main Button)
 */
export function setupTelegramMainButton(text: string, onClick: () => void, isVisible: boolean = true) {
  if (!isTelegramMiniApp()) return
  
  try {
    const tg = (window as any).Telegram?.WebApp || (window as any).TelegramWebApp
    if (!tg || !tg.MainButton) return
    
    tg.MainButton.setText(text)
    tg.MainButton.onClick(onClick)
    if (isVisible) {
      tg.MainButton.show()
    } else {
      tg.MainButton.hide()
    }
  } catch (error) {
    console.warn('⚠️ Не удалось настроить главную кнопку:', error)
  }
}

/**
 * Настраивает кнопку "Назад" в Telegram
 */
export function setupTelegramBackButton(onClick: () => void, isVisible: boolean = true) {
  if (!isTelegramMiniApp()) return
  
  try {
    const tg = (window as any).Telegram?.WebApp || (window as any).TelegramWebApp
    if (!tg || !tg.BackButton) return
    
    tg.BackButton.onClick(onClick)
    if (isVisible) {
      tg.BackButton.show()
    } else {
      tg.BackButton.hide()
    }
  } catch (error) {
    console.warn('⚠️ Не удалось настроить кнопку "Назад":', error)
  }
}

