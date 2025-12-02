export type CharacterType = 'babushka' | 'gopnik' | 'teacher' | 'grandpa'

export type ProjectColor = 'blue' | 'red' | 'green' | 'purple' | 'pink' | 'orange' | 'cyan' | 'yellow' | 'teal' | 'indigo' | 'lime' | 'amber' | 'emerald' | 'violet' | 'fuchsia' | 'rose' | 'sky' | 'custom'

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
  customNotificationMessage?: string // Пользовательский текст напоминания
  color?: ProjectColor // Цвет проекта
  customColor?: string // Кастомный цвет в формате hex (если color === 'custom')
  icon?: string // Иконка проекта (emoji или путь к изображению)
  additionalMotivation?: boolean // Дополнительная мотивация
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

