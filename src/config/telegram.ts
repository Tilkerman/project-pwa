// Конфигурация общего Telegram бота
// Этот токен используется для всех пользователей приложения

// ВАЖНО: Замените этот токен на токен вашего бота!
// Создайте бота через @BotFather один раз и вставьте токен сюда
export const TELEGRAM_BOT_TOKEN = '7985172630:AAFTN9xGM2C-s0ni07VHOcCCZiyL3XbDh4o'

// Если токен не установлен, Telegram уведомления будут отключены
export function isTelegramBotConfigured(): boolean {
  return TELEGRAM_BOT_TOKEN !== 'YOUR_BOT_TOKEN_HERE' && TELEGRAM_BOT_TOKEN.length > 0
}

