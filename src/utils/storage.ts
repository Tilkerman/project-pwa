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
  // Создаем полностью сериализуемый объект для IndexedDB
  // Преобразуем Date в строку и создаем чистый объект без прототипов
  const createdAtValue = habit.createdAt instanceof Date 
    ? habit.createdAt.toISOString() 
    : (typeof habit.createdAt === 'string' ? habit.createdAt : new Date(habit.createdAt).toISOString())
  
  const habitToSave = JSON.parse(JSON.stringify({
    id: String(habit.id),
    name: String(habit.name),
    character: habit.character,
    createdAt: createdAtValue,
    markedDays: Array.isArray(habit.markedDays) ? habit.markedDays.map(String) : [],
    notes: habit.notes && typeof habit.notes === 'object' 
      ? Object.fromEntries(Object.entries(habit.notes).map(([k, v]) => [String(k), String(v)]))
      : {},
    achievements: Array.isArray(habit.achievements) ? habit.achievements.map(String) : [],
    notificationTime: habit.notificationTime ? String(habit.notificationTime) : undefined,
    notificationEnabled: Boolean(habit.notificationEnabled),
    color: habit.color || undefined,
    icon: habit.icon || undefined,
    additionalMotivation: habit.additionalMotivation !== undefined ? Boolean(habit.additionalMotivation) : undefined
  }))
  
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

