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
  }
}

export const availableColors: ProjectColor[] = ['green', 'cyan', 'blue', 'purple', 'pink', 'orange', 'red']

export const projectIcons = [
  '🚫', '🚭', '🍺', '💬', '🍰', '🍔', '☕', '📱', '🎮', '💻', '📺', '🎬', '🎵', '📚', '🏃', '💪', '🧘', '🎯', '⭐', '🔥'
]

export function getProjectColorStyles(color: ProjectColor = 'blue') {
  return projectColors[color]
}

