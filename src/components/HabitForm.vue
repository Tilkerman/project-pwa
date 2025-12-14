<template>
  <div class="habit-form">
    <!-- Header с крестиком -->
    <header class="form-header">
      <h2 class="form-title">{{ isEditing ? t('habitForm.editHabit') : t('habitForm.newHabit') }}</h2>
      <button class="close-button" @click="handleCancel" :aria-label="t('habitForm.close')">
        <span class="close-icon">✕</span>
      </button>
    </header>

    <!-- Секция: Название привычки -->
    <div class="form-section">
      <label class="section-label">{{ t('habitForm.habitName') }}</label>
      <div class="name-with-icon-container">
        <button 
          type="button"
          class="icon-select-button" 
          @click.prevent="showIconPicker = !showIconPicker"
          :aria-label="t('habitForm.selectIcon') + ': ' + (formData.icon || '🚫')"
        >
          <span class="icon-display">{{ formData.icon || '🚫' }}</span>
          <span class="icon-dropdown-arrow">▼</span>
        </button>
        <div class="icon-separator"></div>
        <input
          id="habit-name"
          v-model="formData.name"
          type="text"
          :placeholder="t('habitForm.namePlaceholder')"
          class="ios-input name-input-with-icon"
        />
      </div>
      <div v-if="showIconPicker" class="icon-picker">
        <div
          v-for="icon in projectIcons"
          :key="icon"
          class="icon-option"
          :class="{ active: formData.icon === icon }"
          @click="selectIcon(icon)"
        >
          {{ icon }}
        </div>
      </div>
    </div>


    <!-- Секция: Оповещения -->
    <div class="form-section">
      <div class="section-label-row">
        <label class="section-label">{{ t('habitForm.notifications') }}</label>
        <label class="ios-toggle">
          <input
            v-model="formData.notificationEnabled"
            type="checkbox"
            @click="handleNotificationToggle"
          >
          <span class="ios-toggle-slider"></span>
        </label>
      </div>
    </div>

    <!-- Модальное окно для выбора времени оповещения -->
    <div v-if="showTimePicker" class="time-picker-modal" @click.self="closeTimePicker">
      <div class="time-picker-content" @click.stop>
        <!-- Header -->
        <div class="time-picker-header">
          <button class="back-btn" @click="cancelTimePicker" :aria-label="t('habitForm.back')">
            <span class="back-icon">←</span>
          </button>
          <h2 class="time-picker-header-title">{{ selectedCharacterName }}</h2>
          <button class="close-btn" @click="closeTimePicker" :aria-label="t('habitForm.close')">
            <span class="close-icon">✕</span>
          </button>
        </div>
        
        <div class="time-picker-body">
          <!-- Секция: Кто напоминает -->
          <div class="notification-section">
            <label class="section-label">{{ t('habitForm.whoReminds') }}</label>
            <div class="character-dropdown">
              <button class="ios-dropdown-button" @click.prevent="showCharacterDropdown = !showCharacterDropdown">
                <span>{{ selectedCharacterName }}</span>
                <span class="dropdown-arrow">›</span>
              </button>
              <div v-if="showCharacterDropdown" class="dropdown-list">
                <div
                  v-for="char in availableCharacters"
                  :key="char.id"
                  class="dropdown-item"
                  :class="{ active: formData.character === char.id }"
                  @click="selectCharacter(char.id)"
                >
                  {{ t(`habitForm.characters.${char.id}`) }}
                  <span v-if="formData.character === char.id" class="checkmark">✓</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Секция: Время напоминания -->
          <div class="notification-section">
            <label class="section-label">{{ t('habitForm.reminderTime') }}</label>
            <input
              v-model="formData.notificationTime"
              type="time"
              class="time-input-compact"
            />
          </div>
          
          <!-- Секция: Текст напоминания -->
          <div class="notification-section">
            <label class="section-label">{{ t('habitForm.reminderText') }}</label>
            <textarea
              v-model="formData.customNotificationMessage"
              class="message-textarea"
              :placeholder="t('habitForm.reminderTextPlaceholder')"
              rows="3"
            ></textarea>
            <div class="default-text-divider">{{ t('habitForm.or') }}</div>
            <button 
              class="btn-use-default-text" 
              @click="useDefaultMessage"
              type="button"
            >
              {{ t('habitForm.useDefaultText') }}
            </button>
          </div>
          
          <!-- Секция: Telegram уведомления -->
          <div class="notification-section">
            <label class="section-label">{{ t('habitForm.telegramNotifications') }}</label>
            <p class="telegram-subtitle">{{ t('habitForm.telegramSubtitle') }}</p>
            <input
              v-model="iosContactInfo"
              type="text"
              class="telegram-input"
              :placeholder="t('habitForm.telegramPlaceholder')"
              @input="saveIOSContactInfo"
            />
            <button 
              class="btn-connect-telegram" 
              @click="testNotification"
              type="button"
            >
              {{ t('habitForm.connectTelegram') }}
            </button>
          </div>
        </div>
        
        <div class="time-picker-actions">
          <button class="btn btn-secondary" @click="cancelTimePicker">{{ t('habitForm.cancel') }}</button>
          <button class="btn btn-primary" @click="confirmTimePicker">{{ t('habitForm.save') }}</button>
        </div>
      </div>
    </div>

    <!-- Секция: Дополнительная мотивация -->
    <div class="form-section">
      <div class="section-label-row">
        <label class="section-label">{{ t('habitForm.additionalMotivation') }}</label>
        <label class="ios-toggle">
          <input
            v-model="formData.additionalMotivation"
            type="checkbox"
          >
          <span class="ios-toggle-slider"></span>
        </label>
      </div>
    </div>


    <!-- Секция: Цвет проекта -->
    <div class="form-section">
      <div class="section-label-row">
        <label class="section-label">{{ t('habitForm.color') }}</label>
        <div class="color-picker">
          <!-- Кнопка выбора своего цвета -->
          <div
            class="color-option color-option-custom"
            :class="{ active: formData.color === 'custom' }"
            @click="openColorPicker"
            :style="{ 
              background: formData.color === 'custom' && formData.customColor 
                ? formData.customColor 
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)'
            }"
            :title="t('habitForm.selectCustomColor')"
          >
            <span class="custom-color-icon">+</span>
          </div>
          <!-- Предустановленные цвета -->
          <div
            v-for="color in ['blue', 'red', 'green', 'purple', 'pink']"
            :key="color"
            class="color-option"
            :class="{ active: formData.color === color }"
            :style="{ backgroundColor: projectColors[color].bg }"
            @click="selectColor(color)"
          ></div>
        </div>
      </div>
      
      <!-- Полноценный Color Picker -->
      <ColorPicker
        v-if="showColorPickerModal"
        v-model="formData.customColor"
        @confirm="handleColorConfirm"
        @close="showColorPickerModal = false"
      />
    </div>

    <!-- Кнопки действий -->
    <div class="form-actions">
      <button
        type="button"
        class="btn-primary-ios"
        :disabled="!formData.name.trim()"
        @click="handleSubmit"
      >
        {{ t('habitForm.save') }}
      </button>
      <button
        v-if="isEditing"
        type="button"
        class="btn-delete-text"
        @click.stop="showDeleteConfirm = true"
      >
        {{ t('habitForm.deleteHabit') }}
      </button>
    </div>

    <!-- Модальное окно подтверждения удаления -->
    <div v-if="showDeleteConfirm" class="delete-confirm-modal" @click.self="showDeleteConfirm = false">
      <div class="delete-confirm-content" @click.stop>
        <h3 class="delete-confirm-title">{{ t('habitForm.deleteConfirmTitle') }}</h3>
        <p class="delete-confirm-text">
          {{ t('habitForm.deleteConfirmText') }}
        </p>
        <div class="delete-confirm-actions">
          <button class="btn btn-secondary" @click="showDeleteConfirm = false">
            {{ t('habitForm.cancel') }}
          </button>
          <button class="btn btn-danger" @click="handleDelete">
            {{ t('habitForm.delete') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { Habit, CharacterType, ProjectColor } from '@/types'
import { characters } from '@/utils/characters'
import { projectColors, availableColors, projectIcons } from '@/utils/projectColors'
import { useI18n } from '@/composables/useI18n'
import ColorPicker from './ColorPicker.vue'

const props = defineProps<{
  habit?: Habit
}>()

const emit = defineEmits<{
  submit: [data: {
    name: string
    character: CharacterType
    notificationTime?: string
    notificationEnabled: boolean
    customNotificationMessage?: string
    color?: ProjectColor
    customColor?: string
    icon?: string
    additionalMotivation?: boolean
  }]
  cancel: []
  delete: []
}>()

const isEditing = computed(() => {
  const hasHabit = !!props.habit
  console.log('HabitForm isEditing check:', { hasHabit, habit: props.habit })
  return hasHabit
})

const formData = ref({
  name: props.habit?.name || '',
  character: (props.habit?.character || 'gopnik') as CharacterType,
  notificationTime: props.habit?.notificationTime || '09:00',
  notificationEnabled: props.habit?.notificationEnabled || false,
  customNotificationMessage: props.habit?.customNotificationMessage || '',
  color: (props.habit?.color || 'blue') as ProjectColor,
  customColor: props.habit?.customColor || '#3b82f6',
  icon: props.habit?.icon || '🚫',
  additionalMotivation: props.habit?.additionalMotivation !== undefined ? props.habit.additionalMotivation : true
})

const showCharacterDropdown = ref(false)
const showIconPicker = ref(false)
const showTimePicker = ref(false)
const showCustomColorPicker = ref(false)
const showColorPickerModal = ref(false)
const pendingNotificationEnabled = ref(false)
const showDeleteConfirm = ref(false)
const iosContactInfo = ref('')

// Определение iOS устройства
const isIOSDevice = computed(() => {
  try {
    if (typeof navigator === 'undefined') return false
    const ua = navigator.userAgent
    const isIOS = /iPad|iPhone|iPod/.test(ua) || 
                  (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1)
    // Отладочная информация
    console.log('🔍 iOS Detection:', {
      userAgent: ua,
      platform: navigator.platform,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      isIOS: isIOS
    })
    return isIOS
  } catch (error) {
    console.warn('⚠️ Ошибка при определении iOS устройства:', error)
    return false
  }
})

// Загружаем сохраненный контакт iOS пользователя
onMounted(() => {
  const savedContact = localStorage.getItem('ios_telegram_contact')
  if (savedContact) {
    iosContactInfo.value = savedContact
  }
  
  // Если редактируем привычку с включенными оповещениями, загружаем контакт
  if (props.habit?.notificationEnabled) {
    const savedContactForHabit = localStorage.getItem('ios_telegram_contact')
    if (savedContactForHabit) {
      iosContactInfo.value = savedContactForHabit
    }
  }
})

// Сохранение контакта iOS пользователя
function saveIOSContactInfo() {
  if (iosContactInfo.value.trim()) {
    localStorage.setItem('ios_telegram_contact', iosContactInfo.value.trim())
  }
}

const { t, locale: currentLocale } = useI18n()

const availableCharacters = computed(() => Object.values(characters))

const selectedCharacterName = computed(() => {
  const characterKey = formData.value.character
  return t(`habitForm.characters.${characterKey}`).toUpperCase()
})

const selectedCharacterIcon = computed(() => {
  return characters[formData.value.character].icon
})

const selectedCharacterMessage = computed(() => {
  const character = characters[formData.value.character]
  return character.phrases.daily[0] || 'Не забывай о своей цели!'
})

watch(() => props.habit, (newHabit) => {
  if (newHabit) {
    formData.value = {
      name: newHabit.name,
      character: newHabit.character,
      notificationTime: newHabit.notificationTime || '09:00',
      notificationEnabled: newHabit.notificationEnabled || false,
      customNotificationMessage: newHabit.customNotificationMessage || '',
      color: newHabit.color || 'blue',
      customColor: newHabit.customColor || '#3b82f6',
      icon: newHabit.icon || '🚫',
      additionalMotivation: newHabit.additionalMotivation !== undefined ? newHabit.additionalMotivation : true
    }
    if (newHabit.color === 'custom') {
      showCustomColorPicker.value = true
    }
  }
}, { immediate: true })

function selectCharacter(characterId: CharacterType) {
  formData.value.character = characterId
  showCharacterDropdown.value = false
}

function selectColor(color: ProjectColor) {
  formData.value.color = color
  if (color !== 'custom') {
    showCustomColorPicker.value = false
  }
}

function selectCustomColor() {
  formData.value.color = 'custom'
}

function openColorPicker() {
  console.log('🎨 openColorPicker called')
  if (!formData.value.customColor) {
    formData.value.customColor = '#3b82f6'
  }
  showColorPickerModal.value = true
  console.log('✅ showColorPickerModal установлен в:', showColorPickerModal.value)
  console.log('📋 Текущий цвет:', formData.value.customColor)
}

function handleColorConfirm(color: string) {
  formData.value.customColor = color
  formData.value.color = 'custom'
  showColorPickerModal.value = false
}

function validateCustomColor(event: Event) {
  const input = event.target as HTMLInputElement
  const value = input.value.trim()
  // Проверяем формат hex цвета
  if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
    formData.value.customColor = value
    formData.value.color = 'custom'
  } else if (value === '') {
    // Если поле пустое, сбрасываем на стандартный цвет
    formData.value.color = 'blue'
    showCustomColorPicker.value = false
  }
}

function selectIcon(icon: string) {
  formData.value.icon = icon
  showIconPicker.value = false
}

async function handleNotificationToggle(event: Event) {
  const target = event.target as HTMLInputElement
  const willBeEnabled = target.checked
  const wasEnabled = formData.value.notificationEnabled
  
  if (willBeEnabled && !wasEnabled) {
    // Если включаем оповещения (были выключены), запрашиваем разрешение
    event.preventDefault()
    
    // Импортируем функцию запроса разрешения
    const { requestNotificationPermission } = await import('@/utils/notifications')
    const hasPermission = await requestNotificationPermission()
    
    if (!hasPermission) {
      alert(t('errors.notificationPermissionRequired'))
      return
    }
    
    // Если разрешение получено, показываем модалку выбора времени
    pendingNotificationEnabled.value = true
    showTimePicker.value = true
  } else if (!willBeEnabled && wasEnabled) {
    // Если выключаем, просто отключаем
    formData.value.notificationEnabled = false
  }
  // Если уже включены и кликаем снова - ничего не делаем (можно будет добавить редактирование времени)
}

function confirmTimePicker() {
  // Сохраняем контакт, если он введен (для всех устройств, не только iOS)
  if (iosContactInfo.value.trim()) {
    saveIOSContactInfo()
  }
  
  if (formData.value.notificationTime) {
    // Если текст не заполнен, используем текст по умолчанию от персонажа
    if (!formData.value.customNotificationMessage?.trim()) {
      formData.value.customNotificationMessage = selectedCharacterMessage.value
    }
    formData.value.notificationEnabled = true
    showTimePicker.value = false
    pendingNotificationEnabled.value = false
  } else {
    // Если время не выбрано, все равно закрываем модалку
    showTimePicker.value = false
    pendingNotificationEnabled.value = false
  }
}

function useDefaultMessage() {
  formData.value.customNotificationMessage = selectedCharacterMessage.value
}

async function testNotification() {
  const { testNotification: testNotif } = await import('@/utils/notifications')
  testNotif()
}

function cancelTimePicker() {
  // Отменяем включение оповещений
  formData.value.notificationEnabled = false
  showTimePicker.value = false
  pendingNotificationEnabled.value = false
}

function closeTimePicker() {
  // Если закрыли модалку без сохранения, отменяем включение
  if (pendingNotificationEnabled.value) {
    formData.value.notificationEnabled = false
    pendingNotificationEnabled.value = false
  }
  showTimePicker.value = false
}

function handleSubmit(event?: Event) {
  console.log('🔵 handleSubmit вызван', { event, name: formData.value.name, showTimePicker: showTimePicker.value })
  
  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }
  
  // Сохраняем контакт, если он введен (для всех устройств)
  if (iosContactInfo.value.trim()) {
    saveIOSContactInfo()
  }
  
  if (!formData.value.name.trim()) {
    console.warn('⚠️ Habit name is empty')
    alert(t('errors.enterHabitName'))
    return
  }

  // Если модальное окно оповещений открыто, закрываем его перед сохранением
  if (showTimePicker.value) {
    console.log('⚠️ Модальное окно открыто, закрываем его перед сохранением')
    showTimePicker.value = false
    pendingNotificationEnabled.value = false
    // Подтверждаем настройки оповещений, если они были включены
    if (pendingNotificationEnabled.value || formData.value.notificationEnabled) {
      if (formData.value.notificationTime) {
        formData.value.notificationEnabled = true
      }
    }
  }

  const submitData = {
    name: formData.value.name.trim(),
    character: formData.value.character,
    notificationTime: formData.value.notificationEnabled ? formData.value.notificationTime : undefined,
    notificationEnabled: formData.value.notificationEnabled,
    customNotificationMessage: formData.value.customNotificationMessage?.trim() || undefined,
    color: formData.value.color,
    customColor: formData.value.color === 'custom' ? formData.value.customColor : undefined,
    icon: formData.value.icon,
    additionalMotivation: formData.value.additionalMotivation
  }

  console.log('✅ Emitting submit event with data:', submitData)
  emit('submit', submitData)
}

function handleDelete() {
  showDeleteConfirm.value = false
  emit('delete')
}

function handleCancel() {
  emit('cancel')
}
</script>

<style scoped>
.habit-form {
  background: #ffffff;
  min-height: 100vh;
  padding: 0;
  display: flex;
  flex-direction: column;
}

/* Header с крестиком */
.form-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  position: sticky;
  top: 0;
  background: #ffffff;
  z-index: 10;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.1);
}

.form-title {
  font-size: 17px;
  font-weight: 600;
  color: #000000;
  margin: 0;
  text-align: center;
  flex: 1;
}

.close-button {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.close-icon {
  font-size: 20px;
  font-weight: 300;
  color: #007AFF;
  line-height: 1;
}

/* Секции формы */
.form-section {
  padding: 16px 20px 0;
  margin-bottom: 0;
}

.form-section:last-of-type {
  padding-bottom: 16px;
}

.section-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #8E8E93;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-bottom: 0;
  flex: 1;
}

.section-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0;
}

/* iOS стиль input */
.ios-input {
  width: 100%;
  padding: 12px;
  border: 1.5px solid rgba(0, 0, 0, 0.12);
  border-radius: 12px;
  font-size: 16px;
  line-height: 20px;
  transition: border-color 0.2s;
  background: white;
  color: #000000;
  box-sizing: border-box;
  -webkit-appearance: none;
  appearance: none;
}

.ios-input::placeholder {
  color: #999999;
}

.ios-input:focus {
  outline: none;
  border-color: #007AFF;
}

/* Контейнер для названия с иконкой */
.name-with-icon-container {
  display: flex;
  align-items: center;
  gap: 0;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  background: white;
  overflow: hidden;
  transition: border-color 0.2s;
}

.name-with-icon-container:focus-within {
  border-color: #007AFF;
  border-width: 1.5px;
}

.icon-select-button {
  flex-shrink: 0;
  width: 64px;
  height: 48px;
  padding: 0 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: background-color 0.2s;
  -webkit-appearance: none;
  appearance: none;
}

.icon-select-button:hover {
  background-color: rgba(0, 0, 0, 0.03);
}

.icon-select-button:active {
  background-color: rgba(0, 0, 0, 0.05);
}

.icon-display {
  font-size: 24px;
  line-height: 1;
  display: block;
}

.icon-dropdown-arrow {
  font-size: 12px;
  color: #007AFF;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 400;
  flex-shrink: 0;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.icon-select-button:hover .icon-dropdown-arrow {
  opacity: 1;
}

.icon-separator {
  width: 1px;
  height: 32px;
  background: rgba(0, 0, 0, 0.12);
  flex-shrink: 0;
}

.name-input-with-icon {
  flex: 1;
  border: none;
  border-radius: 0;
  padding-left: 12px;
  padding-right: 12px;
  font-size: 17px;
}

.name-input-with-icon:focus {
  border-color: transparent;
}

.character-dropdown {
  position: relative;
}

.ios-dropdown-button {
  width: 100%;
  padding: 12px;
  border: 1.5px solid rgba(0, 0, 0, 0.12);
  border-radius: 12px;
  background: white;
  color: #000000;
  font-size: 16px;
  line-height: 20px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-sizing: border-box;
  -webkit-appearance: none;
  appearance: none;
  transition: border-color 0.2s;
}

.ios-dropdown-button:focus {
  outline: none;
  border-color: #007AFF;
}

.dropdown-arrow {
  font-size: 18px;
  color: #C7C7CC;
  font-weight: 300;
}

.dropdown-list {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  z-index: 2100;
  max-height: 300px;
  overflow-y: auto;
  margin-top: 4px;
}

.dropdown-item {
  padding: 12px 16px;
  cursor: pointer;
  color: #000000;
  font-size: 16px;
  transition: background-color 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover {
  background-color: #f5f5f5;
}

.dropdown-item.active {
  background-color: #E3F2FD;
  color: #007AFF;
  font-weight: 500;
}

.checkmark {
  color: #007AFF;
  font-size: 18px;
  font-weight: 600;
}

.ios-toggle-row {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 8px 0;
}

.toggle-label-text {
  font-size: 17px;
  color: #000000;
  font-weight: 400;
}

.ios-toggle {
  position: relative;
  display: inline-block;
  width: 51px;
  height: 31px;
  flex-shrink: 0;
}

.ios-toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.ios-toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #E5E5EA;
  transition: 0.3s;
  border-radius: 31px;
}

.ios-toggle-slider:before {
  position: absolute;
  content: "";
  height: 27px;
  width: 27px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.ios-toggle input:checked + .ios-toggle-slider {
  background-color: #34C759;
}

.ios-toggle input:checked + .ios-toggle-slider:before {
  transform: translateX(20px);
}


.icon-picker {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  margin-top: 12px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 12px;
  max-height: 250px;
  overflow-y: auto;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.icon-option {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  background: white;
  border: 1.5px solid rgba(0, 0, 0, 0.12);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-option:hover {
  border-color: #007AFF;
  transform: scale(1.05);
}

.icon-option.active {
  border-color: #007AFF;
  background: #E3F2FD;
}

.color-picker {
  display: flex;
  gap: 10px;
  margin-top: 0;
  flex-wrap: wrap;
  padding: 0;
  align-items: center;
}

.color-option {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  border: 3px solid transparent;
  transition: all 0.2s;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.color-option:hover {
  transform: scale(1.05);
}

.color-option.active {
  border-color: #007AFF;
}

.color-option-custom {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%);
}

.custom-color-icon {
  font-size: 20px;
  font-weight: 300;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  line-height: 1;
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-top: auto;
  padding: 16px 20px 20px;
  background: #ffffff;
  position: sticky;
  bottom: 0;
}

.btn-primary-ios {
  width: 100%;
  padding: 16px 20px;
  background: #C7C7CC;
  color: #FFFFFF;
  border: none;
  border-radius: 12px;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 0;
}

.btn-primary-ios:hover:not(:disabled) {
  background: #0051D5;
}

.btn-primary-ios:active:not(:disabled) {
  background: #0040A8;
  transform: scale(0.98);
}

.btn-primary-ios:disabled {
  opacity: 1;
  cursor: not-allowed;
  background: #C7C7CC;
  color: #FFFFFF;
}

.btn-primary-ios:not(:disabled) {
  background: #007AFF;
  color: #FFFFFF;
}

.btn-delete-text {
  width: 100%;
  padding: 12px 20px;
  background: transparent;
  color: #FF3B30;
  border: none;
  font-size: 17px;
  font-weight: 400;
  cursor: pointer;
  transition: opacity 0.2s;
  text-align: center;
}

.btn-delete-text:hover {
  opacity: 0.7;
}

.btn-delete-text:active {
  opacity: 0.5;
}

.delete-confirm-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.delete-confirm-content {
  background: white;
  border-radius: 16px;
  max-width: 400px;
  width: 100%;
  padding: 2rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.delete-confirm-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  color: #1f2937;
}

.delete-confirm-text {
  font-size: 1rem;
  color: #6b7280;
  margin: 0 0 2rem 0;
  line-height: 1.5;
}

.delete-confirm-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn-secondary {
  padding: 0.75rem 1.5rem;
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-danger {
  padding: 0.75rem 1.5rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-danger:hover {
  background: #dc2626;
}

.btn-danger:active {
  transform: scale(0.95);
  background: #b91c1c;
}

.btn {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}


.time-picker-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
  animation: fadeIn 0.2s ease-out;
}

.time-picker-content {
  background: white;
  border-radius: 16px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  overflow-x: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease-out;
  display: flex;
  flex-direction: column;
  -webkit-overflow-scrolling: touch;
}

.time-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  position: relative;
}

.back-btn {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.back-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.back-icon {
  font-size: 24px;
  color: #007AFF;
  line-height: 1;
}

.time-picker-header-title {
  font-size: 18px;
  font-weight: 600;
  color: #000000;
  margin: 0;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.close-btn {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  transition: background-color 0.2s;
  margin-left: auto;
}

.close-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.close-icon {
  font-size: 20px;
  font-weight: 300;
  color: #007AFF;
  line-height: 1;
}

.time-picker-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.notification-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.notification-section .section-label {
  font-size: 15px;
  font-weight: 600;
  color: #6A6A6A;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-bottom: 0;
}

.time-input-compact {
  width: 100%;
  height: 48px;
  padding: 12px;
  border: 1.5px solid rgba(0, 0, 0, 0.12);
  border-radius: 12px;
  font-size: 16px;
  text-align: center;
  background: white;
  color: #000000;
  transition: border-color 0.2s;
  box-sizing: border-box;
  -webkit-appearance: none;
  appearance: none;
}

.time-input-compact:focus {
  outline: none;
  border-color: #007AFF;
}

.message-textarea {
  width: 100%;
  padding: 12px;
  border: 1.5px solid rgba(0, 0, 0, 0.12);
  border-radius: 12px;
  font-size: 16px;
  line-height: 20px;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  background: white;
  color: #000000;
  transition: border-color 0.2s;
  box-sizing: border-box;
  -webkit-appearance: none;
  appearance: none;
}

.message-textarea:focus {
  outline: none;
  border-color: #007AFF;
}

.message-textarea::placeholder {
  color: #999999;
}

.default-text-divider {
  text-align: center;
  font-size: 13px;
  color: #999999;
  margin: 12px 0;
}

.btn-use-default-text {
  background: transparent;
  border: none;
  color: #007AFF;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  padding: 8px 0;
  text-align: center;
  transition: opacity 0.2s;
}

.btn-use-default-text:hover {
  opacity: 0.7;
}

.telegram-subtitle {
  font-size: 15px;
  color: #6A6A6A;
  margin: 0 0 12px 0;
  line-height: 1.4;
}

.telegram-input {
  width: 100%;
  height: 48px;
  padding: 12px;
  border: 1.5px solid rgba(0, 0, 0, 0.12);
  border-radius: 12px;
  font-size: 16px;
  background: white;
  color: #000000;
  transition: border-color 0.2s;
  box-sizing: border-box;
  -webkit-appearance: none;
  appearance: none;
  margin-bottom: 12px;
}

.telegram-input:focus {
  outline: none;
  border-color: #007AFF;
}

.telegram-input::placeholder {
  color: #999999;
}

.btn-connect-telegram {
  width: 100%;
  height: 48px;
  padding: 12px;
  border: 1.5px solid rgba(0, 0, 0, 0.12);
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
  background: white;
  color: #007AFF;
  cursor: pointer;
  transition: all 0.2s;
  box-sizing: border-box;
}

.btn-connect-telegram:hover {
  background: #f5f5f5;
  border-color: #007AFF;
}

.time-picker-actions {
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.time-picker-actions .btn {
  flex: 1;
  height: 48px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
}

.time-picker-actions .btn-secondary {
  background: #f5f5f5;
  color: #000000;
  border: 1.5px solid rgba(0, 0, 0, 0.12);
}

.time-picker-actions .btn-secondary:hover {
  background: #e5e5e5;
}

.time-picker-actions .btn-primary {
  background: #007AFF;
  color: #ffffff;
  border: none;
}

.time-picker-actions .btn-primary:hover {
  background: #0051D5;
}

.ios-contact-section {
  margin-top: 1rem !important;
  margin-bottom: 1rem !important;
  padding: 1.5rem !important;
  background: #e0f2fe !important;
  border-radius: 8px !important;
  border: 3px solid #0ea5e9 !important;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.4) !important;
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  min-height: 150px !important;
}

.ios-icon {
  font-size: 1.25rem;
  margin-right: 0.5rem;
}

.form-hint {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #0369a1;
  line-height: 1.4;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Мобильные устройства */
@media (max-width: 768px) {
  .time-picker-content {
    max-height: 95vh;
    margin: 0.5rem;
  }
  
  .time-picker-body {
    padding: 1rem;
    gap: 1rem;
  }
  
  .ios-telegram-info {
    padding: 1rem !important;
    margin-top: 0 !important;
  }
  
  .test-notification-section {
    padding-top: 1rem !important;
  }
  
  .btn-test-notification {
    padding: 1rem 1.5rem !important;
    font-size: 1rem !important;
  }
}
</style>
