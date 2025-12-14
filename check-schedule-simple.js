import https from 'https';

console.log('Проверка расписаний...\n');

https.get('https://habit-tracker-notifications.onrender.com/api/schedules', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('Всего расписаний:', json.total);
      console.log('Активных:', json.active);
      if (json.schedules && json.schedules.length > 0) {
        console.log('\nРасписания:');
        json.schedules.forEach(s => {
          console.log('  -', s.name, 'в', s.time, 'UTC');
          const [h, m] = s.time.split(':').map(Number);
          const saratovH = (h + 4) % 24;
          const saratovTime = String(saratovH).padStart(2, '0') + ':' + String(m).padStart(2, '0');
          console.log('    По Саратову:', saratovTime);
        });
      } else {
        console.log('\nРасписаний нет!');
      }
    } catch(e) {
      console.log('Ошибка:', e.message);
    }
  });
}).on('error', (e) => {
  console.log('Ошибка:', e.message);
});

