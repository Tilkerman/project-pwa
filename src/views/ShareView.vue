<template>
  <div class="share-view">
    <header class="page-header">
      <button class="back-btn" @click="goBack" aria-label="Назад">
        <span class="back-icon">←</span>
      </button>
      <h1 class="page-title">Поделиться</h1>
      <div style="width: 40px;"></div> <!-- Spacer для выравнивания -->
    </header>

    <div class="share-content">
      <div class="share-section">
        <h2 class="section-title">Поделитесь приложением</h2>
        <p class="section-description">
          Отправьте ссылку или QR код друзьям, чтобы они тоже могли начать отслеживать свои привычки!
        </p>
      </div>

      <div class="share-section">
        <h2 class="section-title">Как установить и пользоваться офлайн</h2>
        <p class="section-description">
          Приложение можно установить как PWA и пользоваться без интернета.
        </p>
        <ul class="instructions-list">
          <li><strong>Мобильный (Chrome/Edge/Telegram WebView):</strong> откройте меню браузера → «Добавить на экран» / «Установить приложение».</li>
          <li><strong>iOS (Safari/Telegram):</strong> кнопка «Поделиться» → «На экран Домой».</li>
          <li><strong>Desktop (Chrome/Edge):</strong> иконка установки справа от адресной строки → «Установить».</li>
          <li>После установки приложение работает офлайн: данные хранятся локально, синхронизация не требуется.</li>
        </ul>
      </div>

      <div class="share-section">
        <div class="qr-container">
          <canvas ref="qrCanvas" class="qr-code"></canvas>
        </div>
        <p class="qr-hint">Отсканируйте QR код, чтобы открыть приложение</p>
      </div>

      <div class="share-section">
        <div class="link-container">
          <input
            ref="linkInput"
            type="text"
            :value="appUrl"
            readonly
            class="link-input"
            @click="selectLink"
          />
          <button class="copy-btn" @click="copyLink">
            <span v-if="copied">✓ Скопировано</span>
            <span v-else>📋 Копировать</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const qrCanvas = ref<HTMLCanvasElement | null>(null)
const linkInput = ref<HTMLInputElement | null>(null)
const copied = ref(false)

const appUrl = ref('')

onMounted(async () => {
  // Получаем текущий URL приложения
  const baseUrl = import.meta.env.BASE_URL || '/'
  // Убираем завершающий слэш, если он есть
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  appUrl.value = window.location.origin + cleanBaseUrl
  
  // Генерируем QR код
  await nextTick()
  generateQRCode()
})

async function generateQRCode() {
  if (!qrCanvas.value) return

  try {
    // Используем динамический импорт для qrcode-generator
    const qrcodeModule = await import('qrcode-generator')
    const qrcode = (qrcodeModule as any).default || qrcodeModule
    
    const typeNumber = 0 // Автоматический выбор размера
    const errorCorrectionLevel = 'M' // Средний уровень коррекции ошибок
    const qr = qrcode(typeNumber, errorCorrectionLevel)
    
    qr.addData(appUrl.value)
    qr.make()

    const canvas = qrCanvas.value
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Размер QR кода
    const cellSize = 8
    const margin = 4
    const size = qr.getModuleCount() * cellSize + margin * 2
    
    canvas.width = size
    canvas.height = size

    // Очищаем canvas
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)

    // Рисуем QR код
    ctx.fillStyle = '#000000'
    for (let row = 0; row < qr.getModuleCount(); row++) {
      for (let col = 0; col < qr.getModuleCount(); col++) {
        if (qr.isDark(row, col)) {
          ctx.fillRect(
            col * cellSize + margin,
            row * cellSize + margin,
            cellSize,
            cellSize
          )
        }
      }
    }
  } catch (error) {
    console.error('Ошибка при генерации QR кода:', error)
    // Если не получилось, показываем сообщение об ошибке
    if (qrCanvas.value) {
      const ctx = qrCanvas.value.getContext('2d')
      if (ctx) {
        const size = 200
        qrCanvas.value.width = size
        qrCanvas.value.height = size
        ctx.fillStyle = '#fee2e2'
        ctx.fillRect(0, 0, size, size)
        ctx.fillStyle = '#991b1b'
        ctx.font = '14px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('Ошибка генерации QR', size / 2, size / 2)
      }
    }
  }
}

function selectLink() {
  if (linkInput.value) {
    linkInput.value.select()
  }
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(appUrl.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    // Fallback для старых браузеров
    if (linkInput.value) {
      linkInput.value.select()
      document.execCommand('copy')
      copied.value = true
      setTimeout(() => {
        copied.value = false
      }, 2000)
    }
  }
}

function goBack() {
  router.push('/settings')
}
</script>

<style scoped>
.share-view {
  min-height: 100vh;
  background: var(--bg-primary);
  padding-bottom: 2rem;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn {
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  transition: background 0.2s;
}

.back-btn:hover {
  background: var(--bg-hover);
}

.back-icon {
  font-size: 1.5rem;
  color: var(--text-primary);
}

.page-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.share-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 1.5rem;
}

.share-section {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: var(--shadow-sm);
  text-align: center;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.section-description {
  font-size: 0.9375rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

.qr-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  margin: 1.5rem 0;
}

.qr-code {
  max-width: 100%;
  height: auto;
}

.qr-hint {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.link-container {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}

.link-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 0.875rem;
  font-family: 'Courier New', monospace;
  background: var(--bg-primary);
  color: var(--text-primary);
  cursor: text;
  transition: border-color 0.2s;
}

.link-input:focus {
  outline: none;
  border-color: #4f46e5;
}

.copy-btn {
  padding: 0.75rem 1.5rem;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.copy-btn:hover {
  background: #4338ca;
}

.copy-btn:active {
  transform: scale(0.98);
}

.instructions-list {
  margin: 1rem 0 0 0;
  padding-left: 1.25rem;
  text-align: left;
  color: var(--text-secondary);
  line-height: 1.6;
}

.instructions-list li {
  margin-bottom: 0.5rem;
  font-size: 0.9375rem;
}

.instructions-list li:last-child {
  margin-bottom: 0;
}

@media (max-width: 520px) {
  .link-container {
    flex-direction: column;
    align-items: stretch;
  }

  .link-input {
    width: 100%;
  }

  .copy-btn {
    width: 100%;
    text-align: center;
  }
}
</style>

