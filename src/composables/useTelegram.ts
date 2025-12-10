// Composable для работы с Telegram Mini App в Vue компонентах
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { 
  isTelegramMiniApp, 
  initTelegramMiniApp, 
  getTelegramUser,
  getTelegramTheme,
  setupTelegramMainButton,
  setupTelegramBackButton
} from '@/utils/telegramMiniApp'

export function useTelegram() {
  const isInTelegram = ref(false)
  const telegramUser = ref<any>(null)
  const telegramTheme = ref<any>(null)
  const telegramApi = ref<any>(null)

  // Инициализация при монтировании компонента
  onMounted(() => {
    isInTelegram.value = isTelegramMiniApp()
    
    if (isInTelegram.value) {
      telegramApi.value = initTelegramMiniApp()
      telegramUser.value = getTelegramUser()
      telegramTheme.value = getTelegramTheme()
      
      console.log('📱 Telegram Mini App активен в компоненте')
    }
  })

  // Computed свойства
  const userName = computed(() => {
    if (!telegramUser.value) return null
    return telegramUser.value.first_name || 
           telegramUser.value.username || 
           'Пользователь'
  })

  const userPhoto = computed(() => {
    if (!telegramUser.value) return null
    return telegramUser.value.photo_url || null
  })

  const userId = computed(() => {
    return telegramUser.value?.id || null
  })

  const isDarkTheme = computed(() => {
    return telegramTheme.value?.colorScheme === 'dark'
  })

  // Методы для работы с Telegram API
  const closeApp = () => {
    if (telegramApi.value?.close) {
      telegramApi.value.close()
    }
  }

  const showAlert = (message: string) => {
    if (telegramApi.value?.showAlert) {
      telegramApi.value.showAlert(message)
    } else {
      alert(message)
    }
  }

  const showConfirm = async (message: string): Promise<boolean> => {
    if (telegramApi.value?.showConfirm) {
      return await telegramApi.value.showConfirm(message)
    } else {
      return confirm(message)
    }
  }

  const vibrate = (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') => {
    if (telegramApi.value?.vibrate) {
      telegramApi.value.vibrate(style)
    }
  }

  const notifySuccess = () => {
    if (telegramApi.value?.notifySuccess) {
      telegramApi.value.notifySuccess()
    }
  }

  const notifyError = () => {
    if (telegramApi.value?.notifyError) {
      telegramApi.value.notifyError()
    }
  }

  // Настройка главной кнопки
  const setMainButton = (text: string, onClick: () => void, visible: boolean = true) => {
    if (isInTelegram.value) {
      setupTelegramMainButton(text, onClick, visible)
    }
  }

  // Настройка кнопки "Назад"
  const setBackButton = (onClick: () => void, visible: boolean = true) => {
    if (isInTelegram.value) {
      setupTelegramBackButton(onClick, visible)
    }
  }

  return {
    // Состояние
    isInTelegram,
    telegramUser,
    telegramTheme,
    telegramApi,
    
    // Computed
    userName,
    userPhoto,
    userId,
    isDarkTheme,
    
    // Методы
    closeApp,
    showAlert,
    showConfirm,
    vibrate,
    notifySuccess,
    notifyError,
    setMainButton,
    setBackButton,
  }
}

