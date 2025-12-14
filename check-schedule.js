// Простой скрипт для проверки расписаний
import https from 'https';

console.log('🔍 Проверка расписаний на сервере...\n');

https.get('https://habit-tracker-notifications.onrender.com/api/schedules', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('✅ Сервер отвечает!');
      console.log(`📊 Всего расписаний: ${json.total}`);
      console.log(`📊 Активных: ${json.active}`);
      
      if (json.schedules && json.schedules.length > 0) {
        console.log('\n📅 Список расписаний:');
        json.schedules.forEach(s => {
          const status = s.enabled ? '✅' : '⏸️';
          console.log(`  ${status} "${s.name}" - ${s.time} UTC`);
          console.log(`     ID: ${s.id.substring(0, 20)}...`);
          
          // Проверка времени для Саратова (UTC+4)
          const [hours, minutes] = s.time.split(':').map(Number);
          const saratovHours = (hours + 4) % 24;
          const saratovTime = `${saratovHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          console.log(`     ⏰ По Саратову: ${saratovTime}`);
        });
      } else {
        console.log('\n⚠️ Расписаний пока нет');
      }
    } catch(e) {
      console.log('❌ Ошибка парсинга:', e.message);
      console.log('Ответ сервера:', data);
    }
  });
}).on('error', (e) => {
  console.log('❌ Ошибка подключения:', e.message);
});

