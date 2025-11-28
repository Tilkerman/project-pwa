import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { Habit } from '@/types'

interface HabitsDB extends DBSchema {
  habits: {
    key: string
    value: Habit
    indexes: { 'by-created': Date }
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
  return db.getAll('habits')
}

export async function getHabit(id: string): Promise<Habit | undefined> {
  const db = await getDB()
  return db.get('habits', id)
}

export async function saveHabit(habit: Habit): Promise<void> {
  const db = await getDB()
  await db.put('habits', habit)
}

export async function deleteHabit(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('habits', id)
}

export async function clearAllHabits(): Promise<void> {
  const db = await getDB()
  await db.clear('habits')
}

