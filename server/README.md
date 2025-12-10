# Сервер уведомлений для Трекера Привычек

Простой Node.js сервер для отправки уведомлений через Telegram Bot API.

## Деплой на Render.com (бесплатно)

1. Зарегистрируйтесь на [Render.com](https://render.com)
2. Создайте новый "Web Service"
3. Подключите этот репозиторий
4. Настройки:
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`
   - **Environment Variables**: 
     - `TELEGRAM_BOT_TOKEN` (опционально, если не указан в коде)
5. Деплой!

## Использование

После деплоя получите URL вашего сервера (например: `https://your-app.onrender.com`)

### Добавить расписание уведомления:
```bash
POST https://your-app.onrender.com/api/schedule
Content-Type: application/json

{
  "habitId": "123",
  "chatId": "456789",
  "habit": {
    "name": "Не курить",
    "notificationTime": "09:00",
    "notificationEnabled": true,
    "character": "babushka",
    "customNotificationMessage": "Не забудь!"
  }
}
```

### Удалить расписание:
```bash
DELETE https://your-app.onrender.com/api/schedule/123
```

## Альтернативные варианты деплоя

### Railway.app
1. Зарегистрируйтесь на [Railway.app](https://railway.app)
2. Создайте новый проект
3. Подключите репозиторий
4. Railway автоматически определит Node.js проект

### Vercel (Serverless)
Можно использовать Vercel Serverless Functions, но для cron нужен внешний сервис типа cron-job.org

