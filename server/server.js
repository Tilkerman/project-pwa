// Сервер для отправки уведомлений через Telegram Bot API
// Работает на Render.com бесплатно

import express from 'express'
import cron from 'node-cron'
import { handleUpdate, sendMessage } from './bot.js'
import fs from 'fs/promises'
import path from 'path'

const app = express()
const PORT = process.env.PORT || 3000

// Токен Telegram бота (из переменной окружения или напрямую)
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7985172630:AAFTN9xGM2C-s0ni07VHOcCCZiyL3XbDh4o'
const BOT_API_URL = 'https://api.telegram.org/bot'

// Хранилище расписаний (в продакшене лучше использовать базу данных)
const notificationSchedules = new Map()

// Простая персистентность на файловой системе (лучше, чем терять всё при рестарте процесса).
// Примечание: на бесплатном Render диск не гарантированно постоянный между пересозданиями инстанса,
// но это сильно повышает стабильность при обычных рестартах/перезапусках процесса.
const DATA_FILE = path.resolve(process.cwd(), 'schedules.json')

async function loadSchedulesFromDisk() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8')
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return
    notificationSchedules.clear()
    for (const s of parsed) {
      if (!s?.id) continue
      notificationSchedules.set(s.id, {
        ...s,
        lastSent: s.lastSent && typeof s.lastSent === 'object' ? s.lastSent : {}
      })
    }
    console.log(`💾 Загружено расписаний с диска: ${notificationSchedules.size}`)
  } catch (e) {
    // файла может не быть — это нормально
    console.log('ℹ️ schedules.json не найден или не удалось загрузить (это нормально при первом запуске)')
  }
}

async function saveSchedulesToDisk() {
  try {
    const arr = Array.from(notificationSchedules.values()).map((s) => ({
      id: s.id,
      name: s.name,
      time: s.time,
      timeLocal: s.timeLocal || null,
      timeZone: s.timeZone || null,
      enabled: !!s.enabled,
      customNotificationMessage: s.customNotificationMessage,
      character: s.character,
      chatId: s.chatId,
      lastSent: s.lastSent || {}
    }))
    await fs.writeFile(DATA_FILE, JSON.stringify(arr, null, 2), 'utf-8')
  } catch (e) {
    console.warn('⚠️ Не удалось сохранить schedules.json:', e?.message || e)
  }
}

// Middleware для парсинга JSON
app.use(express.json())

// CORS (критично для GitHub Pages/PWA -> Render.com)
// Без этого браузер блокирует POST /api/schedule (preflight OPTIONS).
app.use((req, res, next) => {
  // Разрешаем запросы со всех источников (для API без cookie/credentials это ок).
  // Если захотите ограничить — используйте allowlist по Origin.
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Max-Age', '86400')

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }
  next()
})

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
  const currentUtcTime = `${now.getUTCHours().toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')}`
  
  // Получаем время в разных часовых поясах для отладки
  const moscowTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Moscow' }))
  const saratovTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Saratov' }))
  
  console.log(`🕐 Проверка уведомлений в ${currentUtcTime} UTC`)
  console.log(`🌍 Время по Москве: ${moscowTime.getHours().toString().padStart(2, '0')}:${moscowTime.getMinutes().toString().padStart(2, '0')}`)
  console.log(`🌍 Время по Саратову: ${saratovTime.getHours().toString().padStart(2, '0')}:${saratovTime.getMinutes().toString().padStart(2, '0')}`)
  console.log(`📊 Всего расписаний в памяти: ${notificationSchedules.size}`)

  const getTimeInZone = (date, timeZone) => {
    try {
      // formatToParts не зависит от локали и не требует парсинга строк
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).formatToParts(date)
      const hh = parts.find((p) => p.type === 'hour')?.value
      const mm = parts.find((p) => p.type === 'minute')?.value
      if (!hh || !mm) return null
      return `${hh}:${mm}`
    } catch {
      return null
    }
  }

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

    // NEW: предпочитаем localTime + timeZone (работает для всех стран + DST),
    // НО только если мы реально можем вычислить "сейчас" в этой таймзоне.
    // Иначе безопасно откатываемся на UTC-режим (legacy), чтобы не было "тишины".
    const scheduleLocalTime = schedule.timeLocal || null
    const scheduleTimeZone = schedule.timeZone || null
    const nowInZone =
      scheduleLocalTime && scheduleTimeZone ? getTimeInZone(now, scheduleTimeZone) : null
    const useLocal = !!(scheduleLocalTime && scheduleTimeZone && nowInZone)
    const effectiveNowTime = useLocal ? nowInZone : currentUtcTime
    const effectiveScheduleTime = useLocal ? scheduleLocalTime : schedule.time // legacy: schedule.time (UTC HH:mm)

    if (scheduleLocalTime && scheduleTimeZone && !nowInZone) {
      console.warn(
        `⚠️ Не удалось вычислить время в TZ "${scheduleTimeZone}". Падаем обратно на UTC для "${schedule.name}".`
      )
    }

    console.log(`🔍 Проверка "${schedule.name}": запланировано на ${effectiveScheduleTime}${scheduleTimeZone ? ` (${scheduleTimeZone})` : ' (UTC)'}, текущее время ${effectiveNowTime}${scheduleTimeZone ? ` (${scheduleTimeZone})` : ' (UTC)'}`)
    
    // Проверяем, наступило ли время уведомления.
    // ВАЖНО: на free-хостингах (Render) сервер может "просыпаться" с задержкой.
    // Поэтому используем окно догонки: если мы пропустили время на несколько минут, всё равно отправим.
    const toMinutes = (hhmm) => {
      if (!hhmm || typeof hhmm !== 'string') return null
      const [h, m] = hhmm.split(':').map(Number)
      if (Number.isNaN(h) || Number.isNaN(m)) return null
      return h * 60 + m
    }
    const nowMin = toMinutes(effectiveNowTime)
    const schedMin = toMinutes(effectiveScheduleTime)
    const CATCHUP_MINUTES = 15
    // Обрабатываем кейс после полуночи: запланировано вчера поздно, сейчас чуть позже полуночи.
    const diffMin =
      nowMin !== null && schedMin !== null
        ? (nowMin >= schedMin ? nowMin - schedMin : nowMin + 1440 - schedMin)
        : null
    const isDue = diffMin !== null && diffMin >= 0 && diffMin <= CATCHUP_MINUTES

    if (isDue) {
      // Проверяем, не отправляли ли мы уже уведомление в эту минуту
      // Ключ не по минуте "сейчас", а по запланированной минуте (иначе в окне догонки может задвоить)
      // Если догоняем после полуночи (nowMin < schedMin), то считаем что "запланированная дата" была вчера.
      const dateForKey = (() => {
        if (nowMin === null || schedMin === null) return now.toISOString().slice(0, 10)
        if (nowMin >= schedMin) return now.toISOString().slice(0, 10)
        const d = new Date(now)
        d.setDate(d.getDate() - 1)
        return d.toISOString().slice(0, 10)
      })()
      const lastSentKey = `last_sent_${habitId}_${dateForKey}_${effectiveScheduleTime}_${useLocal ? scheduleTimeZone : 'UTC'}`
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
          // сохраняем прогресс на диск
          await saveSchedulesToDisk()
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

    // NEW: предпочитаем localTime+timeZone, но валидируем TZ, чтобы не ломать сравнения.
    let timeLocal = habit.notificationTimeLocal || null
    let timeZone = habit.timeZone || null
    if (timeLocal && timeZone) {
      try {
        // Проверяем, что Intl поддерживает указанную TZ
        new Intl.DateTimeFormat('en-US', { timeZone }).format(new Date())
      } catch {
        console.warn(`⚠️ Невалидная/неподдерживаемая TZ "${timeZone}". Откатываемся на UTC режим.`)
        timeLocal = null
        timeZone = null
      }
    }
    const timeToValidate = timeLocal || habit.notificationTime

    // Проверяем валидность времени (HH:mm)
    if (timeToValidate) {
      const [hours, minutes] = String(timeToValidate).split(':').map(Number)
      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        console.error('❌ Неверный формат времени:', timeToValidate)
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
      // legacy UTC time
      time: habit.notificationTime,
      // NEW: local time + timezone
      timeLocal: timeLocal,
      timeZone: timeZone,
      enabled: habit.notificationEnabled,
      customNotificationMessage: habit.customNotificationMessage,
      character: habit.character,
      chatId: chatIdStr, // Сохраняем как строку
      lastSent: {}
    })
    // сохраняем расписания
    saveSchedulesToDisk()

    console.log(`✅ Расписание сохранено: "${habit.name}" на ${timeLocal ? `${timeLocal} (${timeZone || 'unknown tz'})` : `${habit.notificationTime} (UTC)`} для chatId ${chatIdStr.substring(0, 3)}***`)
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
    saveSchedulesToDisk()
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
    // NEW preferred
    timeLocal: schedule.timeLocal || null,
    timeZone: schedule.timeZone || null,
    // legacy
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

// Диагностика времени/таймзон (помогает понять, почему "не пришло в 16:34")
// GET /api/time?tz=Europe/Moscow
app.get('/api/time', (req, res) => {
  const now = new Date()
  const tz = typeof req.query.tz === 'string' ? req.query.tz : null
  let nowInTz = null
  let tzOk = null
  if (tz) {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).formatToParts(now)
      const hh = parts.find((p) => p.type === 'hour')?.value
      const mm = parts.find((p) => p.type === 'minute')?.value
      const ss = parts.find((p) => p.type === 'second')?.value
      nowInTz = hh && mm && ss ? `${hh}:${mm}:${ss}` : null
      tzOk = true
    } catch (e) {
      tzOk = false
      nowInTz = null
    }
  }
  res.json({
    ok: true,
    nowIso: now.toISOString(),
    nowUtc: `${now.getUTCHours().toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')}:${now.getUTCSeconds().toString().padStart(2, '0')}`,
    tz,
    tzOk,
    nowInTz,
    node: process.version,
  })
})

// Запускаем проверку уведомлений каждую минуту
cron.schedule('* * * * *', () => {
  checkAndSendNotifications()
})

// Проверяем сразу при запуске
await loadSchedulesFromDisk()
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

