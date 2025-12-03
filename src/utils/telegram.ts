// Утилита для отправки уведомлений через Telegram Bot API

import { TELEGRAM_BOT_TOKEN, isTelegramBotConfigured } from '@/config/telegram'

interface TelegramConfig {
  chatId: string
  enabled: boolean
}

const TELEGRAM_CONFIG_KEY = 'telegram_notification_config'

// Получение конфигурации Telegram из localStorage
export function getTelegramConfig(): TelegramConfig | null {
  try {
    const config = localStorage.getItem(TELEGRAM_CONFIG_KEY)
    if (!config) return null
    return JSON.parse(config)
  } catch (error) {
    console.error('Ошибка при получении конфигурации Telegram:', error)
    return null
  }
}

// Сохранение конфигурации Telegram в localStorage и IndexedDB (для Service Worker)
export async function saveTelegramConfig(config: TelegramConfig): Promise<void> {
  try {
    // Сохраняем только chatId и enabled, токен бота берется из конфига
    const configToSave = {
      chatId: config.chatId,
      enabled: config.enabled,
    }
    localStorage.setItem(TELEGRAM_CONFIG_KEY, JSON.stringify(configToSave))
    
    // Также сохраняем в IndexedDB для доступа из Service Worker
    try {
      const request = indexedDB.open('NotificationCache', 1)
      request.onsuccess = () => {
        const db = request.result
        const transaction = db.transaction(['cache'], 'readwrite')
        const store = transaction.objectStore('cache')
        // Сохраняем полную конфигурацию с токеном для Service Worker
        store.put({ 
          value: {
            ...configToSave,
            botToken: TELEGRAM_BOT_TOKEN
          } 
        }, 'telegram_config')
      }
      request.onerror = () => {
        // Игнорируем ошибку, если IndexedDB недоступен
      }
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache')
        }
      }
    } catch (error) {
      // Игнорируем ошибку IndexedDB
      console.warn('Не удалось сохранить конфигурацию Telegram в IndexedDB:', error)
    }
  } catch (error) {
    console.error('Ошибка при сохранении конфигурации Telegram:', error)
    throw error
  }
}

// Получение контакта iOS пользователя
export function getIOSContactInfo(): string | null {
  try {
    return localStorage.getItem('ios_telegram_contact')
  } catch (error) {
    console.error('Ошибка при получении контакта iOS пользователя:', error)
    return null
  }
}

// Проверка, включены ли Telegram уведомления
export function isTelegramEnabled(): boolean {
  if (!isTelegramBotConfigured()) return false
  const config = getTelegramConfig()
  // Для iOS также проверяем наличие контакта
  if (/iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    const iosContact = getIOSContactInfo()
    return (config?.enabled === true && !!config?.chatId) || !!iosContact
  }
  return config?.enabled === true && !!config?.chatId
}

// Отправка сообщения через Telegram Bot API
export async function sendTelegramNotification(
  title: string,
  message: string
): Promise<boolean> {
  if (!isTelegramBotConfigured()) {
    console.warn('Telegram бот не настроен')
    return false
  }
  
  const config = getTelegramConfig()
  const iosContact = getIOSContactInfo()
  
  // Определяем chatId для отправки
  let chatId: string | null = null
  
  // Сначала пытаемся использовать сохраненный Chat ID
  if (config?.enabled && config?.chatId) {
    chatId = config.chatId
  }
  // Для iOS пытаемся использовать сохраненный контакт
  else if (iosContact && (/iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))) {
    // Если контакт начинается с @, используем его как username
    if (iosContact.startsWith('@')) {
      chatId = iosContact
    }
    // Если это номер телефона, пытаемся использовать его
    else if (iosContact.startsWith('+') || /^\d{10,15}$/.test(iosContact)) {
      chatId = iosContact
    }
    // Иначе считаем это username
    else {
      chatId = `@${iosContact}`
    }
  }
  
  if (!chatId) {
    console.warn('Telegram уведомления не настроены или отключены')
    return false
  }

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
    const text = `*${title}*\n\n${message}`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown',
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Ошибка при отправке Telegram уведомления:', errorData)
      // Если не получилось отправить по номеру/никнейму, но есть Chat ID, не пытаемся снова
      return false
    }

    console.log('✅ Telegram уведомление отправлено')
    return true
  } catch (error) {
    console.error('Ошибка при отправке Telegram уведомления:', error)
    return false
  }
}

// Проверка валидности chat_id
export async function testTelegramConnection(
  chatId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isTelegramBotConfigured()) {
    return {
      success: false,
      error: 'Telegram бот не настроен администратором',
    }
  }

  try {
    // Проверяем отправку тестового сообщения
    const sendUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
    const sendResponse = await fetch(sendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: '✅ Тестовое сообщение от Трекера Привычек!',
      }),
    })

    if (!sendResponse.ok) {
      const errorData = await sendResponse.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.description || 'Не удалось отправить сообщение. Проверьте Chat ID.',
      }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    }
  }
}

// Получение информации о боте
export async function getBotInfo(): Promise<{
  success: boolean
  username?: string
  firstName?: string
  error?: string
}> {
  if (!isTelegramBotConfigured()) {
    return {
      success: false,
      error: 'Telegram бот не настроен',
    }
  }

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`
    const response = await fetch(url)

    if (!response.ok) {
      return {
        success: false,
        error: 'Неверный токен бота',
      }
    }

    const data = await response.json()
    return {
      success: true,
      username: data.result.username,
      firstName: data.result.first_name,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    }
  }
}

// Отправка сообщения пользователю по username с просьбой отправить команду боту
export async function sendSetupMessageToUser(
  username: string
): Promise<{ success: boolean; botUsername?: string; error?: string }> {
  if (!isTelegramBotConfigured()) {
    return {
      success: false,
      error: 'Telegram бот не настроен',
    }
  }

  try {
    const botInfo = await getBotInfo()
    if (!botInfo.success || !botInfo.username) {
      return {
        success: false,
        error: 'Не удалось получить информацию о боте',
      }
    }

    const botUsername = botInfo.username
    const message = `👋 Привет! Для подключения уведомлений отправьте мне команду /start или любое сообщение.`

    // Пытаемся отправить сообщение пользователю
    // Если username начинается с @, убираем его
    const cleanUsername = username.startsWith('@') ? username.substring(1) : username
    
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: `@${cleanUsername}`,
        text: message,
      }),
    })

    // Если не получилось отправить по username, возвращаем инструкцию
    if (!response.ok) {
      return {
        success: false,
        botUsername: botUsername,
        error: 'Не удалось отправить сообщение. Убедитесь, что ваш username правильный и вы не заблокировали бота.',
      }
    }

    return {
      success: true,
      botUsername: botUsername,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    }
  }
}

