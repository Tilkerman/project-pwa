# Скрипт для тестирования уведомлений
# Использование: .\test-notification.ps1 YOUR_CHAT_ID

param(
    [Parameter(Mandatory=$true)]
    [string]$ChatId
)

Write-Host "🧪 Тестирование отправки уведомления..." -ForegroundColor Cyan
Write-Host "Chat ID: $ChatId" -ForegroundColor Yellow

try {
    $body = @{
        chatId = $ChatId
        message = "🧪 Тестовое уведомление от сервера! Если вы видите это сообщение - сервер работает правильно."
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "https://habit-tracker-notifications.onrender.com/api/test-notification" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body `
        -TimeoutSec 15

    if ($response.success) {
        Write-Host "✅ УВЕДОМЛЕНИЕ ОТПРАВЛЕНО!" -ForegroundColor Green
        Write-Host "Проверьте Telegram - должно прийти сообщение от бота @habitnotibot" -ForegroundColor Green
    } else {
        Write-Host "❌ Ошибка: $($response.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Ошибка при отправке: $($_.Exception.Message)" -ForegroundColor Red
}

