// Утилита для работы с сервером уведомлений
// Сервер работает на Render.com и отправляет уведомления по расписанию

// URL сервера уведомлений (замените на ваш URL после деплоя)
// Приоритет: 1) переменная окружения, 2) дефолтный Render.com URL, 3) localhost
const getNotificationServerUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env.VITE_NOTIFICATION_SERVER_URL) {
    return import.meta.env.VITE_NOTIFICATION_SERVER_URL
  }
  
  // Дефолтный URL для Render.com (замените на ваш реальный URL после деплоя)
  const defaultRenderUrl = 'https://habit-tracker-notifications.onrender.com'
  
  // Для локальной разработки используем localhost
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3000'
  }
  
  return defaultRenderUrl
}

const NOTIFICATION_SERVER_URL = getNotificationServerUrl()

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
  if (!NOTIFICATION_SERVER_URL || NOTIFICATION_SERVER_URL.includes('localhost')) {
    console.warn('⚠️ Сервер уведомлений не настроен или использует localhost')
    return { success: false, error: 'Server not configured' }
  }

  if (!habit.notificationEnabled || !habit.notificationTime) {
    // Если уведомления отключены, удаляем расписание с сервера
    return await removeNotificationFromServer(habit.id)
  }

  // Сначала пробуждаем сервер (если он заснул на Render.com)
  try {
    await fetch(`${NOTIFICATION_SERVER_URL}/wake`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    }).catch(() => {
      // Игнорируем ошибки пробуждения
    })
  } catch (error) {
    // Игнорируем ошибки пробуждения
  }

  try {
    // Конвертируем локальное время в UTC для сервера
    const [localHours, localMinutes] = habit.notificationTime.split(':').map(Number)
    const localDate = new Date()
    localDate.setHours(localHours, localMinutes, 0, 0)
    
    // Получаем UTC время
    const utcHours = localDate.getUTCHours()
    const utcMinutes = localDate.getUTCMinutes()
    const utcTime = `${utcHours.toString().padStart(2, '0')}:${utcMinutes.toString().padStart(2, '0')}`
    
    console.log(`📤 Отправка расписания на сервер: ${NOTIFICATION_SERVER_URL}/api/schedule`)
    console.log(`📋 Данные:`, {
      habitId: habit.id,
      chatId: chatId ? `${chatId.substring(0, 3)}***` : 'не указан',
      name: habit.name,
      localTime: habit.notificationTime,
      utcTime: utcTime
    })

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
          notificationTime: utcTime, // Отправляем время в UTC
          notificationEnabled: habit.notificationEnabled,
          customNotificationMessage: habit.customNotificationMessage,
          character: habit.character,
        },
      }),
      signal: AbortSignal.timeout(10000), // Таймаут 10 секунд
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('❌ Ошибка сервера:', errorData)
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
      }
    }

    const result = await response.json().catch(() => ({}))
    console.log(`✅ Расписание уведомления отправлено на сервер для "${habit.name}"`, result)
    
    // Проверяем, что расписание действительно сохранилось
    if (result.success !== false) {
      // Дополнительная проверка через /api/schedules
      try {
        const verifyResponse = await fetch(`${NOTIFICATION_SERVER_URL}/api/schedules`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        })
        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json().catch(() => ({}))
          const savedSchedule = verifyData.schedules?.find((s: any) => s.id === habit.id)
          if (savedSchedule) {
            console.log(`✅ Расписание подтверждено на сервере:`, savedSchedule)
          } else {
            console.warn(`⚠️ Расписание не найдено в списке на сервере (возможно, еще обрабатывается)`)
          }
        }
      } catch (verifyError) {
        console.warn('⚠️ Не удалось проверить сохранение расписания:', verifyError)
      }
    }
    
    return { success: true }
  } catch (error) {
    console.error('❌ Ошибка при отправке расписания на сервер:', error)
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
export async function checkServerHealth(): Promise<{ available: boolean; schedulesCount?: number; error?: string }> {
  if (!NOTIFICATION_SERVER_URL || NOTIFICATION_SERVER_URL.includes('localhost')) {
    return { available: false, error: 'Server URL not configured' }
  }

  try {
    const response = await fetch(`${NOTIFICATION_SERVER_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(10000), // Таймаут 10 секунд (для пробуждения Render.com)
    })
    
    if (response.ok) {
      const data = await response.json().catch(() => ({}))
      return { 
        available: true, 
        schedulesCount: data.schedulesCount || 0 
      }
    }
    
    return { available: false, error: `HTTP ${response.status}` }
  } catch (error) {
    console.warn('⚠️ Сервер уведомлений недоступен:', error)
    return { 
      available: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

