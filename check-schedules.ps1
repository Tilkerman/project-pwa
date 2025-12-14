# Скрипт для проверки расписаний на сервере

Write-Host "📋 Проверка расписаний на сервере..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "https://habit-tracker-notifications.onrender.com/api/schedules" `
        -Method Get `
        -TimeoutSec 15

    Write-Host "✅ Сервер отвечает!" -ForegroundColor Green
    Write-Host "Всего расписаний: $($response.total)" -ForegroundColor Yellow
    Write-Host "Активных: $($response.active)" -ForegroundColor Yellow
    
    if ($response.schedules -and $response.schedules.Count -gt 0) {
        Write-Host "`n📅 Список расписаний:" -ForegroundColor Cyan
        foreach ($schedule in $response.schedules) {
            $status = if ($schedule.enabled) { "✅" } else { "⏸️" }
            Write-Host "  $status $($schedule.name) - $($schedule.time) (ID: $($schedule.id))" -ForegroundColor White
        }
    } else {
        Write-Host "`n⚠️ Расписаний пока нет" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Ошибка: $($_.Exception.Message)" -ForegroundColor Red
}

