import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { Habit } from '@/types'

interface HabitsDB extends DBSchema {
  habits: {
    key: string
    value: Habit & { createdAt: string | Date } // createdAt может быть строкой при сохранении
    indexes: { 'by-created': string | Date }
  }
}

const DB_NAME = 'habits-tracker'
const DB_VERSION = 1

let dbInstance: IDBPDatabase<HabitsDB> | null = null

export async function getDB(): Promise<IDBPDatabase<HabitsDB>> {
  if (dbInstance) {
    return dbInstance
  }

  dbInstance = await openDB<HabitsDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const habitStore = db.createObjectStore('habits', {
        keyPath: 'id'
      })
      habitStore.createIndex('by-created', 'createdAt')
    }
  })

  return dbInstance
}

export async function getAllHabits(): Promise<Habit[]> {
  const db = await getDB()
  const habits = await db.getAll('habits')
  // Восстанавливаем Date объекты из строк
  return habits.map(habit => ({
    ...habit,
    createdAt: habit.createdAt instanceof Date 
      ? habit.createdAt 
      : (typeof habit.createdAt === 'string' ? new Date(habit.createdAt) : new Date(habit.createdAt))
  }))
}

export async function getHabit(id: string): Promise<Habit | undefined> {
  const db = await getDB()
  const habit = await db.get('habits', id)
  if (!habit) return undefined
  // Восстанавливаем Date объект из строки
  return {
    ...habit,
    createdAt: habit.createdAt instanceof Date 
      ? habit.createdAt 
      : (typeof habit.createdAt === 'string' ? new Date(habit.createdAt) : new Date(habit.createdAt))
  }
}

export async function saveHabit(habit: Habit): Promise<void> {
  const db = await getDB()
  
  // Преобразуем Date в строку
  let createdAtValue: string
  if (habit.createdAt instanceof Date) {
    createdAtValue = habit.createdAt.toISOString()
  } else if (typeof habit.createdAt === 'string') {
    createdAtValue = habit.createdAt
  } else {
    createdAtValue = new Date(habit.createdAt).toISOString()
  }
  
  // Создаем полностью сериализуемый объект с нуля
  // Убеждаемся, что все массивы содержат только строки
  const markedDaysArray = Array.isArray(habit.markedDays) 
    ? habit.markedDays.map(d => String(d)).filter(Boolean)
    : []
  
  const achievementsArray = Array.isArray(habit.achievements)
    ? habit.achievements.map(a => String(a)).filter(Boolean)
    : []
  
  // Создаем чистый объект notes
  const notesObj: Record<string, string> = {}
  if (habit.notes && typeof habit.notes === 'object' && !Array.isArray(habit.notes)) {
    for (const [key, value] of Object.entries(habit.notes)) {
      if (key && value !== null && value !== undefined) {
        notesObj[String(key)] = String(value)
      }
    }
  }
  
  // Создаем объект для сохранения - только примитивные типы
  const habitToSave: any = {
    id: String(habit.id),
    name: String(habit.name),
    character: String(habit.character),
    createdAt: createdAtValue,
    markedDays: markedDaysArray,
    notes: notesObj,
    achievements: achievementsArray,
    customColor: habit.customColor ? String(habit.customColor) : undefined,
    notificationEnabled: Boolean(habit.notificationEnabled)
  }
  
  // Добавляем опциональные поля только если они есть
  if (habit.notificationTime) {
    habitToSave.notificationTime = String(habit.notificationTime)
  }
  if (habit.color) {
    habitToSave.color = String(habit.color)
  }
  if (habit.icon) {
    habitToSave.icon = String(habit.icon)
  }
  if (habit.additionalMotivation !== undefined) {
    habitToSave.additionalMotivation = Boolean(habit.additionalMotivation)
  }
  
  await db.put('habits', habitToSave)
}

export async function deleteHabit(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('habits', id)
}

export async function clearAllHabits(): Promise<void> {
  const db = await getDB()
  await db.clear('habits')
}

