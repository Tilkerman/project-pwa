# Сервер уведомлений для Трекера Привычек

Простой Node.js сервер для отправки уведомлений через Telegram Bot API. Использует Express и node-cron для планирования задач.

**Версия:** 1.0.0  
**Node.js:** >=18.0.0

## Деплой на Render.com (бесплатно)

### Автоматический деплой через render.yaml

Проект включает файл `render.yaml` в корне репозитория для автоматической настройки:

1. Зарегистрируйтесь на [Render.com](https://render.com)
2. Подключите репозиторий GitHub
3. Render автоматически обнаружит `render.yaml` и создаст сервис
4. Добавьте переменную окружения `TELEGRAM_BOT_TOKEN` с токеном вашего бота
5. Деплой запустится автоматически

### Ручная настройка

Если вы не используете `render.yaml`:

1. Зарегистрируйтесь на [Render.com](https://render.com)
2. Создайте новый "Web Service"
3. Подключите этот репозиторий
4. Настройки:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**: 
     - `TELEGRAM_BOT_TOKEN` - токен вашего Telegram бота (обязательно)
5. Деплой!

## Использование

После деплоя получите URL вашего сервера (например: `https://your-app.onrender.com`)

### API Endpoints

#### Добавить/обновить расписание уведомления

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

**Параметры:**
- `habitId` (string) - уникальный ID привычки
- `chatId` (string) - Telegram chat ID пользователя
- `habit` (object) - объект привычки:
  - `name` (string) - название привычки
  - `notificationTime` (string) - время уведомления в формате HH:mm (локальное время пользователя)
  - `notificationEnabled` (boolean) - включены ли уведомления
  - `character` (string) - тип персонажа: "babushka", "gopnik", "teacher", "grandpa"
  - `customNotificationMessage` (string, опционально) - кастомное сообщение

#### Удалить расписание

```bash
DELETE https://your-app.onrender.com/api/schedule/{habitId}
```

#### Получить все расписания (для отладки)

```bash
GET https://your-app.onrender.com/api/schedules
```

### Как работает сервер

1. Сервер получает расписания через POST `/api/schedule`
2. Использует `node-cron` для проверки времени каждую минуту
3. Отправляет уведомления через Telegram Bot API в указанное время
4. Учитывает часовой пояс пользователя (по умолчанию Europe/Saratov)
5. Генерирует мотивирующие сообщения от выбранного персонажа

**Важно:** 
- Расписания хранятся в памяти сервера (при перезапуске теряются)
- Для продакшена рекомендуется использовать базу данных (Redis, PostgreSQL)
- Сервер автоматически проверяет время каждую минуту и отправляет уведомления

## Telegram бот

Сервер включает функциональность Telegram бота для получения Chat ID пользователей.

### Команды бота

- `/start` - показывает приветственное сообщение и Chat ID пользователя
- `/help` - показывает справку по использованию

### Получение Chat ID

1. Найдите вашего бота в Telegram (по username или через поиск)
2. Отправьте команду `/start`
3. Бот ответит с вашим Chat ID
4. Используйте этот Chat ID в настройках приложения

## Технические детали

### Зависимости
- `express` ^4.18.2 - веб-сервер
- `node-cron` ^3.0.3 - планирование задач

### Переменные окружения
- `TELEGRAM_BOT_TOKEN` - токен Telegram бота (обязательно)
- `PORT` - порт сервера (по умолчанию 3000)

### Часовые пояса
Сервер по умолчанию использует часовой пояс `Europe/Saratov` для определения локального времени пользователя. Это можно изменить в коде функции `checkAndSendNotifications()`.

## Альтернативные варианты деплоя

### Railway.app
1. Зарегистрируйтесь на [Railway.app](https://railway.app)
2. Создайте новый проект
3. Подключите репозиторий
4. Railway автоматически определит Node.js проект
5. Укажите Root Directory: `server`
6. Добавьте переменную окружения `TELEGRAM_BOT_TOKEN`

### Vercel (Serverless)
Можно использовать Vercel Serverless Functions, но для cron нужен внешний сервис типа cron-job.org или использование Vercel Cron Jobs (платная функция).

### Heroku
1. Создайте приложение на Heroku
2. Подключите репозиторий
3. Установите переменную окружения `TELEGRAM_BOT_TOKEN`
4. Используйте buildpack для Node.js

## Локальный запуск

```bash
cd server
npm install
TELEGRAM_BOT_TOKEN=your_token_here npm start
```

Сервер запустится на `http://localhost:3000`

## Отладка

Сервер выводит подробные логи в консоль:
- Время проверки уведомлений
- Количество активных расписаний
- Статус отправки уведомлений
- Ошибки при отправке

Для просмотра логов на Render.com перейдите в раздел "Logs" вашего сервиса.

