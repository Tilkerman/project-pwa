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
    // Проверяем, не является ли цвет чисто белым
    const normalizedColor = customColor.toLowerCase().replace('#', '')
    const isWhite = normalizedColor === 'ffffff' || normalizedColor === 'fff'
    
    // Генерируем стили для кастомного цвета
    return {
      bg: isWhite ? '#F7F7F7' : customColor, // Fallback для белого
      text: getContrastColor(isWhite ? '#F7F7F7' : customColor),
      border: darkenColor(isWhite ? '#F7F7F7' : customColor, 0.2)
    }
  }
  
  // Проверяем стандартные цвета на белый
  const baseColor = projectColors[color]
  const normalizedBg = baseColor.bg.toLowerCase().replace('#', '')
  const isWhite = normalizedBg === 'ffffff' || normalizedBg === 'fff'
  
  if (isWhite) {
    return {
      bg: '#F7F7F7',
      text: '#1A1A1A',
      border: '#E5E5E5'
    }
  }
  
  return projectColors[color]
}

// Функция для вычисления luminance (яркости) по формуле WCAG
export function calculateLuminance(hex: string): number {
  const color = hex.replace('#', '')
  const r = parseInt(color.substr(0, 2), 16) / 255
  const g = parseInt(color.substr(2, 2), 16) / 255
  const b = parseInt(color.substr(4, 2), 16) / 255
  
  // Применяем гамма-коррекцию
  const rLinear = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4)
  const gLinear = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4)
  const bLinear = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4)
  
  // Формула luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear
}

// Функция для определения контрастного цвета текста (черный или белый)
export function getContrastColor(hex: string): string {
  const luminance = calculateLuminance(hex)
  return luminance > 0.6 ? '#1A1A1A' : '#FFFFFF'
}

// Функция для определения, является ли цвет светлым
export function isLightColor(hex: string): boolean {
  const luminance = calculateLuminance(hex)
  return luminance > 0.6
}

// Функция для затемнения цвета (для border)
function darkenColor(hex: string, amount: number): string {
  const color = hex.replace('#', '')
  const r = Math.max(0, parseInt(color.substr(0, 2), 16) - Math.round(255 * amount))
  const g = Math.max(0, parseInt(color.substr(2, 2), 16) - Math.round(255 * amount))
  const b = Math.max(0, parseInt(color.substr(4, 2), 16) - Math.round(255 * amount))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

