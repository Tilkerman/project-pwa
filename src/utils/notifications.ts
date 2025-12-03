import type { Habit } from '@/types'
import { getCharacterMessage } from './characters'
import { sendTelegramNotification, isTelegramEnabled } from './telegram'

// Хранилище для timeout ID, чтобы можно было их очищать
const notificationTimeouts = new Map<string, number>()
const notificationIntervals = new Map<string, number>()

// Регистрация периодической проверки в Service Worker
let periodicSyncRegistered = false

// Определение iOS устройства
function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

// Определение, установлено ли приложение как PWA
function isStandalone(): boolean {
  return (window.matchMedia('(display-mode: standalone)').matches) ||
         ((window.navigator as any).standalone === true) ||
         document.referrer.includes('android-app://')
}

async function registerPeriodicSync(): Promise<void> {
  if (periodicSyncRegistered) return
  
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready
      
      // Пытаемся зарегистрировать Periodic Background Sync (работает на Android Chrome)
      // @ts-ignore - PeriodicBackgroundSync может быть не в типах
      if ('PeriodicBackgroundSync' in window && registration.periodicSync) {
        try {
          // @ts-ignore
          await registration.periodicSync.register('check-notifications', {
            minInterval: 60 * 1000 // Минимум 1 минута (браузер может увеличить интервал)
          })
          periodicSyncRegistered = true
          console.log('✅ Периодическая фоновая синхронизация зарегистрирована')
        } catch (error) {
          console.warn('⚠️ Periodic Background Sync не доступен:', error)
        }
      }
      
      // Всегда отправляем сообщение Service Worker для запуска проверки
      // Это работает как fallback и для браузеров без Periodic Background Sync
      if (registration.active) {
        registration.active.postMessage({ type: 'START_PERIODIC_CHECK' })
        periodicSyncRegistered = true
        console.log('✅ Периодическая проверка запущена в Service Worker')
      } else if (registration.waiting) {
        registration.waiting.postMessage({ type: 'START_PERIODIC_CHECK' })
        periodicSyncRegistered = true
      } else if (registration.installing) {
        registration.installing.addEventListener('statechange', () => {
          if (registration.installing?.state === 'activated') {
            registration.installing.postMessage({ type: 'START_PERIODIC_CHECK' })
            periodicSyncRegistered = true
          }
        })
      }
    } catch (error) {
      console.warn('⚠️ Ошибка при запуске периодической проверки:', error)
    }
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('Браузер не поддерживает уведомления')
    return false
  }

  if (Notification.permission === 'granted') {
    console.log('✅ Разрешение на уведомления уже предоставлено')
    return true
  }

  if (Notification.permission === 'denied') {
    console.warn('❌ Разрешение на уведомления отклонено пользователем')
    alert('Для работы уведомлений необходимо разрешить их в настройках браузера')
    return false
  }

  if (Notification.permission === 'default') {
    console.log('📢 Запрашиваем разрешение на уведомления...')
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      console.log('✅ Разрешение на уведомления получено!')
      return true
    } else {
      console.warn('❌ Разрешение на уведомления отклонено')
      return false
    }
  }

  return false
}

export async function scheduleNotifications(habit: Habit): Promise<void> {
  if (!habit.notificationEnabled || !habit.notificationTime) {
    console.log('⏸️ Уведомления отключены для привычки:', habit.name)
    clearNotifications(habit.id)
    return
  }

  // Проверяем разрешение перед планированием
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    console.warn('⚠️ Нет разрешения на уведомления для привычки:', habit.name)
    return
  }

  // Для iOS показываем предупреждение о ограничениях
  if (isIOS() && !isStandalone()) {
    console.warn('⚠️ Для работы уведомлений на iOS необходимо установить приложение на главный экран')
  }

  // Регистрируем периодическую проверку в Service Worker
  await registerPeriodicSync()

  // Очищаем существующие уведомления для этой привычки
  clearNotifications(habit.id)

  const [hours, minutes] = habit.notificationTime.split(':').map(Number)
  const now = new Date()
  const notificationTime = new Date()
  notificationTime.setHours(hours, minutes, 0, 0)

  // Если время уже прошло сегодня, планируем на завтра
  if (notificationTime <= now) {
    notificationTime.setDate(notificationTime.getDate() + 1)
  }

  const timeUntilNotification = notificationTime.getTime() - now.getTime()
  
  console.log(`📅 Планируем уведомление для "${habit.name}" на ${notificationTime.toLocaleString('ru-RU')} (через ${Math.round(timeUntilNotification / 1000 / 60)} минут)`)

  // Планируем уведомление для случая, когда приложение открыто
  const timeoutId = window.setTimeout(async () => {
    console.log(`🔔 Время уведомления для "${habit.name}"!`)
    await showNotification(habit)
    // Планируем повторяющееся уведомление
    await scheduleRecurringNotification(habit)
  }, timeUntilNotification)

  notificationTimeouts.set(habit.id, timeoutId)
  
  // Также отправляем информацию в Service Worker для фоновой проверки
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready
      registration.active?.postMessage({
        type: 'SCHEDULE_NOTIFICATION',
        habit: {
          id: habit.id,
          name: habit.name,
          notificationTime: habit.notificationTime,
          notificationEnabled: habit.notificationEnabled,
          customNotificationMessage: habit.customNotificationMessage,
          character: habit.character
        }
      })
    } catch (error) {
      console.warn('⚠️ Ошибка при отправке расписания в Service Worker:', error)
    }
  }

  // Для iOS: сохраняем расписание в localStorage для восстановления при следующем открытии
  if (isIOS()) {
    try {
      const schedules = JSON.parse(localStorage.getItem('ios_notification_schedules') || '{}')
      schedules[habit.id] = {
        time: habit.notificationTime,
        enabled: habit.notificationEnabled,
        lastCheck: new Date().toISOString()
      }
      localStorage.setItem('ios_notification_schedules', JSON.stringify(schedules))
    } catch (error) {
      console.warn('⚠️ Ошибка при сохранении расписания для iOS:', error)
    }
  }
}

async function scheduleRecurringNotification(habit: Habit): Promise<void> {
  // Очищаем предыдущий интервал, если есть
  const existingInterval = notificationIntervals.get(habit.id)
  if (existingInterval) {
    clearInterval(existingInterval)
  }

  const interval = 24 * 60 * 60 * 1000 // 24 часа

  const intervalId = window.setInterval(async () => {
    // Проверяем актуальное состояние привычки
    if (habit.notificationEnabled && Notification.permission === 'granted') {
      console.log(`🔔 Повторяющееся уведомление для "${habit.name}"`)
      await showNotification(habit)
    } else {
      // Если уведомления отключены, очищаем интервал
      clearInterval(intervalId)
      notificationIntervals.delete(habit.id)
    }
  }, interval)

  notificationIntervals.set(habit.id, intervalId)
}

export async function showNotification(habit: Habit): Promise<void> {
  // Пытаемся использовать Service Worker для показа уведомления (работает даже когда приложение закрыто)
  if ('serviceWorker' in navigator && 'Notification' in window && Notification.permission === 'granted') {
    try {
      const registration = await navigator.serviceWorker.ready
      const character = habit.character
      const characterName = character === 'babushka' ? 'Добрая Бабушка' :
                            character === 'gopnik' ? 'Гопник' :
                            character === 'teacher' ? 'Строгий Учитель' :
                            character === 'grandpa' ? 'Старый Дед' : 'Друг'
      
      // Используем пользовательское сообщение, если оно есть, иначе - сообщение персонажа
      const message = habit.customNotificationMessage || getCharacterMessage(habit.character, habit, 'daily')
      
      const title = `${characterName} напоминает: ${habit.name}`
      
      const options: NotificationOptions = {
        body: message,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        tag: `habit-${habit.id}`,
        requireInteraction: false,
        silent: false,
        vibrate: [200, 100, 200],
        data: {
          habitId: habit.id,
          url: '/'
        }
      }

      await registration.showNotification(title, options)
      console.log(`✅ Уведомление отправлено для "${habit.name}" через Service Worker`)
      
      // Также отправляем через Telegram, если настроено
      if (isTelegramEnabled()) {
        await sendTelegramNotification(title, message).catch(error => {
          console.warn('⚠️ Ошибка при отправке Telegram уведомления:', error)
        })
      }
      
      return
    } catch (error) {
      console.warn('⚠️ Не удалось показать уведомление через Service Worker, используем обычный способ:', error)
    }
  }

  // Fallback: используем обычный способ (работает только когда приложение открыто)
  if (!('Notification' in window)) {
    console.warn('Браузер не поддерживает уведомления')
    return
  }

  if (Notification.permission !== 'granted') {
    console.warn('Нет разрешения на уведомления')
    return
  }

  const character = habit.character
  const characterName = character === 'babushka' ? 'Добрая Бабушка' :
                        character === 'gopnik' ? 'Гопник' :
                        character === 'teacher' ? 'Строгий Учитель' :
                        character === 'grandpa' ? 'Старый Дед' : 'Друг'
  
  // Используем пользовательское сообщение, если оно есть, иначе - сообщение персонажа
  const message = habit.customNotificationMessage || getCharacterMessage(habit.character, habit, 'daily')
  
  try {
    const notificationOptions: NotificationOptions = {
      body: message,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag: `habit-${habit.id}`,
      requireInteraction: false,
      silent: false
    }

    // Добавляем вибрацию для мобильных устройств (если поддерживается)
    if ('vibrate' in navigator) {
      notificationOptions.vibrate = [200, 100, 200]
    }

    const notification = new Notification(`${characterName} напоминает: ${habit.name}`, notificationOptions)

    notification.onclick = () => {
      window.focus()
      notification.close()
    }

    // Автоматически закрываем уведомление через 5 секунд
    setTimeout(() => {
      notification.close()
    }, 5000)

    console.log(`✅ Уведомление отправлено для "${habit.name}"`)
    
    // Также отправляем через Telegram, если настроено
    if (isTelegramEnabled()) {
      await sendTelegramNotification(
        `${characterName} напоминает: ${habit.name}`,
        message
      ).catch(error => {
        console.warn('⚠️ Ошибка при отправке Telegram уведомления:', error)
      })
    }
  } catch (error) {
    console.error('Ошибка при показе уведомления:', error)
  }
}

// Функция для тестирования уведомлений
export function testNotification(): void {
  if (!('Notification' in window)) {
    alert('Ваш браузер не поддерживает уведомления')
    return
  }

  if (Notification.permission !== 'granted') {
    alert('Сначала разрешите уведомления в настройках браузера')
    return
  }

  try {
    const testNotification = new Notification('Тестовое уведомление', {
      body: 'Если вы видите это сообщение, уведомления работают правильно! 🎉',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag: 'test-notification',
      vibrate: [200, 100, 200]
    })

    testNotification.onclick = () => {
      window.focus()
      testNotification.close()
    }

    setTimeout(() => {
      testNotification.close()
    }, 5000)
  } catch (error) {
    console.error('Ошибка при тестовом уведомлении:', error)
    alert('Ошибка при показе тестового уведомления')
  }
}

export async function clearNotifications(habitId: string): Promise<void> {
  // Очищаем timeout
  const timeoutId = notificationTimeouts.get(habitId)
  if (timeoutId) {
    clearTimeout(timeoutId)
    notificationTimeouts.delete(habitId)
    console.log(`🗑️ Очищено уведомление для привычки ID: ${habitId}`)
  }

  // Очищаем interval
  const intervalId = notificationIntervals.get(habitId)
  if (intervalId) {
    clearInterval(intervalId)
    notificationIntervals.delete(habitId)
  }
  
  // Уведомляем Service Worker об отмене уведомления
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready
      registration.active?.postMessage({
        type: 'CLEAR_NOTIFICATION',
        habitId
      })
    } catch (error) {
      console.warn('⚠️ Ошибка при отправке команды очистки в Service Worker:', error)
    }
  }
}

// Проверка пропущенных уведомлений при загрузке приложения
export async function checkMissedNotifications(habits: Habit[]): Promise<void> {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return
  }

  const now = new Date()
  
  // Для iOS увеличиваем окно проверки до 4 часов
  const checkWindow = isIOS() ? 4 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000

  for (const habit of habits) {
    if (!habit.notificationEnabled || !habit.notificationTime) {
      continue
    }

    const [hours, minutes] = habit.notificationTime.split(':').map(Number)
    
    // Проверяем, было ли время уведомления в последние N часов
    const notificationTimeToday = new Date()
    notificationTimeToday.setHours(hours, minutes, 0, 0)
    
    const timeDiff = now.getTime() - notificationTimeToday.getTime()

    // Если уведомление должно было быть в последние N часов, показываем его
    if (timeDiff > 0 && timeDiff < checkWindow) {
      // Проверяем, не показывали ли мы уже это уведомление сегодня
      try {
        const lastShownKey = `lastMissedNotification_${habit.id}`
        const lastShownDate = localStorage.getItem(lastShownKey)
        const today = now.toDateString()
        
        if (lastShownDate !== today) {
          console.log(`⏰ Показываем пропущенное уведомление для "${habit.name}"`)
          await showNotification(habit)
          localStorage.setItem(lastShownKey, today)
        }
      } catch (error) {
        console.warn('⚠️ Ошибка при проверке пропущенного уведомления:', error)
      }
    }
  }
}

export function checkAndShowAchievementNotification(
  habit: Habit,
  achievementId: string
): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return
  }

  const message = getCharacterMessage(habit.character, habit, 'achievement')
  const notification = new Notification('Новое достижение!', {
    body: `${message} - ${achievementId}`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    tag: `achievement-${habit.id}-${achievementId}`
  })

  notification.onclick = () => {
    window.focus()
    notification.close()
  }
}

