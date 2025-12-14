// Скрипт для проверки готовности сервера к деплою
import { readFileSync } from 'fs';
import { existsSync } from 'fs';

console.log('🔍 Проверка готовности сервера к деплою...\n');

let errors = [];
let warnings = [];

// Проверка 1: package.json существует
console.log('1. Проверка package.json...');
if (existsSync('server/package.json')) {
  const pkg = JSON.parse(readFileSync('server/package.json', 'utf-8'));
  if (pkg.dependencies.express && pkg.dependencies['node-cron']) {
    console.log('   ✅ package.json корректен');
  } else {
    errors.push('Отсутствуют зависимости в package.json');
  }
} else {
  errors.push('package.json не найден');
}

// Проверка 2: server.js существует
console.log('2. Проверка server.js...');
if (existsSync('server/server.js')) {
  const serverCode = readFileSync('server/server.js', 'utf-8');
  if (serverCode.includes('express') && serverCode.includes('cron')) {
    console.log('   ✅ server.js найден и содержит необходимый код');
  } else {
    errors.push('server.js не содержит необходимый код');
  }
} else {
  errors.push('server.js не найден');
}

// Проверка 3: bot.js существует
console.log('3. Проверка bot.js...');
if (existsSync('server/bot.js')) {
  console.log('   ✅ bot.js найден');
} else {
  errors.push('bot.js не найден');
}

// Проверка 4: render.yaml существует
console.log('4. Проверка render.yaml...');
if (existsSync('render.yaml')) {
  console.log('   ✅ render.yaml найден');
} else {
  warnings.push('render.yaml не найден (не критично, можно настроить вручную)');
}

// Проверка 5: Токен бота присутствует
console.log('5. Проверка токена бота...');
if (existsSync('server/server.js')) {
  const serverCode = readFileSync('server/server.js', 'utf-8');
  if (serverCode.includes('7985172630:AAFTN9xGM2C-s0ni07VHOcCCZiyL3XbDh4o')) {
    console.log('   ✅ Токен бота найден в коде');
  } else {
    warnings.push('Токен бота не найден в коде (должен быть в переменной окружения)');
  }
}

// Итоги
console.log('\n📊 Результаты проверки:\n');

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ Все проверки пройдены! Сервер готов к деплою.');
  process.exit(0);
} else {
  if (errors.length > 0) {
    console.log('❌ Критические ошибки:');
    errors.forEach(err => console.log(`   - ${err}`));
  }
  if (warnings.length > 0) {
    console.log('⚠️  Предупреждения:');
    warnings.forEach(warn => console.log(`   - ${warn}`));
  }
  process.exit(errors.length > 0 ? 1 : 0);
}

