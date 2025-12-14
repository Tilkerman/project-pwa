<template>
  <div class="telegram-settings">
    <h3 class="settings-title">
      <span class="telegram-icon">📱</span>
      {{ t('telegram.title') }}
    </h3>
    
    <div class="setting-item">
      <label class="setting-label">
        <input
          v-model="enabled"
          type="checkbox"
          class="checkbox"
          @change="updateSettings"
        />
        {{ t('telegram.enable') }}
      </label>
      <p class="setting-description">
        {{ t('telegram.description') }}
      </p>
    </div>

    <div class="telegram-config">
      <div v-if="!isBotConfigured" class="bot-not-configured">
        <p>{{ t('telegram.notConfigured') }}</p>
      </div>

      <div v-else class="config-section">
        <div v-if="!chatId" class="telegram-login-section">
          <p class="login-description">
            {{ t('telegram.enterChatId') }}
          </p>
          <div class="alternative-input">
            <input
              id="telegram-username"
              v-model="telegramInput"
              type="text"
              class="config-input"
              :placeholder="t('telegram.chatIdPlaceholder')"
              @keyup.enter="processTelegramInput"
            />
            <button 
              v-if="telegramInput"
              class="btn-test"
              @click="processTelegramInput"
              :disabled="testing"
            >
              {{ testing ? t('telegram.checking') : t('telegram.connect') }}
            </button>
            <p class="input-hint">
              <strong>{{ t('telegram.howToGetChatId') }}</strong><br>
              <span v-html="t('telegram.howToGetChatIdSteps').replace(/\n/g, '<br>')"></span>
            </p>
          </div>
        </div>
        
        <div v-else class="connected-section">
          <div class="connected-info">
            <span class="success-icon">✅</span>
            <span>{{ t('telegram.connected', { chatId }) }}</span>
          </div>
          <div class="connected-buttons">
            <button 
              class="btn-test"
              @click="testConnection"
              :disabled="testing"
            >
              {{ testing ? t('telegram.checking') : t('telegram.sendTest') }}
            </button>
            <button 
              class="btn-disconnect"
              @click="disconnectTelegram"
            >
              {{ t('telegram.disconnect') }}
            </button>
          </div>
        </div>
        
        <!-- Кнопка теста видна только если бот настроен, но chatId еще нет -->
        <div v-if="isBotConfigured && !chatId" class="test-section">
          <button 
            class="btn-test"
            @click="testConnection"
            :disabled="testing"
          >
            {{ testing ? t('telegram.checking') : t('telegram.sendTest') }}
          </button>
          <p class="test-hint">
            {{ t('telegram.testHint') }}
          </p>
        </div>

        <div v-if="testResult" class="test-result" :class="testResult.success ? 'success' : 'error'">
          <span class="result-icon">{{ testResult.success ? '✅' : '❌' }}</span>
          <span>{{ testResult.message }}</span>
        </div>
      </div>

      <div v-if="isBotConfigured && !chatId" class="instructions">
        <h4 class="instructions-title">{{ t('telegram.instructions.title') }}</h4>
        <ol class="instructions-list">
          <li>
            {{ t('telegram.instructions.step1') }}
          </li>
          <li>
            {{ t('telegram.instructions.step2', { botUsername: botInfo?.username || 'your_bot' }) }}
          </li>
          <li>
            {{ t('telegram.instructions.step3') }}
          </li>
          <li>
            {{ t('telegram.instructions.step4') }}
          </li>
        </ol>
        <div class="instructions-note">
          {{ t('telegram.instructions.note') }}
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
import { useI18n } from '@/composables/useI18n'

const { t, locale } = useI18n()

const enabled = ref(false)
const chatId = ref('')
const telegramInput = ref('')
const testing = ref(false)
const testResult = ref<{ success: boolean; message: string } | null>(null)
const botInfo = ref<{ username?: string; firstName?: string } | null>(null)

const isBotConfigured = computed(() => isTelegramBotConfigured())

onMounted(async () => {
  try {
    // Сначала пытаемся автоматически сохранить Chat ID из Telegram Mini App
    try {
      const { autoSaveTelegramChatId } = await import('@/utils/telegram')
      autoSaveTelegramChatId()
    } catch (error) {
      console.warn('⚠️ Не удалось автоматически сохранить Chat ID:', error)
    }
    
    // Затем загружаем конфигурацию
    try {
      const config = getTelegramConfig()
      if (config) {
        enabled.value = config.enabled
        chatId.value = config.chatId
      } else {
        // Если конфигурации нет, но мы в Telegram Mini App, пытаемся получить Chat ID напрямую
        try {
          if (typeof window !== 'undefined') {
            const tg = (window as any).Telegram?.WebApp || (window as any).TelegramWebApp
            if (tg?.initDataUnsafe?.user?.id) {
              const telegramChatId = String(tg.initDataUnsafe.user.id)
              chatId.value = telegramChatId
              enabled.value = true
              // Сохраняем автоматически
              await saveTelegramConfig({
                chatId: telegramChatId,
                enabled: true,
              })
              console.log('✅ Chat ID автоматически сохранен из Telegram Mini App:', telegramChatId)
            }
          }
        } catch (error) {
          console.warn('⚠️ Не удалось получить Chat ID из Telegram Mini App:', error)
        }
      }
    } catch (error) {
      console.warn('⚠️ Ошибка при загрузке конфигурации Telegram:', error)
    }
    
    // Показываем информацию о боте, если он настроен
    if (isBotConfigured.value) {
      try {
        const info = await getBotInfo()
        if (info && info.success) {
          botInfo.value = {
            username: info.username,
            firstName: info.firstName,
          }
        }
      } catch (error) {
        console.warn('⚠️ Не удалось получить информацию о боте:', error)
        // Не показываем ошибку пользователю, просто логируем
      }
    }
  } catch (error) {
    console.error('⚠️ Ошибка при инициализации Telegram настроек:', error)
    // Не пробрасываем ошибку дальше, чтобы не показывать глобальное сообщение об ошибке
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
        result = { success: false, error: t('telegram.testError') }
      }
      
      if (result.success && result.botUsername) {
        testResult.value = {
          success: true,
          message: t('telegram.messageSent', { botUsername: result.botUsername }),
        }
        // Сохраняем username для дальнейшего использования
        telegramInput.value = `@${username}`
      } else {
        // Если не получилось отправить, показываем инструкцию
        const botUsername = botInfo.value?.username || result.botUsername || 'your_bot'
        testResult.value = {
          success: false,
          message: t('telegram.instructions.step2', { botUsername }) + '. ' + t('telegram.instructions.step3'),
        }
      }
    } 
    // Если это номер телефона
    else if (input.startsWith('+') || /^\d{10,15}$/.test(input)) {
      const botUsername = botInfo.value?.username || 'your_bot'
      testResult.value = {
        success: false,
        message: t('telegram.instructions.step2', { botUsername }) + '. ' + t('telegram.instructions.step3'),
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
        message: t('telegram.enterUsernameOrChatId'),
      }
    }
    } catch (error) {
      testResult.value = {
        success: false,
        message: error instanceof Error ? error.message : t('telegram.unknownError'),
      }
    } finally {
      testing.value = false
    }
  }

async function testConnection() {
  testing.value = true
  testResult.value = null
  
  try {
    // Пытаемся получить Chat ID из разных источников
    let testChatId: string | null = null
    
    // 1. Из сохраненной конфигурации
    if (chatId.value) {
      testChatId = chatId.value
    }
    // 2. Из Telegram Mini App напрямую (проверяем несколько способов)
    else if (typeof window !== 'undefined') {
      console.log('🔍 Пытаемся получить Chat ID из Telegram Mini App...')
      
      // Способ 1: через window.Telegram.WebApp
      const tg = (window as any).Telegram?.WebApp
      console.log('📱 Telegram.WebApp:', tg ? 'найден' : 'не найден')
      if (tg?.initDataUnsafe?.user?.id) {
        testChatId = String(tg.initDataUnsafe.user.id)
        console.log('✅ Chat ID получен из Telegram.WebApp:', testChatId)
      } else {
        console.log('⚠️ Telegram.WebApp.initDataUnsafe.user.id:', tg?.initDataUnsafe?.user?.id || 'не найден')
      }
      
      // Способ 2: через window.TelegramWebApp
      if (!testChatId) {
        const tgAlt = (window as any).TelegramWebApp
        console.log('📱 TelegramWebApp:', tgAlt ? 'найден' : 'не найден')
        if (tgAlt?.initDataUnsafe?.user?.id) {
          testChatId = String(tgAlt.initDataUnsafe.user.id)
          console.log('✅ Chat ID получен из TelegramWebApp:', testChatId)
        }
      }
      
      // Способ 3: через @twa-dev/sdk
      if (!testChatId) {
        try {
          const { initDataUnsafe } = await import('@twa-dev/sdk')
          console.log('📱 @twa-dev/sdk initDataUnsafe:', initDataUnsafe ? 'найден' : 'не найден')
          if (initDataUnsafe?.user?.id) {
            testChatId = String(initDataUnsafe.user.id)
            console.log('✅ Chat ID получен из @twa-dev/sdk:', testChatId)
          }
        } catch (error) {
          console.warn('⚠️ Не удалось импортировать @twa-dev/sdk:', error)
        }
      }
      
      // Способ 4: через функцию getTelegramUser
      if (!testChatId) {
        try {
          const { getTelegramUser } = await import('@/utils/telegramMiniApp')
          const user = getTelegramUser()
          if (user?.id) {
            testChatId = String(user.id)
            console.log('✅ Chat ID получен через getTelegramUser():', testChatId)
          }
        } catch (error) {
          console.warn('⚠️ Не удалось использовать getTelegramUser():', error)
        }
      }
      
      // Сохраняем автоматически, если нашли
      if (testChatId) {
        chatId.value = testChatId
        enabled.value = true
        await saveTelegramConfig({
          chatId: testChatId,
          enabled: true,
        })
        console.log('✅ Chat ID автоматически сохранен:', testChatId)
      } else {
        console.warn('❌ Chat ID не найден ни в одном источнике')
      }
    }
    // 3. Из конфигурации еще раз (на случай если обновилась)
    if (!testChatId) {
      const config = getTelegramConfig()
      if (config?.chatId) {
        testChatId = config.chatId
        chatId.value = testChatId
      }
    }
    
    if (!testChatId) {
      // Показываем более подробное сообщение с инструкцией
      const isInTelegram = typeof window !== 'undefined' && 
                          ((window as any).Telegram?.WebApp || (window as any).TelegramWebApp)
      
      if (isInTelegram) {
        testResult.value = {
          success: false,
          message: t('telegram.chatIdNotFound', { botUsername: botInfo.value?.username || 'your_bot' }),
        }
      } else {
        testResult.value = {
          success: false,
          message: t('telegram.chatIdNotFoundManual'),
        }
      }
      return
    }
    
    let result
    try {
      result = await testTelegramConnection(testChatId)
    } catch (error) {
      console.error('Ошибка при проверке подключения:', error)
      result = { success: false, error: t('telegram.testError') }
    }
    if (result.success) {
      testResult.value = {
        success: true,
        message: t('telegram.testSuccess'),
      }
      await updateSettings()
    } else {
      testResult.value = {
        success: false,
        message: result.error || t('telegram.testError'),
      }
    }
  } catch (error) {
    testResult.value = {
      success: false,
      message: error instanceof Error ? error.message : t('telegram.unknownError'),
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
  overflow: visible;
  min-height: auto;
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
  overflow: visible;
  min-height: auto;
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

.connected-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  margin-top: 0.5rem;
}

.btn-disconnect {
  padding: 0.75rem 1rem;
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #ef4444;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  width: 100%;
  margin: 0;
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
  padding: 0.75rem 1rem;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  width: 100%;
  margin: 0;
}

.connected-buttons .btn-test {
  margin: 0;
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

.test-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.test-hint {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
  line-height: 1.4;
}
</style>

