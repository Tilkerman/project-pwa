import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Habit, Achievement } from '@/types'
import {
  getAllHabits,
  getHabit,
  saveHabit,
  deleteHabit
} from '@/utils/storage'
import { getCurrentStreak, getCharacterMessage } from '@/utils/characters'
import {
  scheduleNotifications,
  requestNotificationPermission,
  clearNotifications
} from '@/utils/notifications'

export const useHabitsStore = defineStore('habits', () => {
  const habits = ref<Habit[]>([])
  const loading = ref(false)

  const achievements: Achievement[] = [
    {
      id: 'first-day',
      name: 'Первый шаг',
      description: 'Отметь первый день без привычки',
      icon: '🎯',
      daysRequired: 1,
      condition: (habit) => habit.markedDays.length >= 1
    },
    {
      id: 'week',
      name: 'Неделя силы',
      description: '7 дней без привычки',
      icon: '💪',
      daysRequired: 7,
      condition: (habit) => habit.markedDays.length >= 7
    },
    {
      id: 'month',
      name: 'Месяц побед',
      description: '30 дней без привычки',
      icon: '🏆',
      daysRequired: 30,
      condition: (habit) => habit.markedDays.length >= 30
    },
    {
      id: 'hundred',
      name: 'Сотня дней',
      description: '100 дней без привычки',
      icon: '💯',
      daysRequired: 100,
      condition: (habit) => habit.markedDays.length >= 100
    },
    {
      id: 'streak-7',
      name: 'Неделя подряд',
      description: '7 дней подряд без перерыва',
      icon: '🔥',
      daysRequired: 7,
      condition: (habit) => getCurrentStreak(habit) >= 7
    },
    {
      id: 'streak-30',
      name: 'Месяц подряд',
      description: '30 дней подряд без перерыва',
      icon: '⭐',
      daysRequired: 30,
      condition: (habit) => getCurrentStreak(habit) >= 30
    }
  ]

  async function loadHabits() {
    loading.value = true
    try {
      // Загружаем привычки с таймаутом
      const loadPromise = getAllHabits()
      const timeoutPromise = new Promise<Habit[]>((resolve) => {
        setTimeout(() => {
          console.warn('⚠️ Таймаут при загрузке привычек, используем пустой массив')
          resolve([])
        }, 5000) // 5 секунд таймаут
      })
      
      habits.value = await Promise.race([loadPromise, timeoutPromise])
      
      // Schedule notifications for all habits (не блокируем загрузку при ошибках)
      // Делаем это асинхронно, чтобы не блокировать UI
      Promise.all(
        habits.value
          .filter(habit => habit.notificationEnabled)
          .map(async (habit) => {
            try {
              await scheduleNotifications(habit)
            } catch (error) {
              // Логируем ошибку, но не прерываем загрузку
              console.warn(`⚠️ Не удалось запланировать уведомление для привычки "${habit.name}":`, error)
            }
          })
      ).catch(error => {
        console.warn('⚠️ Ошибка при планировании уведомлений:', error)
      })
    } catch (error) {
      console.error('❌ Ошибка при загрузке привычек:', error)
      // Устанавливаем пустой массив, чтобы приложение не зависло
      habits.value = []
    } finally {
      loading.value = false
    }
  }

  async function createHabit(
    name: string,
    character: Habit['character'],
    notificationTime?: string,
    color: Habit['color'] = 'blue',
    icon?: string,
    additionalMotivation: boolean = true,
    customNotificationMessage?: string,
    customColor?: string
  ): Promise<Habit> {
    const newHabit: Habit = {
      id: crypto.randomUUID(),
      name,
      character,
      createdAt: new Date(),
      markedDays: [],
      notes: {},
      achievements: [],
      notificationTime,
      notificationEnabled: !!notificationTime,
      customNotificationMessage,
      color,
      customColor,
      icon,
      additionalMotivation
    }

    await saveHabit(newHabit)
    habits.value.push(newHabit)

    if (newHabit.notificationEnabled) {
      // Не блокируем UI ожиданием сети/разрешений
      requestNotificationPermission()
        .then(async (granted) => {
          // ВАЖНО: Telegram-серверное расписание должно отправляться даже если браузерные уведомления запрещены.
          // scheduleNotifications сам пропустит локальное планирование без permission, но продолжит серверную часть.
          console.log('📋 Разрешение на уведомления (браузер):', granted ? '✅ получено' : '❌ отклонено')
          await scheduleNotifications(newHabit)
        })
        .catch((error) => {
          console.warn('⚠️ Не удалось настроить уведомления для новой привычки:', error)
        })
    }

    return newHabit
  }

  async function updateHabit(habit: Habit): Promise<void> {
    console.log('🔄 Обновление привычки:', habit.name, {
      notificationEnabled: habit.notificationEnabled,
      notificationTime: habit.notificationTime
    })
    try {
      // Сохраняем в IndexedDB напрямую - saveHabit сам создаст сериализуемый объект
      await saveHabit(habit)
      
      // Обновляем в локальном состоянии - создаем объект с Date для локального использования
      const index = habits.value.findIndex((h) => h.id === habit.id)
      const habitForLocal: Habit = {
        ...habit,
        createdAt: habit.createdAt instanceof Date ? habit.createdAt : new Date(habit.createdAt),
        markedDays: Array.isArray(habit.markedDays) ? [...habit.markedDays] : [],
        notes: habit.notes && typeof habit.notes === 'object' ? { ...habit.notes } : {},
        achievements: Array.isArray(habit.achievements) ? [...habit.achievements] : []
      }
      
      if (index !== -1) {
        habits.value[index] = habitForLocal
      } else {
        habits.value.push(habitForLocal)
      }

      // Планируем/очищаем уведомления асинхронно, чтобы не блокировать UI
      if (habit.notificationEnabled) {
        console.log('📅 Планирование уведомлений для обновленной привычки:', habit.name)
        requestNotificationPermission()
          .then(async (granted) => {
            console.log('📋 Разрешение на уведомления:', granted ? '✅ получено' : '❌ отклонено')
            // ВАЖНО: даже если браузерные уведомления не разрешены, серверное Telegram-расписание всё равно должно уходить.
            console.log('🚀 Вызов scheduleNotifications для:', habit.name)
            await scheduleNotifications(habit)
            console.log('✅ scheduleNotifications завершен для:', habit.name)
          })
          .catch((error) => {
            console.error('❌ Ошибка при планировании уведомлений при обновлении привычки:', error)
            console.error('Стек ошибки:', error.stack)
          })
      } else {
        console.log('⏸️ Уведомления отключены для привычки:', habit.name)
        clearNotifications(habit.id).catch((error) => {
          console.warn('⚠️ Не удалось очистить уведомления при обновлении привычки:', error)
        })
      }
    } catch (error) {
      console.error('Failed to update habit:', error)
      throw error
    }
  }

  async function removeHabit(id: string): Promise<void> {
    await deleteHabit(id)
    habits.value = habits.value.filter((h) => h.id !== id)
  }

  async function markDay(habitId: string, date: Date = new Date()): Promise<void> {
    const habit = habits.value.find((h) => h.id === habitId)
    if (!habit) return

    const dateStr = date.toISOString().split('T')[0]
    if (habit.markedDays.includes(dateStr)) {
      return // Already marked
    }

    // Создаем новый массив для избежания мутаций
    const updatedMarkedDays = [...habit.markedDays, dateStr].sort()
    
    // Создаем обновленную копию привычки
    const updatedHabit = {
      ...habit,
      markedDays: updatedMarkedDays
    }

    // Check for new achievements
    const newAchievements = achievements.filter(
      (achievement) =>
        !updatedHabit.achievements.includes(achievement.id) &&
        achievement.condition(updatedHabit)
    )

    if (newAchievements.length > 0) {
      updatedHabit.achievements = [...updatedHabit.achievements, ...newAchievements.map((a) => a.id)]
    }

    await updateHabit(updatedHabit)
  }

  async function unmarkDay(habitId: string, date: Date): Promise<void> {
    const habit = habits.value.find((h) => h.id === habitId)
    if (!habit) return

    const dateStr = date.toISOString().split('T')[0]
    // Создаем обновленную копию привычки
    const updatedHabit = {
      ...habit,
      markedDays: habit.markedDays.filter((d) => d !== dateStr)
    }

    await updateHabit(updatedHabit)
  }

  async function addNote(habitId: string, date: Date, note: string): Promise<void> {
    const habit = habits.value.find((h) => h.id === habitId)
    if (!habit) return

    const dateStr = date.toISOString().split('T')[0]
    habit.notes[dateStr] = note

    await updateHabit(habit)
  }

  function getHabitById(id: string): Habit | undefined {
    return habits.value.find((h) => h.id === id)
  }

  function getHabitStats(habit: Habit) {
    const totalDays = habit.markedDays.length
    const streak = getCurrentStreak(habit)
    const createdDate = new Date(habit.createdAt)
    const today = new Date()
    const daysSinceCreation = Math.floor(
      (today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    const successRate =
      daysSinceCreation > 0 ? (totalDays / daysSinceCreation) * 100 : 0

    return {
      totalDays,
      streak,
      successRate: Math.min(100, Math.round(successRate)),
      daysSinceCreation
    }
  }

  function getCharacterMessageForHabit(
    habit: Habit,
    context: 'daily' | 'milestone' | 'streak' | 'encouragement' | 'achievement'
  ): string {
    return getCharacterMessage(habit.character, habit, context)
  }

  const allAchievements = computed(() => achievements)

  return {
    habits,
    loading,
    allAchievements,
    loadHabits,
    createHabit,
    updateHabit,
    removeHabit,
    markDay,
    unmarkDay,
    addNote,
    getHabitById,
    getHabitStats,
    getCharacterMessageForHabit
  }
})

