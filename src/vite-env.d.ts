/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare const __APP_VERSION__: string

// Типы для Telegram Web App API
interface TelegramWebApp {
  initDataUnsafe?: {
    user?: {
      id?: number
      first_name?: string
      last_name?: string
      username?: string
      language_code?: string
      is_bot?: boolean
      is_premium?: boolean
    }
  }
  version?: string
  platform?: string
  colorScheme?: 'light' | 'dark'
  themeParams?: {
    bg_color?: string
    text_color?: string
    hint_color?: string
    link_color?: string
    button_color?: string
    button_text_color?: string
    secondary_bg_color?: string
  }
  backgroundColor?: string
  BackButton?: {
    show: () => void
    hide: () => void
    onClick: (callback: () => void) => void
  }
  MainButton?: {
    text: string
    show: () => void
    hide: () => void
    onClick: (callback: () => void) => void
    setText: (text: string) => void
  }
  HapticFeedback?: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void
  }
  ready: () => void
  expand: () => void
  close: () => void
  showAlert: (message: string) => void
  showConfirm: (message: string, callback: (confirmed: boolean) => void) => void
}

interface Telegram {
  WebApp: TelegramWebApp
}

interface Window {
  Telegram?: Telegram
  TelegramWebApp?: TelegramWebApp
}

