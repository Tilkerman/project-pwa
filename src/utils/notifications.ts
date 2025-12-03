import type { Habit } from '@/types'
import { getCharacterMessage } from './characters'

// Хранилище для timeout ID, чтобы можно было их очищать
const notificationTimeouts = new Map<string, number>()
const notificationIntervals = new Map<string, number>()

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

export function scheduleNotifications(habit: Habit): void {
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

  const timeoutId = window.setTimeout(() => {
    console.log(`🔔 Время уведомления для "${habit.name}"!`)
    showNotification(habit)
    // Планируем повторяющееся уведомление
    scheduleRecurringNotification(habit)
  }, timeUntilNotification)

  notificationTimeouts.set(habit.id, timeoutId)
}

function scheduleRecurringNotification(habit: Habit): void {
  // Очищаем предыдущий интервал, если есть
  const existingInterval = notificationIntervals.get(habit.id)
  if (existingInterval) {
    clearInterval(existingInterval)
  }

  const interval = 24 * 60 * 60 * 1000 // 24 часа

  const intervalId = window.setInterval(() => {
    // Проверяем актуальное состояние привычки
    if (habit.notificationEnabled && Notification.permission === 'granted') {
      console.log(`🔔 Повторяющееся уведомление для "${habit.name}"`)
      showNotification(habit)
    } else {
      // Если уведомления отключены, очищаем интервал
      clearInterval(intervalId)
      notificationIntervals.delete(habit.id)
    }
  }, interval)

  notificationIntervals.set(habit.id, intervalId)
}

export function showNotification(habit: Habit): void {
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

export function clearNotifications(habitId: string): void {
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
}

// Проверка пропущенных уведомлений при загрузке приложения
export async function checkMissedNotifications(habits: Habit[]): Promise<void> {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return
  }

  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()

  for (const habit of habits) {
    if (!habit.notificationEnabled || !habit.notificationTime) {
      continue
    }

    const [hours, minutes] = habit.notificationTime.split(':').map(Number)
    
    // Проверяем, было ли время уведомления в последние 2 часа
    const notificationTimeToday = new Date()
    notificationTimeToday.setHours(hours, minutes, 0, 0)
    
    const timeDiff = now.getTime() - notificationTimeToday.getTime()
    const twoHours = 2 * 60 * 60 * 1000

    // Если уведомление должно было быть в последние 2 часа, показываем его
    if (timeDiff > 0 && timeDiff < twoHours) {
      console.log(`⏰ Показываем пропущенное уведомление для "${habit.name}"`)
      showNotification(habit)
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

