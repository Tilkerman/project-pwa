export type CharacterType = 'babushka' | 'gopnik'

export interface Habit {
  id: string
  name: string
  character: CharacterType
  createdAt: Date
  markedDays: string[] // ISO date strings
  notes: Record<string, string> // date -> note
  achievements: string[]
  notificationTime?: string // HH:mm format
  notificationEnabled: boolean
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  condition: (habit: Habit) => boolean
  daysRequired?: number
}

export interface Character {
  id: CharacterType
  name: string
  icon: string
  phrases: {
    daily: string[]
    milestones: Record<number, string[]>
    streak: Record<number, string[]>
    encouragement: string[]
    achievement: string[]
  }
}

