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
    return { success: false, error: 'Missing chatId or token' }
  }

  try {
    const url = `${BOT_API_URL}${TELEGRAM_BOT_TOKEN}/sendMessage`
    const text = `*${title}*\n\n${message}`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown',
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return { success: false, error: errorData.description || 'Failed to send' }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Функция для проверки и отправки уведомлений
async function checkAndSendNotifications() {
  const now = new Date()
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  
  console.log(`🕐 Проверка уведомлений в ${currentTime}`)

  for (const [habitId, schedule] of notificationSchedules.entries()) {
    if (!schedule.enabled || !schedule.time || !schedule.chatId) continue

    const [scheduleHours, scheduleMinutes] = schedule.time.split(':').map(Number)
    const scheduleTime = `${scheduleHours.toString().padStart(2, '0')}:${scheduleMinutes.toString().padStart(2, '0')}`
    
    // Проверяем, наступило ли время уведомления (с точностью до минуты)
    if (scheduleTime === currentTime) {
      // Проверяем, не отправляли ли мы уже уведомление в эту минуту
      const lastSentKey = `last_sent_${habitId}_${now.toDateString()}_${currentTime}`
      const lastSent = schedule.lastSent?.[lastSentKey]

      if (!lastSent) {
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
          
          // Сохраняем метку о том, что уведомление отправлено
          if (!schedule.lastSent) schedule.lastSent = {}
          schedule.lastSent[lastSentKey] = true
        } else {
          console.error(`❌ Ошибка при отправке уведомления для "${schedule.name}":`, result.error)
        }
      }
    }
  }
}

// API endpoint для добавления/обновления расписания уведомления
app.post('/api/schedule', (req, res) => {
  try {
    const { habitId, habit, chatId } = req.body
    
    if (!habitId || !habit || !chatId) {
      return res.status(400).json({ success: false, error: 'Missing required fields' })
    }

    notificationSchedules.set(habitId, {
      id: habitId,
      name: habit.name,
      time: habit.notificationTime,
      enabled: habit.notificationEnabled,
      customNotificationMessage: habit.customNotificationMessage,
      character: habit.character,
      chatId: chatId,
      lastSent: {}
    })

    console.log(`📅 Расписание сохранено: "${habit.name}" на ${habit.notificationTime} для chatId ${chatId}`)
    res.json({ success: true, message: 'Schedule saved' })
  } catch (error) {
    console.error('Ошибка при сохранении расписания:', error)
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
    enabled: schedule.enabled
  }))
  res.json({ success: true, schedules })
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

// Запускаем проверку уведомлений каждую минуту
cron.schedule('* * * * *', () => {
  checkAndSendNotifications()
})

// Проверяем сразу при запуске
checkAndSendNotifications()

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

