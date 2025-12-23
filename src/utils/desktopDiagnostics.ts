// Диагностика проблем с десктопом
// Этот файл помогает определить, почему приложение не работает в обычном браузере

export function runDesktopDiagnostics(): void {
  console.log('🔍 === ДИАГНОСТИКА ДЕСКТОПА ===')
  
  // 1. Проверка IndexedDB
  console.log('\n1. Проверка IndexedDB:')
  if ('indexedDB' in window) {
    console.log('✅ IndexedDB доступен')
    try {
      const request = indexedDB.open('test-db', 1)
      request.onerror = () => console.error('❌ IndexedDB не может открыть базу данных')
      request.onsuccess = () => {
        console.log('✅ IndexedDB работает')
        indexedDB.deleteDatabase('test-db')
      }
    } catch (error) {
      console.error('❌ Ошибка IndexedDB:', error)
    }
  } else {
    console.error('❌ IndexedDB недоступен в этом браузере')
  }
  
  // 2. Проверка Service Worker
  console.log('\n2. Проверка Service Worker:')
  if ('serviceWorker' in navigator) {
    console.log('✅ Service Worker доступен')
    navigator.serviceWorker.getRegistrations().then(regs => {
      console.log(`✅ Зарегистрировано SW: ${regs.length}`)
      regs.forEach((reg, i) => {
        console.log(`   SW ${i + 1}: ${reg.scope}`)
      })
    }).catch(err => {
      console.error('❌ Ошибка при получении регистраций SW:', err)
    })
  } else {
    console.error('❌ Service Worker недоступен')
  }
  
  // 3. Проверка Telegram API
  console.log('\n3. Проверка Telegram API:')
  const hasTelegram = !!(window as any).Telegram?.WebApp || (window as any).TelegramWebApp
  if (hasTelegram) {
    console.log('✅ Telegram API найден (запущено в Telegram)')
  } else {
    console.log('ℹ️ Telegram API не найден (обычный браузер)')
  }
  
  // 4. Проверка DOM
  console.log('\n4. Проверка DOM:')
  const appElement = document.getElementById('app')
  if (appElement) {
    console.log('✅ Элемент #app найден')
    console.log(`   Содержимое: ${appElement.innerHTML.substring(0, 100)}...`)
  } else {
    console.error('❌ Элемент #app не найден!')
  }
  
  // 5. Проверка Vue
  console.log('\n5. Проверка Vue:')
  const vueApp = (window as any).__VUE_APP__
  if (vueApp) {
    console.log('✅ Vue приложение найдено')
  } else {
    console.log('ℹ️ Vue приложение еще не загружено (это нормально при первой загрузке)')
  }
  
  // 6. Проверка localStorage
  console.log('\n6. Проверка localStorage:')
  try {
    localStorage.setItem('test', 'test')
    localStorage.removeItem('test')
    console.log('✅ localStorage работает')
  } catch (error) {
    console.error('❌ localStorage заблокирован:', error)
  }
  
  // 7. Проверка ошибок в консоли
  console.log('\n7. Проверка ошибок:')
  const originalError = console.error
  let errorCount = 0
  console.error = (...args: any[]) => {
    errorCount++
    originalError.apply(console, args)
  }
  
  setTimeout(() => {
    if (errorCount > 0) {
      console.warn(`⚠️ Обнаружено ${errorCount} ошибок в консоли`)
    } else {
      console.log('✅ Ошибок не обнаружено')
    }
  }, 2000)
  
  console.log('\n🔍 === КОНЕЦ ДИАГНОСТИКИ ===\n')
}

// Автоматический запуск диагностики в режиме разработки
if (import.meta.env.DEV) {
  // Запускаем диагностику после загрузки DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runDesktopDiagnostics)
  } else {
    runDesktopDiagnostics()
  }
  
  // Также запускаем через небольшую задержку для проверки после инициализации Vue
  setTimeout(runDesktopDiagnostics, 3000)
}

