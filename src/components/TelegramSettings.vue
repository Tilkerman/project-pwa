<template>
  <div class="telegram-settings">
    <h3 class="settings-title">
      <span class="telegram-icon">📱</span>
      Telegram уведомления
    </h3>
    
    <div class="setting-item">
      <label class="setting-label">
        <input
          v-model="enabled"
          type="checkbox"
          class="checkbox"
          @change="updateSettings"
        />
        Включить Telegram уведомления
      </label>
      <p class="setting-description">
        Получайте уведомления в Telegram даже когда приложение закрыто. 
        Работает на всех устройствах, включая iOS!
      </p>
    </div>

    <div class="telegram-config">
      <div v-if="!isBotConfigured" class="bot-not-configured">
        <p>⚠️ Telegram бот не настроен администратором. Обратитесь к разработчику.</p>
      </div>

      <div v-else class="config-section">
        <div v-if="!chatId" class="telegram-login-section">
          <p class="login-description">
            Авторизуйтесь через Telegram, чтобы получать уведомления:
          </p>
          <div id="telegram-login-container"></div>
          <p class="login-hint">
            Или введите ваш username Telegram (например: @username) или номер телефона
          </p>
          <div class="alternative-input">
            <input
              id="telegram-username"
              v-model="telegramInput"
              type="text"
              class="config-input"
              placeholder="@username или Chat ID"
              @keyup.enter="processTelegramInput"
            />
            <button 
              v-if="telegramInput"
              class="btn-test"
              @click="processTelegramInput"
              :disabled="testing"
            >
              {{ testing ? 'Проверка...' : 'Подключить' }}
            </button>
            <p class="input-hint">
              Введите ваш username Telegram (например: @ivanov) или Chat ID (если знаете)
            </p>
          </div>
        </div>
        
        <div v-else class="connected-section">
          <div class="connected-info">
            <span class="success-icon">✅</span>
            <span>Telegram подключен! Chat ID: {{ chatId }}</span>
          </div>
          <button 
            class="btn-test"
            @click="testConnection"
            :disabled="testing"
          >
            {{ testing ? 'Проверка...' : 'Отправить тест' }}
          </button>
          <button 
            class="btn-disconnect"
            @click="disconnectTelegram"
          >
            Отключить
          </button>
        </div>
      </div>

      <div v-if="testResult" class="test-result" :class="testResult.success ? 'success' : 'error'">
        <span class="result-icon">{{ testResult.success ? '✅' : '❌' }}</span>
        <span>{{ testResult.message }}</span>
      </div>

      <div v-if="isBotConfigured && !chatId" class="instructions">
        <h4 class="instructions-title">Как подключить Telegram (2 простых шага):</h4>
        <ol class="instructions-list">
          <li>
            Введите ваш <strong>username Telegram</strong> (например: <code>@ivanov</code> или просто <code>ivanov</code>) и нажмите "Подключить"
          </li>
          <li>
            Откройте Telegram, найдите бота <strong>@{{ botInfo?.username || 'ваш_бот' }}</strong> и отправьте ему команду <code>/start</code>
          </li>
          <li>
            Бот отправит вам ваш <strong>Chat ID</strong> - скопируйте его и вставьте в поле выше
          </li>
          <li>
            Готово! Уведомления будут приходить в Telegram 🎉
          </li>
        </ol>
        <div class="instructions-note">
          <strong>💡 Важно:</strong> Ваши данные хранятся только в вашем браузере. 
          Никто кроме вас не имеет к ним доступа.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  getTelegramConfig,
  saveTelegramConfig,
  testTelegramConnection,
  getBotInfo,
  sendSetupMessageToUser,
} from '@/utils/telegram'
import { isTelegramBotConfigured } from '@/config/telegram'

const enabled = ref(false)
const chatId = ref('')
const telegramInput = ref('')
const testing = ref(false)
const testResult = ref<{ success: boolean; message: string } | null>(null)
const botInfo = ref<{ username?: string; firstName?: string } | null>(null)

const isBotConfigured = computed(() => isTelegramBotConfigured())

onMounted(async () => {
  try {
    const config = getTelegramConfig()
    if (config) {
      enabled.value = config.enabled
      chatId.value = config.chatId
    }
    
    // Показываем информацию о боте, если он настроен
    if (isBotConfigured.value) {
      try {
        const info = await getBotInfo()
        if (info.success) {
          botInfo.value = {
            username: info.username,
            firstName: info.firstName,
          }
        }
      } catch (error) {
        console.warn('⚠️ Не удалось получить информацию о боте:', error)
      }
    }
  } catch (error) {
    console.error('⚠️ Ошибка при инициализации Telegram настроек:', error)
  }
})

async function updateSettings() {
  await saveTelegramConfig({
    enabled: enabled.value,
    chatId: chatId.value || '',
  })
}

async function processTelegramInput() {
  if (!telegramInput.value.trim()) return
  
  testing.value = true
  testResult.value = null
  
  try {
    const input = telegramInput.value.trim()
    
    // Если это username (начинается с @ или без)
    if (input.startsWith('@') || (!input.startsWith('+') && !/^\d+$/.test(input))) {
      const username = input.startsWith('@') ? input.substring(1) : input
      
      // Отправляем сообщение пользователю через бота с инструкцией
      let result
      try {
        result = await sendSetupMessageToUser(username)
      } catch (error) {
        console.error('Ошибка при отправке сообщения:', error)
        result = { success: false, error: 'Не удалось отправить сообщение' }
      }
      
      if (result.success && result.botUsername) {
        testResult.value = {
          success: true,
          message: `✅ Сообщение отправлено! Откройте Telegram, найдите бота @${result.botUsername} и отправьте ему команду /start. Затем вернитесь сюда и введите ваш Chat ID (бот отправит его вам).`,
        }
        // Сохраняем username для дальнейшего использования
        telegramInput.value = `@${username}`
      } else {
        // Если не получилось отправить, показываем инструкцию
        const botUsername = botInfo.value?.username || result.botUsername || 'ваш_бот'
        testResult.value = {
          success: false,
          message: `Откройте Telegram, найдите бота @${botUsername} и отправьте ему команду /start. Бот отправит вам ваш Chat ID. Затем введите Chat ID здесь.`,
        }
      }
    } 
    // Если это номер телефона
    else if (input.startsWith('+') || /^\d{10,15}$/.test(input)) {
      const botUsername = botInfo.value?.username || 'ваш_бот'
      testResult.value = {
        success: false,
        message: `Откройте Telegram, найдите бота @${botUsername} и отправьте ему команду /start. Бот отправит вам ваш Chat ID. Затем введите Chat ID здесь.`,
      }
    }
    // Если это Chat ID (только цифры, длинное число)
    else if (/^\d{8,}$/.test(input)) {
      chatId.value = input
      await updateSettings()
      await testConnection()
    }
    else {
      testResult.value = {
        success: false,
        message: 'Введите username Telegram (например: @username или username) или Chat ID (число)',
      }
    }
  } catch (error) {
    testResult.value = {
      success: false,
      message: error instanceof Error ? error.message : 'Неизвестная ошибка',
    }
  } finally {
    testing.value = false
  }
}

async function testConnection() {
  if (!chatId.value) return
  
  testing.value = true
  testResult.value = null
  
  try {
    let result
    try {
      result = await testTelegramConnection(chatId.value)
    } catch (error) {
      console.error('Ошибка при проверке подключения:', error)
      result = { success: false, error: 'Не удалось проверить подключение' }
    }
    if (result.success) {
      testResult.value = {
        success: true,
        message: '✅ Тестовое сообщение отправлено! Проверьте Telegram.',
      }
      await updateSettings()
    } else {
      testResult.value = {
        success: false,
        message: result.error || 'Ошибка при отправке сообщения',
      }
    }
  } catch (error) {
    testResult.value = {
      success: false,
      message: error instanceof Error ? error.message : 'Неизвестная ошибка',
    }
  } finally {
    testing.value = false
  }
}

function disconnectTelegram() {
  chatId.value = ''
  telegramInput.value = ''
  enabled.value = false
  updateSettings()
}
</script>

<style scoped>
.telegram-settings {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 1.25rem 1rem;
  box-shadow: var(--shadow-sm);
  margin-top: 0;
}

.settings-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-top: 0.5rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.telegram-icon {
  font-size: 1.5rem;
}

.setting-item {
  margin-bottom: 1rem;
}

.setting-label {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.setting-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-top: 0.5rem;
  line-height: 1.5;
}

.checkbox {
  margin-right: 0.5rem;
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
}

.telegram-config {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.config-section {
  margin-bottom: 1.5rem;
}

.config-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.help-icon {
  font-size: 0.75rem;
  cursor: help;
  opacity: 0.6;
}

.config-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 0.875rem;
  font-family: 'Courier New', monospace;
  transition: border-color 0.2s;
}

.config-input:focus {
  outline: none;
  border-color: #4f46e5;
}

.config-hint {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.telegram-login-section {
  margin-top: 1rem;
}

.login-description {
  font-size: 0.875rem;
  color: var(--text-primary);
  margin-bottom: 1rem;
  line-height: 1.5;
}

.login-hint {
  margin-top: 1rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-align: center;
}

.alternative-input {
  margin-top: 1rem;
}

.input-hint {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.connected-section {
  margin-top: 1rem;
}

.connected-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #d1fae5;
  border-radius: 8px;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  color: #065f46;
}

.success-icon {
  font-size: 1.25rem;
}

.btn-disconnect {
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #ef4444;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-disconnect:hover {
  background: #fecaca;
}

.bot-not-configured {
  padding: 1rem;
  background: #fee2e2;
  border: 1px solid #ef4444;
  border-radius: 8px;
  color: #991b1b;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.btn-test {
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-test:hover:not(:disabled) {
  background: #4338ca;
}

.btn-test:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.bot-info {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #f0f9ff;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.bot-name {
  font-weight: 600;
  color: #1e40af;
}

.bot-username {
  color: #3b82f6;
}

.test-result {
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.test-result.success {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #10b981;
}

.test-result.error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #ef4444;
}

.result-icon {
  font-size: 1rem;
}

.instructions {
  margin-top: 2rem;
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 4px solid #4f46e5;
}

.instructions-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.instructions-list {
  margin: 0;
  padding-left: 1.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.8;
}

.instructions-list li {
  margin-bottom: 0.5rem;
}

.instructions-list code {
  background: #e5e7eb;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.8125rem;
}

.instructions-note {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #fef3c7;
  border-radius: 6px;
  font-size: 0.8125rem;
  color: #92400e;
  line-height: 1.5;
}
</style>

