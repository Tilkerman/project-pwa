import type { Habit } from '@/types'
import { getCharacterMessage } from './characters'
import { sendTelegramNotification, isTelegramEnabled, getTelegramUser } from './telegram'
import { scheduleNotificationOnServer, removeNotificationFromServer, NOTIFICATION_SERVER_URL } from './notificationServer'
import { isTelegramMiniApp } from './telegramMiniApp'

function assetUrl(path: string): string {
  const base = (import.meta as any).env?.BASE_URL || '/'
  // BASE_URL обычно заканчивается на '/'
  return `${base}${path.replace(/^\//, '')}`
}

function isTelegramUA(): boolean {
  try {
    return typeof navigator !== 'undefined' && /Telegram/i.test(navigator.userAgent)
  } catch {
    return false
  }
}

// Хранилище для timeout ID, чтобы можно было их очищать
const notificationTimeouts = new Map<string, number>()
const notificationIntervals = new Map<string, number>()

// Регистрация периодической проверки в Service Worker
let periodicSyncRegistered = false

// Определение iOS устройства
function isIOS(): boolean {
  try {
    if (typeof navigator === 'undefined') return false
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1)
  } catch (error) {
    console.warn('⚠️ Ошибка при определении iOS устройства:', error)
    return false
  }
}

// Определение, установлено ли приложение как PWA
function isStandalone(): boolean {
  return (window.matchMedia('(display-mode: standalone)').matches) ||
         ((window.navigator as any).standalone === true) ||
         document.referrer.includes('android-app://')
}

async function registerPeriodicSync(): Promise<void> {
  if (periodicSyncRegistered) return
  
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready
      
      // Пытаемся зарегистрировать Periodic Background Sync (работает на Android Chrome)
      // @ts-ignore - PeriodicBackgroundSync может быть не в типах
      if ('PeriodicBackgroundSync' in window && registration.periodicSync) {
        try {
          // @ts-ignore
          await registration.periodicSync.register('check-notifications', {
            minInterval: 60 * 1000 // Минимум 1 минута (браузер может увеличить интервал)
          })
          periodicSyncRegistered = true
          console.log('✅ Периодическая фоновая синхронизация зарегистрирована')
        } catch (error) {
          console.warn('⚠️ Periodic Background Sync не доступен:', error)
        }
      }
      
      // Всегда отправляем сообщение Service Worker для запуска проверки
      // Это работает как fallback и для браузеров без Periodic Background Sync
      if (registration.active) {
        registration.active.postMessage({ type: 'START_PERIODIC_CHECK' })
        periodicSyncRegistered = true
        console.log('✅ Периодическая проверка запущена в Service Worker')
      } else if (registration.waiting) {
        registration.waiting.postMessage({ type: 'START_PERIODIC_CHECK' })
        periodicSyncRegistered = true
      } else if (registration.installing) {
        registration.installing.addEventListener('statechange', () => {
          if (registration.installing?.state === 'activated') {
            registration.installing.postMessage({ type: 'START_PERIODIC_CHECK' })
            periodicSyncRegistered = true
          }
        })
      }
    } catch (error) {
      console.warn('⚠️ Ошибка при запуске периодической проверки:', error)
    }
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  // В Telegram Mini App не запрашиваем браузерные разрешения — используем бота
  if (isTelegramMiniApp() || isTelegramUA()) {
    return true
  }

  if (!('Notification' in window)) {
    console.warn('Браузер не поддерживает уведомления')
    return false
  }

  if (Notification.permission === 'granted') {
    console.log('✅ Разрешение на уведомления уже предоставлено')
    return true
  }

  if (Notification.permission === 'denied') {
    console.warn('❌ Разрешение на уведомления отклонено пользователем')
    alert('Для работы уведомлений необходимо разрешить их в настройках браузера')
    return false
  }

  if (Notification.permission === 'default') {
    console.log('📢 Запрашиваем разрешение на уведомления...')
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      console.log('✅ Разрешение на уведомления получено!')
      return true
    } else {
      console.warn('❌ Разрешение на уведомления отклонено')
      return false
    }
  }

  return false
}

export async function scheduleNotifications(habit: Habit): Promise<void> {
  if (!habit.notificationEnabled || !habit.notificationTime) {
    console.log('⏸️ Уведомления отключены для привычки:', habit.name)
    clearNotifications(habit.id)
    return
  }

  const inTelegram = isTelegramMiniApp()
  const inTelegramUA = isTelegramUA()

  // ВАЖНО:
  // - Браузерные уведомления (PWA/браузер) требуют Notification.permission === 'granted'
  // - Telegram-уведомления через сервер/бот НЕ должны зависеть от browser permission
  const canScheduleClientSide = inTelegram || inTelegramUA || (('Notification' in window) && Notification.permission === 'granted')
  if (!canScheduleClientSide && !inTelegram && !inTelegramUA) {
    console.warn('⚠️ Нет разрешения на браузерные уведомления — пропускаем локальное планирование, но продолжим отправку расписания на сервер:', habit.name)
  }

  // Для iOS показываем предупреждение о ограничениях
  if (isIOS() && !isStandalone()) {
    console.warn('⚠️ Для работы уведомлений на iOS необходимо установить приложение на главный экран')
  }

  // Очищаем существующие уведомления для этой привычки
  clearNotifications(habit.id)

  // Планирование на клиенте (в браузере/PWA) делаем только если есть разрешение,
  // иначе оно никогда не сработает. Для Telegram Mini App разрешение не нужно.
  if (canScheduleClientSide) {
    // Регистрируем периодическую проверку в Service Worker
    await registerPeriodicSync()

    const [hours, minutes] = habit.notificationTime.split(':').map(Number)
    const now = new Date()
    const notificationTime = new Date()
    notificationTime.setHours(hours, minutes, 0, 0)

    // Если время уже прошло сегодня, планируем на завтра
    if (notificationTime <= now) {
      notificationTime.setDate(notificationTime.getDate() + 1)
    }

    const timeUntilNotification = notificationTime.getTime() - now.getTime()
    
    console.log(`📅 Планируем уведомление для "${habit.name}" на ${notificationTime.toLocaleString('ru-RU')} (через ${Math.round(timeUntilNotification / 1000 / 60)} минут)`)

    // Планируем уведомление для случая, когда приложение открыто
    const timeoutId = window.setTimeout(async () => {
      console.log(`🔔 Время уведомления для "${habit.name}"!`)
      await showNotification(habit)
      // Планируем повторяющееся уведомление
      await scheduleRecurringNotification(habit)
    }, timeUntilNotification)

    notificationTimeouts.set(habit.id, timeoutId)
    
    // Также отправляем информацию в Service Worker для фоновой проверки
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready
        registration.active?.postMessage({
          type: 'SCHEDULE_NOTIFICATION',
          habit: {
            id: habit.id,
            name: habit.name,
            notificationTime: habit.notificationTime,
            notificationEnabled: habit.notificationEnabled,
            customNotificationMessage: habit.customNotificationMessage,
            character: habit.character
          }
        })
      } catch (error) {
        console.warn('⚠️ Ошибка при отправке расписания в Service Worker:', error)
      }
    }
  }

  // Отправляем расписание на сервер уведомлений (работает даже когда приложение закрыто)
  try {
    // Получаем chat_id для отправки на сервер
    let chatId: string | null = null
    let chatIdSource = 'не найден'
    
    // Пытаемся получить из Telegram Mini App
    if (typeof window !== 'undefined') {
      const tg = (window as any).Telegram?.WebApp || (window as any).TelegramWebApp
      if (tg?.initDataUnsafe?.user?.id) {
        chatId = String(tg.initDataUnsafe.user.id)
        chatIdSource = 'Telegram Mini App'
        console.log('📱 Chat ID получен из Telegram Mini App:', chatId)
      }
    }
    
    // Если не получили из Mini App, пытаемся получить из настроек
    if (!chatId) {
      const { getTelegramConfig } = await import('./telegram')
      const config = getTelegramConfig()
      console.log('🔍 Проверка настроек Telegram:', config)
      if (config?.chatId) {
        chatId = config.chatId
        chatIdSource = 'настройки (localStorage)'
        console.log('💾 Chat ID получен из настроек:', chatId)
      } else {
        console.warn('⚠️ Chat ID не найден в настройках. Config:', config)
        
        // Попытка получить напрямую из localStorage (на случай проблем с функцией)
        try {
          const directConfig = localStorage.getItem('telegram_notification_config')
          console.log('🔍 Прямая проверка localStorage:', directConfig)
          if (directConfig) {
            const parsed = JSON.parse(directConfig)
            if (parsed?.chatId) {
              chatId = parsed.chatId
              chatIdSource = 'localStorage (прямой доступ)'
              console.log('💾 Chat ID получен напрямую из localStorage:', chatId)
            }
          }
        } catch (error) {
          console.error('❌ Ошибка при прямом чтении localStorage:', error)
        }
      }
    }
    
    console.log('🔍 Итоговый Chat ID:', chatId ? `${chatId.substring(0, 3)}*** (${chatIdSource})` : 'НЕ НАЙДЕН')
    
    // Если Chat ID не найден, выводим детальную диагностику
    if (!chatId) {
      console.error('❌ КРИТИЧЕСКАЯ ОШИБКА: Chat ID не найден!')
      console.error('🔍 Диагностика:')
      console.error('  1. Проверка Telegram Mini App:', typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id ? '✅ Найден' : '❌ Не найден')
      console.error('  2. Проверка localStorage ключа:', localStorage.getItem('telegram_notification_config') ? '✅ Есть' : '❌ Нет')
      console.error('  3. Все ключи localStorage:', Object.keys(localStorage).filter(k => k.includes('telegram') || k.includes('chat')))
      console.error('💡 Решения:')
      console.error('  1. Откройте приложение в Telegram Mini App (Chat ID подставится автоматически)')
      console.error('  2. Или настройте Chat ID вручную в настройках уведомлений')
      console.error('  3. Проверьте, что Chat ID сохранен: откройте "Настройки" → "Настройки уведомлений"')
      return // Прерываем выполнение, если Chat ID не найден
    }
    
    // Если есть chat_id, отправляем расписание на сервер
    if (chatId) {
      const chatIdStr = String(chatId).trim()
      console.log(`📤 Отправка расписания на сервер для привычки "${habit.name}"`)
      console.log(`📋 Детали:`, {
        habitId: habit.id,
        chatId: chatIdStr.substring(0, 3) + '***',
        chatIdLength: chatIdStr.length,
        notificationTime: habit.notificationTime,
        notificationEnabled: habit.notificationEnabled,
        serverUrl: NOTIFICATION_SERVER_URL
      })
      
      if (!chatIdStr) {
        console.error('❌ КРИТИЧЕСКАЯ ОШИБКА: chatId пустой после преобразования!')
        console.error('💡 Проверьте:')
        console.error('   1. Откройте приложение в Telegram Mini App')
        console.error('   2. Или настройте Chat ID вручную в настройках уведомлений')
        return
      }
      
      const result = await scheduleNotificationOnServer(habit, chatIdStr)
      if (result.success) {
        console.log('✅ Расписание успешно отправлено на сервер уведомлений')
        console.log('💡 Уведомления будут приходить даже когда приложение закрыто')
      } else {
        console.error('❌ Не удалось отправить расписание на сервер:', result.error)
        console.error('💡 Проверьте:')
        console.error('   1. Сервер задеплоен на Render.com')
        console.error('   2. URL сервера правильный:', NOTIFICATION_SERVER_URL)
        console.error('   3. Сервер не спит (проверьте логи на Render.com)')
        console.error('   4. Chat ID правильный:', chatIdStr.substring(0, 5) + '...')
        console.error('   5. Откройте консоль сервера на Render.com для детальных логов')
      }
    } else {
      console.error('❌ Chat ID не найден, расписание не отправлено на сервер')
      console.error('💡 Решения:')
      console.error('   1. Откройте приложение в Telegram Mini App (Chat ID подставится автоматически)')
      console.error('   2. Или настройте Chat ID вручную в настройках уведомлений')
      console.error('   3. Получите Chat ID, написав боту @habitnotibot команду /start')
      console.error('   4. Проверьте localStorage: telegram_notification_config')
    }
  } catch (error) {
    console.warn('⚠️ Ошибка при отправке расписания на сервер:', error)
  }

  // Сохраняем расписание в IndexedDB для Service Worker (работает для всех платформ)
  try {
    const request = indexedDB.open('NotificationCache', 1)
    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction(['cache'], 'readwrite')
      const store = transaction.objectStore('cache')
      
      // Получаем существующие расписания
      const getRequest = store.get('notification_schedules')
      getRequest.onsuccess = () => {
        const schedules = getRequest.result?.value || {}
        schedules[habit.id] = {
          id: habit.id,
          name: habit.name,
          time: habit.notificationTime,
          enabled: habit.notificationEnabled,
          customNotificationMessage: habit.customNotificationMessage,
          character: habit.character,
          updatedAt: new Date().toISOString()
        }
        store.put({ value: schedules }, 'notification_schedules')
        console.log('💾 Расписание уведомления сохранено в IndexedDB для Service Worker')
      }
    }
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('cache')) {
        db.createObjectStore('cache')
      }
    }
  } catch (error) {
    console.warn('⚠️ Ошибка при сохранении расписания в IndexedDB:', error)
  }

  // Для iOS: также сохраняем в localStorage для совместимости
  if (isIOS()) {
    try {
      const schedules = JSON.parse(localStorage.getItem('ios_notification_schedules') || '{}')
      schedules[habit.id] = {
        time: habit.notificationTime,
        enabled: habit.notificationEnabled,
        lastCheck: new Date().toISOString()
      }
      localStorage.setItem('ios_notification_schedules', JSON.stringify(schedules))
    } catch (error) {
      console.warn('⚠️ Ошибка при сохранении расписания для iOS:', error)
    }
  }
}

async function scheduleRecurringNotification(habit: Habit): Promise<void> {
  // Очищаем предыдущий интервал, если есть
  const existingInterval = notificationIntervals.get(habit.id)
  if (existingInterval) {
    clearInterval(existingInterval)
  }

  const interval = 24 * 60 * 60 * 1000 // 24 часа
  const inTelegram = isTelegramMiniApp() || isTelegramUA()

  const intervalId = window.setInterval(async () => {
    // Проверяем актуальное состояние привычки
    // Для Telegram Mini App не требуем разрешение браузера
    const canSend = inTelegram 
      ? habit.notificationEnabled 
      : (habit.notificationEnabled && Notification.permission === 'granted')
    
    if (canSend) {
      console.log(`🔔 Повторяющееся уведомление для "${habit.name}"`)
      await showNotification(habit)
    } else {
      // Если уведомления отключены, очищаем интервал
      clearInterval(intervalId)
      notificationIntervals.delete(habit.id)
    }
  }, interval)

  notificationIntervals.set(habit.id, intervalId)
}

export async function showNotification(habit: Habit): Promise<void> {
  const inTelegram = isTelegramMiniApp() || isTelegramUA()

  // Если запущено как Telegram Mini App — всегда шлем уведомление через бота
  if (inTelegram) {
    try {
      // Автоматически сохраняем chat_id если еще не сохранен
      const { autoSaveTelegramChatId } = await import('./telegram')
      autoSaveTelegramChatId()
      
      const character = habit.character
      const characterName = character === 'babushka' ? 'Добрая Бабушка' :
                            character === 'gopnik' ? 'Гопник' :
                            character === 'teacher' ? 'Строгий Учитель' :
                            character === 'grandpa' ? 'Старый Дед' : 'Друг'
      const message = habit.customNotificationMessage || getCharacterMessage(habit.character, habit, 'daily')
      const title = `${characterName} напоминает: ${habit.name}`
      
      const sent = await sendTelegramNotification(title, message)
      if (sent) {
        console.log(`✅ Telegram уведомление отправлено для "${habit.name}" (Mini App)`)
        return
      } else {
        console.warn('⚠️ Не удалось отправить Telegram уведомление, возможно chat_id не сохранен')
      }
    } catch (error) {
      console.error('❌ Ошибка при отправке Telegram уведомления (Mini App):', error)
      // Продолжаем попытку через браузерные уведомления если есть разрешение
    }
  }

  // Пытаемся использовать Service Worker для показа уведомления (работает даже когда приложение закрыто)
  if ('serviceWorker' in navigator && 'Notification' in window && Notification.permission === 'granted') {
    try {
      const registration = await navigator.serviceWorker.ready
      const character = habit.character
      const characterName = character === 'babushka' ? 'Добрая Бабушка' :
                            character === 'gopnik' ? 'Гопник' :
                            character === 'teacher' ? 'Строгий Учитель' :
                            character === 'grandpa' ? 'Старый Дед' : 'Друг'
      
      // Используем пользовательское сообщение, если оно есть, иначе - сообщение персонажа
      const message = habit.customNotificationMessage || getCharacterMessage(habit.character, habit, 'daily')
      
      const title = `${characterName} напоминает: ${habit.name}`
      
      const options: NotificationOptions = {
        body: message,
        icon: assetUrl('icons/icon-192x192.png'),
        badge: assetUrl('icons/icon-192x192.png'),
        tag: `habit-${habit.id}`,
        requireInteraction: false,
        silent: false,
        vibrate: [200, 100, 200],
        data: {
          habitId: habit.id,
          url: `${assetUrl('')}#/`
        }
      }

      await registration.showNotification(title, options)
      console.log(`✅ Уведомление отправлено для "${habit.name}" через Service Worker`)
      
      // Также отправляем через Telegram, если настроено
      if (isTelegramEnabled()) {
        await sendTelegramNotification(title, message).catch(error => {
          console.warn('⚠️ Ошибка при отправке Telegram уведомления:', error)
        })
      }
      
      return
    } catch (error) {
      console.warn('⚠️ Не удалось показать уведомление через Service Worker, используем обычный способ:', error)
    }
  }

  // Fallback: используем обычный способ (работает только когда приложение открыто)
  if (!('Notification' in window)) {
    console.warn('Браузер не поддерживает уведомления')
    return
  }

  if (Notification.permission !== 'granted') {
    console.warn('Нет разрешения на уведомления')
    return
  }

  const character = habit.character
  const characterName = character === 'babushka' ? 'Добрая Бабушка' :
                        character === 'gopnik' ? 'Гопник' :
                        character === 'teacher' ? 'Строгий Учитель' :
                        character === 'grandpa' ? 'Старый Дед' : 'Друг'
  
  // Используем пользовательское сообщение, если оно есть, иначе - сообщение персонажа
  const message = habit.customNotificationMessage || getCharacterMessage(habit.character, habit, 'daily')
  
  try {
    const notificationOptions: NotificationOptions = {
      body: message,
      icon: assetUrl('icons/icon-192x192.png'),
      badge: assetUrl('icons/icon-192x192.png'),
      tag: `habit-${habit.id}`,
      requireInteraction: false,
      silent: false
    }

    // Добавляем вибрацию для мобильных устройств (если поддерживается)
    if ('vibrate' in navigator) {
      notificationOptions.vibrate = [200, 100, 200]
    }

    const notification = new Notification(`${characterName} напоминает: ${habit.name}`, notificationOptions)

    notification.onclick = () => {
      window.focus()
      notification.close()
    }

    // Автоматически закрываем уведомление через 5 секунд
    setTimeout(() => {
      notification.close()
    }, 5000)

    console.log(`✅ Уведомление отправлено для "${habit.name}"`)
    
    // Также отправляем через Telegram, если настроено
    if (isTelegramEnabled()) {
      await sendTelegramNotification(
        `${characterName} напоминает: ${habit.name}`,
        message
      ).catch(error => {
        console.warn('⚠️ Ошибка при отправке Telegram уведомления:', error)
      })
    }
  } catch (error) {
    console.error('Ошибка при показе уведомления:', error)
  }
}

// Функция для тестирования уведомлений
export function testNotification(): void {
  if (!('Notification' in window)) {
    alert('Ваш браузер не поддерживает уведомления')
    return
  }

  if (Notification.permission !== 'granted') {
    alert('Сначала разрешите уведомления в настройках браузера')
    return
  }

  try {
    const testNotification = new Notification('Тестовое уведомление', {
      body: 'Если вы видите это сообщение, уведомления работают правильно! 🎉',
      icon: assetUrl('icons/icon-192x192.png'),
      badge: assetUrl('icons/icon-192x192.png'),
      tag: 'test-notification',
      vibrate: [200, 100, 200]
    })

    testNotification.onclick = () => {
      window.focus()
      testNotification.close()
    }

    setTimeout(() => {
      testNotification.close()
    }, 5000)
  } catch (error) {
    console.error('Ошибка при тестовом уведомлении:', error)
    alert('Ошибка при показе тестового уведомления')
  }
}

export async function clearNotifications(habitId: string): Promise<void> {
  // Очищаем timeout
  const timeoutId = notificationTimeouts.get(habitId)
  if (timeoutId) {
    clearTimeout(timeoutId)
    notificationTimeouts.delete(habitId)
    console.log(`🗑️ Очищено уведомление для привычки ID: ${habitId}`)
  }

  // Очищаем interval
  const intervalId = notificationIntervals.get(habitId)
  if (intervalId) {
    clearInterval(intervalId)
    notificationIntervals.delete(habitId)
  }
  
  // Удаляем расписание с сервера уведомлений
  try {
    await removeNotificationFromServer(habitId)
  } catch (error) {
    console.warn('⚠️ Ошибка при удалении расписания с сервера:', error)
  }
  
  // Уведомляем Service Worker об отмене уведомления
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready
      registration.active?.postMessage({
        type: 'CLEAR_NOTIFICATION',
        habitId
      })
    } catch (error) {
      console.warn('⚠️ Ошибка при отправке команды очистки в Service Worker:', error)
    }
  }
}

// Проверка пропущенных уведомлений при загрузке приложения
export async function checkMissedNotifications(habits: Habit[]): Promise<void> {
  try {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return
    }

    if (!habits || !Array.isArray(habits)) {
      return
    }

    const now = new Date()
    
    // Для iOS увеличиваем окно проверки до 4 часов
    const checkWindow = isIOS() ? 4 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000

    for (const habit of habits) {
      try {
        if (!habit || !habit.notificationEnabled || !habit.notificationTime) {
          continue
        }

        // Проверяем формат времени
        if (typeof habit.notificationTime !== 'string') {
          continue
        }

        const timeParts = habit.notificationTime.split(':')
        if (timeParts.length !== 2) {
          continue
        }

        const hours = parseInt(timeParts[0], 10)
        const minutes = parseInt(timeParts[1], 10)

        if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
          continue
        }
        
        // Проверяем, было ли время уведомления в последние N часов
        const notificationTimeToday = new Date()
        notificationTimeToday.setHours(hours, minutes, 0, 0)
        
        const timeDiff = now.getTime() - notificationTimeToday.getTime()

        // Если уведомление должно было быть в последние N часов, показываем его
        if (timeDiff > 0 && timeDiff < checkWindow) {
          // Проверяем, не показывали ли мы уже это уведомление сегодня
          try {
            const lastShownKey = `lastMissedNotification_${habit.id}`
            const lastShownDate = localStorage.getItem(lastShownKey)
            const today = now.toDateString()
            
            if (lastShownDate !== today) {
              console.log(`⏰ Показываем пропущенное уведомление для "${habit.name}"`)
              await showNotification(habit)
              localStorage.setItem(lastShownKey, today)
            }
          } catch (error) {
            console.warn('⚠️ Ошибка при проверке пропущенного уведомления:', error)
          }
        }
      } catch (error) {
        console.warn(`⚠️ Ошибка при проверке уведомлений для привычки ${habit?.id}:`, error)
        // Продолжаем проверку других привычек
        continue
      }
    }
  } catch (error) {
    console.error('⚠️ Критическая ошибка при проверке пропущенных уведомлений:', error)
  }
}

export function checkAndShowAchievementNotification(
  habit: Habit,
  achievementId: string
): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return
  }

  const message = getCharacterMessage(habit.character, habit, 'achievement')
  const notification = new Notification('Новое достижение!', {
    body: `${message} - ${achievementId}`,
    icon: assetUrl('icons/icon-192x192.png'),
    badge: assetUrl('icons/icon-192x192.png'),
    tag: `achievement-${habit.id}-${achievementId}`
  })

  notification.onclick = () => {
    window.focus()
    notification.close()
  }
}

