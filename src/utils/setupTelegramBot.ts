// Утилита для настройки Telegram бота с кнопкой меню для Mini App
// Использует существующий токен бота из config/telegram.ts

import { TELEGRAM_BOT_TOKEN, isTelegramBotConfigured } from '@/config/telegram'

const BOT_API_URL = 'https://api.telegram.org/bot'

/**
 * Устанавливает кнопку меню в Telegram боте для открытия Mini App
 * @param webAppUrl URL вашего приложения (например: https://tilkerman.github.io/project-pwa/)
 */
export async function setupTelegramBotMenu(webAppUrl: string): Promise<{
  success: boolean
  message?: string
  error?: string
}> {
  if (!isTelegramBotConfigured()) {
    return {
      success: false,
      error: 'Telegram бот не настроен. Укажите токен в src/config/telegram.ts',
    }
  }

  try {
    const url = `${BOT_API_URL}${TELEGRAM_BOT_TOKEN}/setChatMenuButton`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        menu_button: {
          type: 'web_app',
          text: 'Открыть приложение',
          web_app: {
            url: webAppUrl,
          },
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.description || 'Не удалось установить кнопку меню',
      }
    }

    return {
      success: true,
      message: '✅ Кнопка меню успешно установлена! Теперь пользователи увидят кнопку "Открыть приложение" в вашем боте.',
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    }
  }
}

/**
 * Удаляет кнопку меню из бота
 */
export async function removeTelegramBotMenu(): Promise<{
  success: boolean
  message?: string
  error?: string
}> {
  if (!isTelegramBotConfigured()) {
    return {
      success: false,
      error: 'Telegram бот не настроен',
    }
  }

  try {
    const url = `${BOT_API_URL}${TELEGRAM_BOT_TOKEN}/setChatMenuButton`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        menu_button: {
          type: 'default',
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.description || 'Не удалось удалить кнопку меню',
      }
    }

    return {
      success: true,
      message: '✅ Кнопка меню удалена',
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    }
  }
}

/**
 * Получает текущую настройку кнопки меню
 */
export async function getTelegramBotMenu(): Promise<{
  success: boolean
  menuButton?: any
  error?: string
}> {
  if (!isTelegramBotConfigured()) {
    return {
      success: false,
      error: 'Telegram бот не настроен',
    }
  }

  try {
    const url = `${BOT_API_URL}${TELEGRAM_BOT_TOKEN}/getChatMenuButton`
    
    const response = await fetch(url, {
      method: 'GET',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.description || 'Не удалось получить настройки кнопки меню',
      }
    }

    const data = await response.json()
    return {
      success: true,
      menuButton: data.result,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    }
  }
}

