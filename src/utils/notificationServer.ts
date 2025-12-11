// Утилита для работы с сервером уведомлений
// Сервер работает на Render.com и отправляет уведомления по расписанию

// URL сервера уведомлений (замените на ваш URL после деплоя)
const NOTIFICATION_SERVER_URL =
  (typeof import.meta !== 'undefined'
    ? import.meta.env.VITE_NOTIFICATION_SERVER_URL
    : undefined) ||
  'http://localhost:3000' // Для локальной разработки

interface Habit {
  id: string
  name: string
  notificationTime?: string
  notificationEnabled: boolean
  customNotificationMessage?: string
  character: 'babushka' | 'gopnik' | 'teacher' | 'grandpa'
}

/**
 * Отправляет расписание уведомления на сервер
 */
export async function scheduleNotificationOnServer(
  habit: Habit,
  chatId: string
): Promise<{ success: boolean; error?: string }> {
  if (!NOTIFICATION_SERVER_URL) {
    console.warn('⚠️ Сервер уведомлений не настроен')
    return { success: false, error: 'Server not configured' }
  }

  if (!habit.notificationEnabled || !habit.notificationTime) {
    // Если уведомления отключены, удаляем расписание с сервера
    return await removeNotificationFromServer(habit.id)
  }

  try {
    const response = await fetch(`${NOTIFICATION_SERVER_URL}/api/schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        habitId: habit.id,
        chatId: chatId,
        habit: {
          name: habit.name,
          notificationTime: habit.notificationTime,
          notificationEnabled: habit.notificationEnabled,
          customNotificationMessage: habit.customNotificationMessage,
          character: habit.character,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.error || 'Failed to schedule notification',
      }
    }

    console.log(`✅ Расписание уведомления отправлено на сервер для "${habit.name}"`)
    return { success: true }
  } catch (error) {
    console.error('Ошибка при отправке расписания на сервер:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Удаляет расписание уведомления с сервера
 */
export async function removeNotificationFromServer(
  habitId: string
): Promise<{ success: boolean; error?: string }> {
  if (!NOTIFICATION_SERVER_URL) {
    return { success: false, error: 'Server not configured' }
  }

  try {
    const response = await fetch(`${NOTIFICATION_SERVER_URL}/api/schedule/${habitId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.error || 'Failed to remove notification',
      }
    }

    console.log(`✅ Расписание уведомления удалено с сервера для привычки ${habitId}`)
    return { success: true }
  } catch (error) {
    console.error('Ошибка при удалении расписания с сервера:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Проверяет доступность сервера уведомлений
 */
export async function checkServerHealth(): Promise<boolean> {
  if (!NOTIFICATION_SERVER_URL) {
    return false
  }

  try {
    const response = await fetch(`${NOTIFICATION_SERVER_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // Таймаут 5 секунд
    })
    return response.ok
  } catch (error) {
    console.warn('Сервер уведомлений недоступен:', error)
    return false
  }
}

