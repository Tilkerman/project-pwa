import type { Habit } from '@/types'
import { getCharacterMessage } from './characters'

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

export function scheduleNotifications(habit: Habit): void {
  if (!habit.notificationEnabled || !habit.notificationTime) {
    return
  }

  // Clear existing notifications for this habit
  clearNotifications(habit.id)

  const [hours, minutes] = habit.notificationTime.split(':').map(Number)
  const now = new Date()
  const notificationTime = new Date()
  notificationTime.setHours(hours, minutes, 0, 0)

  // If time has passed today, schedule for tomorrow
  if (notificationTime <= now) {
    notificationTime.setDate(notificationTime.getDate() + 1)
  }

  const timeUntilNotification = notificationTime.getTime() - now.getTime()

  setTimeout(() => {
    showNotification(habit)
    // Schedule recurring notification
    scheduleRecurringNotification(habit)
  }, timeUntilNotification)
}

function scheduleRecurringNotification(habit: Habit): void {
  const interval = 24 * 60 * 60 * 1000 // 24 hours

  setInterval(() => {
    if (habit.notificationEnabled) {
      showNotification(habit)
    }
  }, interval)
}

function showNotification(habit: Habit): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return
  }

  const message = getCharacterMessage(habit.character, habit, 'daily')
  const notification = new Notification(`Напоминание: ${habit.name}`, {
    body: message,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    tag: `habit-${habit.id}`
  })

  notification.onclick = () => {
    window.focus()
    notification.close()
  }
}

export function clearNotifications(habitId: string): void {
  // Notifications are automatically cleared, but we can cancel scheduled ones
  // by storing timeout IDs (simplified implementation)
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

