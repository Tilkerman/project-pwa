// Сервер для отправки уведомлений через Telegram Bot API
// Работает на Render.com бесплатно

import express from 'express'
import cron from 'node-cron'
import { handleUpdate, sendMessage } from './bot.js'

const app = express()
const PORT = process.env.PORT || 3000

// Токен Telegram бота (из переменной окружения или напрямую)
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7985172630:AAFTN9xGM2C-s0ni07VHOcCCZiyL3XbDh4o'
const BOT_API_URL = 'https://api.telegram.org/bot'

// Хранилище расписаний (в продакшене лучше использовать базу данных)
const notificationSchedules = new Map()

// Middleware для парсинга JSON
app.use(express.json())

// Функция для отправки уведомления через Telegram Bot API
async function sendTelegramNotification(chatId, title, message) {
  if (!chatId || !TELEGRAM_BOT_TOKEN) {
    console.error('❌ Отсутствует chatId или токен:', { chatId: !!chatId, token: !!TELEGRAM_BOT_TOKEN })
    return { success: false, error: 'Missing chatId or token' }
  }

  // Убеждаемся, что chatId - строка (Telegram API требует строку или число)
  const chatIdStr = String(chatId).trim()
  if (!chatIdStr) {
    console.error('❌ chatId пустой после преобразования:', chatId)
    return { success: false, error: 'Invalid chatId' }
  }

  try {
    const url = `${BOT_API_URL}${TELEGRAM_BOT_TOKEN}/sendMessage`
    const text = `*${title}*\n\n${message}`
    
    console.log(`📤 Отправка уведомления в Telegram:`, {
      chatId: chatIdStr,
      title: title,
      messageLength: message.length,
      url: url.replace(TELEGRAM_BOT_TOKEN, 'TOKEN_HIDDEN')
    })
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatIdStr, // Используем строку
        text: text,
        parse_mode: 'Markdown',
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('❌ Ошибка Telegram API:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      })
      return { success: false, error: errorData.description || `HTTP ${response.status}: ${response.statusText}` }
    }

    const responseData = await response.json().catch(() => ({}))
    console.log('✅ Уведомление успешно отправлено в Telegram:', {
      chatId: chatIdStr,
      messageId: responseData.result?.message_id
    })
    return { success: true, messageId: responseData.result?.message_id }
  } catch (error) {
    console.error('❌ Исключение при отправке в Telegram:', {
      error: error.message,
      stack: error.stack,
      chatId: chatIdStr
    })
    return { success: false, error: error.message }
  }
}

// Функция для проверки и отправки уведомлений
async function checkAndSendNotifications() {
  const now = new Date()
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  
  console.log(`🕐 Проверка уведомлений в ${currentTime} (UTC: ${now.toISOString()})`)
  console.log(`📊 Всего расписаний в памяти: ${notificationSchedules.size}`)

  let checkedCount = 0
  let sentCount = 0
  let errorCount = 0

  for (const [habitId, schedule] of notificationSchedules.entries()) {
    checkedCount++
    
    // Детальная проверка расписания
    if (!schedule.enabled) {
      console.log(`⏸️ Расписание "${schedule.name}" отключено`)
      continue
    }
    
    if (!schedule.time) {
      console.warn(`⚠️ Расписание "${schedule.name}" не имеет времени`)
      continue
    }
    
    if (!schedule.chatId) {
      console.warn(`⚠️ Расписание "${schedule.name}" не имеет chatId`)
      continue
    }

    const [scheduleHours, scheduleMinutes] = schedule.time.split(':').map(Number)
    
    // Проверка валидности времени
    if (isNaN(scheduleHours) || isNaN(scheduleMinutes) || scheduleHours < 0 || scheduleHours > 23 || scheduleMinutes < 0 || scheduleMinutes > 59) {
      console.error(`❌ Неверное время в расписании "${schedule.name}": ${schedule.time}`)
      continue
    }
    
    const scheduleTime = `${scheduleHours.toString().padStart(2, '0')}:${scheduleMinutes.toString().padStart(2, '0')}`
    
    console.log(`🔍 Проверка "${schedule.name}": запланировано на ${scheduleTime}, текущее время ${currentTime}`)
    
    // Проверяем, наступило ли время уведомления (с точностью до минуты)
    if (scheduleTime === currentTime) {
      // Проверяем, не отправляли ли мы уже уведомление в эту минуту
      const lastSentKey = `last_sent_${habitId}_${now.toDateString()}_${currentTime}`
      const lastSent = schedule.lastSent?.[lastSentKey]

      if (!lastSent) {
        console.log(`⏰ Время наступило для "${schedule.name}"! Отправляем уведомление...`)
        
        // Отправляем уведомление
        const characterName = schedule.character === 'babushka' ? 'Добрая Бабушка' :
                              schedule.character === 'gopnik' ? 'Гопник' :
                              schedule.character === 'teacher' ? 'Строгий Учитель' :
                              schedule.character === 'grandpa' ? 'Старый Дед' : 'Друг'
        
        const message = schedule.customNotificationMessage || 
                       `${characterName} напоминает: не забудь про "${schedule.name}"!`
        const title = `${characterName} напоминает: ${schedule.name}`
        
        const result = await sendTelegramNotification(schedule.chatId, title, message)
        
        if (result.success) {
          console.log(`✅ Уведомление отправлено для "${schedule.name}" (chatId: ${schedule.chatId})`)
          sentCount++
          
          // Сохраняем метку о том, что уведомление отправлено
          if (!schedule.lastSent) schedule.lastSent = {}
          schedule.lastSent[lastSentKey] = true
        } else {
          console.error(`❌ Ошибка при отправке уведомления для "${schedule.name}":`, result.error)
          errorCount++
        }
      } else {
        console.log(`⏭️ Уведомление для "${schedule.name}" уже отправлено в эту минуту`)
      }
    }
  }
  
  console.log(`📊 Итоги проверки: проверено ${checkedCount}, отправлено ${sentCount}, ошибок ${errorCount}`)
}

// API endpoint для добавления/обновления расписания уведомления
app.post('/api/schedule', (req, res) => {
  try {
    const { habitId, habit, chatId } = req.body
    
    console.log('📥 Получен запрос на сохранение расписания:', {
      habitId: habitId,
      habitName: habit?.name,
      notificationTime: habit?.notificationTime,
      notificationEnabled: habit?.notificationEnabled,
      chatId: chatId ? String(chatId).substring(0, 3) + '***' : null
    })
    
    if (!habitId || !habit || !chatId) {
      console.error('❌ Отсутствуют обязательные поля:', {
        hasHabitId: !!habitId,
        hasHabit: !!habit,
        hasChatId: !!chatId
      })
      return res.status(400).json({ success: false, error: 'Missing required fields' })
    }

    // Проверяем валидность времени
    if (habit.notificationTime) {
      const [hours, minutes] = habit.notificationTime.split(':').map(Number)
      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        console.error('❌ Неверный формат времени:', habit.notificationTime)
        return res.status(400).json({ success: false, error: 'Invalid time format. Use HH:mm' })
      }
    }

    // Убеждаемся, что chatId - строка
    const chatIdStr = String(chatId).trim()
    if (!chatIdStr) {
      console.error('❌ chatId пустой после преобразования')
      return res.status(400).json({ success: false, error: 'Invalid chatId' })
    }

    notificationSchedules.set(habitId, {
      id: habitId,
      name: habit.name,
      time: habit.notificationTime,
      enabled: habit.notificationEnabled,
      customNotificationMessage: habit.customNotificationMessage,
      character: habit.character,
      chatId: chatIdStr, // Сохраняем как строку
      lastSent: {}
    })

    console.log(`✅ Расписание сохранено: "${habit.name}" на ${habit.notificationTime} для chatId ${chatIdStr.substring(0, 3)}***`)
    console.log(`📊 Всего расписаний в памяти: ${notificationSchedules.size}`)
    
    // Возвращаем подтверждение с деталями
    res.json({ 
      success: true, 
      message: 'Schedule saved',
      schedule: {
        id: habitId,
        name: habit.name,
        time: habit.notificationTime,
        enabled: habit.notificationEnabled
      }
    })
  } catch (error) {
    console.error('❌ Ошибка при сохранении расписания:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// API endpoint для удаления расписания
app.delete('/api/schedule/:habitId', (req, res) => {
  try {
    const { habitId } = req.params
    notificationSchedules.delete(habitId)
    console.log(`🗑️ Расписание удалено для привычки ${habitId}`)
    res.json({ success: true, message: 'Schedule deleted' })
  } catch (error) {
    console.error('Ошибка при удалении расписания:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// API endpoint для получения всех расписаний (для отладки)
app.get('/api/schedules', (req, res) => {
  const schedules = Array.from(notificationSchedules.entries()).map(([id, schedule]) => ({
    id,
    name: schedule.name,
    time: schedule.time,
    enabled: schedule.enabled,
    chatId: schedule.chatId ? String(schedule.chatId).substring(0, 3) + '***' : null, // Частично скрываем chatId
    character: schedule.character
  }))
  res.json({ 
    success: true, 
    schedules,
    total: schedules.length,
    active: schedules.filter(s => s.enabled).length
  })
})

// API endpoint для тестирования отправки уведомления (для отладки)
app.post('/api/test-notification', async (req, res) => {
  try {
    const { chatId, message } = req.body
    
    if (!chatId) {
      return res.status(400).json({ success: false, error: 'Missing chatId' })
    }

    const testMessage = message || '🧪 Тестовое уведомление от сервера уведомлений!'
    const testTitle = 'Тест уведомления'
    
    console.log(`🧪 Тестовая отправка уведомления для chatId: ${chatId}`)
    
    const result = await sendTelegramNotification(chatId, testTitle, testMessage)
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Test notification sent',
        messageId: result.messageId
      })
    } else {
      res.status(500).json({ 
        success: false, 
        error: result.error || 'Failed to send test notification'
      })
    }
  } catch (error) {
    console.error('Ошибка при тестовой отправке:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Webhook endpoint для получения обновлений от Telegram
app.post('/webhook', express.json(), async (req, res) => {
  try {
    const update = req.body
    await handleUpdate(update)
    res.json({ ok: true })
  } catch (error) {
    console.error('Ошибка при обработке webhook:', error)
    res.status(500).json({ ok: false, error: error.message })
  }
})

// Health check endpoint (также используется для пробуждения Render.com)
app.get('/health', (req, res) => {
  const schedulesCount = notificationSchedules.size
  res.json({ 
    status: 'ok', 
    time: new Date().toISOString(),
    schedulesCount: schedulesCount,
    activeSchedules: Array.from(notificationSchedules.entries()).map(([id, s]) => ({
      id,
      name: s.name,
      time: s.time,
      enabled: s.enabled
    }))
  })
})

// Endpoint для пробуждения сервера (вызывается внешним cron)
app.get('/wake', (req, res) => {
  console.log('🔔 Сервер пробужден внешним запросом')
  res.json({ 
    status: 'awake', 
    time: new Date().toISOString(),
    message: 'Server is awake and ready'
  })
})

// Запускаем проверку уведомлений каждую минуту
cron.schedule('* * * * *', () => {
  checkAndSendNotifications()
})

// Проверяем сразу при запуске
checkAndSendNotifications()

// Логируем количество активных расписаний каждые 5 минут
cron.schedule('*/5 * * * *', () => {
  const activeCount = Array.from(notificationSchedules.values()).filter(s => s.enabled).length
  const totalCount = notificationSchedules.size
  console.log(`📊 Активных расписаний: ${activeCount} из ${totalCount}`)
  
  // Выводим список всех активных расписаний для отладки
  if (activeCount > 0) {
    const activeSchedules = Array.from(notificationSchedules.entries())
      .filter(([_, s]) => s.enabled)
      .map(([id, s]) => `${s.name} (${s.time})`)
    console.log(`📋 Активные расписания:`, activeSchedules.join(', '))
  }
})

// Пробуждение сервера каждые 10 минут (для Render.com бесплатного тарифа)
// Это предотвращает "засыпание" сервера
cron.schedule('*/10 * * * *', async () => {
  try {
    // Делаем внутренний запрос к /health для пробуждения
    const baseUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`
    await fetch(`${baseUrl}/health`).catch(() => {
      // Игнорируем ошибки, это просто для пробуждения
    })
    console.log('🔔 Сервер пробужден (каждые 10 минут)')
  } catch (error) {
    // Игнорируем ошибки пробуждения
  }
})

// Запускаем polling для бота (чтобы отвечать на команды)
async function startBotPolling() {
  let offset = 0
  
  async function pollUpdates() {
    try {
      const url = `${BOT_API_URL}${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${offset}&timeout=10`
      const response = await fetch(url)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Ошибка при получении обновлений:', errorText)
        return
      }
      
      const data = await response.json()
      
      if (data.ok && data.result.length > 0) {
        for (const update of data.result) {
          await handleUpdate(update)
          offset = update.update_id + 1
        }
      }
    } catch (error) {
      console.error('Ошибка при polling:', error)
    }
    
    // Повторяем через 1 секунду
    setTimeout(pollUpdates, 1000)
  }
  
  console.log('🤖 Запуск polling для бота...')
  pollUpdates()
}

// Запускаем сервер
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`)
  console.log(`📅 Проверка уведомлений каждую минуту`)
  startBotPolling()
})

