import type { ProjectColor } from '@/types'

export const projectColors: Record<ProjectColor, { bg: string; text: string; border: string }> = {
  blue: {
    bg: '#1e3a8a',
    text: '#ffffff',
    border: '#3b82f6'
  },
  red: {
    bg: '#991b1b',
    text: '#ffffff',
    border: '#ef4444'
  },
  green: {
    bg: '#166534',
    text: '#ffffff',
    border: '#22c55e'
  },
  purple: {
    bg: '#6b21a8',
    text: '#ffffff',
    border: '#a855f7'
  },
  pink: {
    bg: '#9f1239',
    text: '#ffffff',
    border: '#ec4899'
  },
  orange: {
    bg: '#9a3412',
    text: '#ffffff',
    border: '#f97316'
  },
  cyan: {
    bg: '#164e63',
    text: '#ffffff',
    border: '#06b6d4'
  },
  yellow: {
    bg: '#854d0e',
    text: '#ffffff',
    border: '#eab308'
  },
  teal: {
    bg: '#134e4a',
    text: '#ffffff',
    border: '#14b8a6'
  },
  indigo: {
    bg: '#312e81',
    text: '#ffffff',
    border: '#6366f1'
  },
  lime: {
    bg: '#365314',
    text: '#ffffff',
    border: '#84cc16'
  },
  amber: {
    bg: '#78350f',
    text: '#ffffff',
    border: '#f59e0b'
  },
  emerald: {
    bg: '#064e3b',
    text: '#ffffff',
    border: '#10b981'
  },
  violet: {
    bg: '#4c1d95',
    text: '#ffffff',
    border: '#8b5cf6'
  },
  fuchsia: {
    bg: '#701a75',
    text: '#ffffff',
    border: '#d946ef'
  },
  rose: {
    bg: '#9f1239',
    text: '#ffffff',
    border: '#f43f5e'
  },
  sky: {
    bg: '#0c4a6e',
    text: '#ffffff',
    border: '#0ea5e9'
  },
  custom: {
    bg: '#6b7280',
    text: '#ffffff',
    border: '#9ca3af'
  }
}

export const availableColors: ProjectColor[] = [
  'blue', 'red', 'green', 'purple', 'pink', 'orange', 'cyan',
  'yellow', 'teal', 'indigo', 'lime', 'amber', 'emerald',
  'violet', 'fuchsia', 'rose', 'sky', 'custom'
]

export const projectIcons = [
  '🚫', '🚭', '🍺', '💬', '🍰', '🍔', '☕', '📱', '🎮', '💻', '📺', '🎬', '🎵', '📚', '🏃', '💪', '🧘', '🎯', '⭐', '🔥'
]

export function getProjectColorStyles(color: ProjectColor = 'blue', customColor?: string) {
  if (color === 'custom' && customColor) {
    // Генерируем стили для кастомного цвета
    return {
      bg: customColor,
      text: getContrastColor(customColor),
      border: darkenColor(customColor, 0.2)
    }
  }
  return projectColors[color]
}

// Функция для определения контрастного цвета текста (черный или белый)
function getContrastColor(hex: string): string {
  // Убираем # если есть
  const color = hex.replace('#', '')
  const r = parseInt(color.substr(0, 2), 16)
  const g = parseInt(color.substr(2, 2), 16)
  const b = parseInt(color.substr(4, 2), 16)
  // Вычисляем яркость
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 128 ? '#000000' : '#ffffff'
}

// Функция для затемнения цвета (для border)
function darkenColor(hex: string, amount: number): string {
  const color = hex.replace('#', '')
  const r = Math.max(0, parseInt(color.substr(0, 2), 16) - Math.round(255 * amount))
  const g = Math.max(0, parseInt(color.substr(2, 2), 16) - Math.round(255 * amount))
  const b = Math.max(0, parseInt(color.substr(4, 2), 16) - Math.round(255 * amount))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

