// Telegram бот для обработки команд и отправки уведомлений
// Отвечает на /start и отправляет Chat ID пользователю

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7985172630:AAFTN9xGM2C-s0ni07VHOcCCZiyL3XbDh4o'
const BOT_API_URL = 'https://api.telegram.org/bot'

// Функция для отправки сообщения через Telegram Bot API
async function sendMessage(chatId, text, options = {}) {
  try {
    const url = `${BOT_API_URL}${TELEGRAM_BOT_TOKEN}/sendMessage`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: options.parse_mode || 'Markdown',
        ...options,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Ошибка при отправке сообщения:', errorData)
      return { success: false, error: errorData.description || 'Failed to send' }
    }

    return { success: true }
  } catch (error) {
    console.error('Ошибка при отправке сообщения:', error)
    return { success: false, error: error.message }
  }
}

// Обработка обновлений от Telegram (webhook или polling)
async function handleUpdate(update) {
  if (!update.message) return

  const message = update.message
  const chatId = message.chat.id
  const text = message.text
  const firstName = message.from.first_name || 'Пользователь'

  // Обработка команды /start
  if (text === '/start' || text?.startsWith('/start')) {
    const welcomeMessage = `👋 Привет, ${firstName}!

✅ Твой Chat ID: \`${chatId}\`

📝 Скопируй этот Chat ID и вставь его в настройках приложения "Трекер Привычек".

🔔 После этого ты будешь получать уведомления о привычках прямо в Telegram!

💡 Если у тебя есть вопросы, просто напиши мне.`

    await sendMessage(chatId, welcomeMessage)
    console.log(`✅ Отправлен Chat ID пользователю ${chatId}`)
    return
  }

  // Обработка других сообщений
  if (text) {
    const helpMessage = `ℹ️ Доступные команды:

/start - Получить Chat ID

💡 Твой Chat ID: \`${chatId}\`

Скопируй его и используй в настройках приложения.`

    await sendMessage(chatId, helpMessage)
  }
}

// Экспортируем функции для использования в server.js
export { sendMessage, handleUpdate }

// Если файл запущен напрямую, используем polling (для тестирования)
// Проверяем, запущен ли файл напрямую
const isMainModule = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))

if (isMainModule || process.argv[1]?.includes('bot.js')) {
  console.log('🤖 Запуск бота в режиме polling...')
  
  let offset = 0
  
  async function pollUpdates() {
    try {
      const url = `${BOT_API_URL}${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${offset}&timeout=10`
      const response = await fetch(url)
      
      if (!response.ok) {
        console.error('Ошибка при получении обновлений:', await response.text())
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
  
  pollUpdates()
}

