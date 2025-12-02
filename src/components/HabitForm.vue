<template>
  <div class="habit-form">
    <h2 class="form-title">{{ isEditing ? 'Название проекта' : 'Название проекта' }}</h2>
    
    <div class="form-group">
      <input
        id="habit-name"
        v-model="formData.name"
        type="text"
        placeholder="НЕ КУРИМ"
        class="form-input"
      />
    </div>

    <div class="form-group">
      <label class="form-label">Кто напоминает?</label>
      <div class="character-dropdown">
        <button class="dropdown-button" @click.prevent="showCharacterDropdown = !showCharacterDropdown">
          {{ selectedCharacterName }}
          <span class="dropdown-arrow">▼</span>
        </button>
        <div v-if="showCharacterDropdown" class="dropdown-list">
          <div
            v-for="char in availableCharacters"
            :key="char.id"
            class="dropdown-item"
            :class="{ active: formData.character === char.id }"
            @click="selectCharacter(char.id)"
          >
            {{ char.name }}
          </div>
        </div>
      </div>
    </div>

    <div class="form-group">
      <label class="toggle-label">
        <span>Оповещения</span>
        <label class="ios-toggle">
          <input
            v-model="formData.notificationEnabled"
            type="checkbox"
            @click="handleNotificationToggle"
          >
          <span class="ios-toggle-slider"></span>
        </label>
      </label>
    </div>

    <!-- Модальное окно для выбора времени оповещения -->
    <div v-if="showTimePicker" class="time-picker-modal" @click.self="closeTimePicker">
      <div class="time-picker-content" @click.stop>
        <div class="time-picker-header">
          <div class="character-preview">
            <div class="character-icon-large">{{ selectedCharacterIcon }}</div>
            <div class="character-name-text">{{ selectedCharacterName }}</div>
          </div>
          <button class="close-btn" @click="closeTimePicker">×</button>
        </div>
        <div class="time-picker-body">
          <h3 class="time-picker-title">Выберите время для напоминания</h3>
          <div class="time-input-container">
            <input
              v-model="formData.notificationTime"
              type="time"
              class="time-input"
            />
          </div>
          <div class="time-picker-message">
            {{ selectedCharacterMessage }}
          </div>
        </div>
        <div class="time-picker-actions">
          <button class="btn btn-secondary" @click="cancelTimePicker">Отмена</button>
          <button class="btn btn-primary" @click="confirmTimePicker">Сохранить</button>
        </div>
      </div>
    </div>

    <div class="form-group">
      <label class="toggle-label">
        <span>Доп. мотивация</span>
        <label class="ios-toggle">
          <input
            v-model="formData.additionalMotivation"
            type="checkbox"
          >
          <span class="ios-toggle-slider"></span>
        </label>
      </label>
    </div>

    <div class="form-group">
      <label class="form-label">Иконка проекта</label>
      <button class="btn-select-icon" @click.prevent="showIconPicker = !showIconPicker">
        Выбрать из библиотеки
      </button>
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

    <div class="form-group">
      <label class="form-label">Выберите цвет для проекта</label>
      <div class="color-picker">
        <div
          v-for="color in availableColors"
          :key="color"
          class="color-option"
          :class="{ active: formData.color === color }"
          :style="{ backgroundColor: projectColors[color].bg }"
          @click="selectColor(color)"
        ></div>
      </div>
    </div>

    <div class="form-actions">
      <button
        type="button"
        class="btn btn-primary"
        :disabled="!formData.name.trim()"
        @click="handleSubmit"
      >
        СОХРАНИТЬ
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Habit, CharacterType, ProjectColor } from '@/types'
import { characters } from '@/utils/characters'
import { projectColors, availableColors, projectIcons } from '@/utils/projectColors'

const props = defineProps<{
  habit?: Habit
}>()

const emit = defineEmits<{
  submit: [data: {
    name: string
    character: CharacterType
    notificationTime?: string
    notificationEnabled: boolean
    color?: ProjectColor
    icon?: string
    additionalMotivation?: boolean
  }]
  cancel: []
}>()

const isEditing = computed(() => !!props.habit)

const formData = ref({
  name: props.habit?.name || '',
  character: (props.habit?.character || 'gopnik') as CharacterType,
  notificationTime: props.habit?.notificationTime || '09:00',
  notificationEnabled: props.habit?.notificationEnabled || false,
  color: (props.habit?.color || 'blue') as ProjectColor,
  icon: props.habit?.icon || '🚫',
  additionalMotivation: props.habit?.additionalMotivation !== undefined ? props.habit.additionalMotivation : true
})

const showCharacterDropdown = ref(false)
const showIconPicker = ref(false)
const showTimePicker = ref(false)
const pendingNotificationEnabled = ref(false)

const availableCharacters = computed(() => Object.values(characters))

const selectedCharacterName = computed(() => {
  return characters[formData.value.character].name.toUpperCase()
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
      color: newHabit.color || 'blue',
      icon: newHabit.icon || '🚫',
      additionalMotivation: newHabit.additionalMotivation !== undefined ? newHabit.additionalMotivation : true
    }
  }
}, { immediate: true })

function selectCharacter(characterId: CharacterType) {
  formData.value.character = characterId
  showCharacterDropdown.value = false
}

function selectColor(color: ProjectColor) {
  formData.value.color = color
}

function selectIcon(icon: string) {
  formData.value.icon = icon
  showIconPicker.value = false
}

function handleNotificationToggle(event: Event) {
  const target = event.target as HTMLInputElement
  const willBeEnabled = target.checked
  const wasEnabled = formData.value.notificationEnabled
  
  if (willBeEnabled && !wasEnabled) {
    // Если включаем оповещения (были выключены), предотвращаем включение и показываем модалку
    event.preventDefault()
    pendingNotificationEnabled.value = true
    showTimePicker.value = true
  } else if (!willBeEnabled && wasEnabled) {
    // Если выключаем, просто отключаем
    formData.value.notificationEnabled = false
  }
  // Если уже включены и кликаем снова - ничего не делаем (можно будет добавить редактирование времени)
}

function confirmTimePicker() {
  if (formData.value.notificationTime) {
    formData.value.notificationEnabled = true
    showTimePicker.value = false
    pendingNotificationEnabled.value = false
  }
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
  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }
  
  if (!formData.value.name.trim()) {
    console.warn('Habit name is empty')
    return
  }

  const submitData = {
    name: formData.value.name.trim(),
    character: formData.value.character,
    notificationTime: formData.value.notificationEnabled ? formData.value.notificationTime : undefined,
    notificationEnabled: formData.value.notificationEnabled,
    color: formData.value.color,
    icon: formData.value.icon,
    additionalMotivation: formData.value.additionalMotivation
  }

  console.log('Emitting submit event with data:', submitData)
  emit('submit', submitData)
}
</script>

<style scoped>
.habit-form {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
  background: white;
  color: #1f2937;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.character-dropdown {
  position: relative;
}

.dropdown-button {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  color: #1f2937;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dropdown-arrow {
  font-size: 0.75rem;
  color: #6b7280;
}

.dropdown-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 0.25rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 10;
  max-height: 200px;
  overflow-y: auto;
}

.dropdown-item {
  padding: 0.75rem;
  cursor: pointer;
  color: #1f2937;
  transition: background-color 0.2s;
}

.dropdown-item:hover {
  background-color: #f9fafb;
}

.dropdown-item.active {
  background-color: #eef2ff;
  color: #3b82f6;
  font-weight: 600;
}

.toggle-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
}

.ios-toggle {
  position: relative;
  display: inline-block;
  width: 51px;
  height: 31px;
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
  background-color: #e5e7eb;
  transition: 0.3s;
  border-radius: 34px;
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
  background-color: #3b82f6;
}

.ios-toggle input:checked + .ios-toggle-slider:before {
  transform: translateX(20px);
}

.btn-select-icon {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  color: #1f2937;
  font-size: 1rem;
  cursor: pointer;
  transition: border-color 0.2s;
}

.btn-select-icon:hover {
  border-color: #3b82f6;
}

.icon-picker {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.icon-option {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-option:hover {
  border-color: #3b82f6;
  transform: scale(1.1);
}

.icon-option.active {
  border-color: #3b82f6;
  background: #eef2ff;
}

.color-picker {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.color-option {
  width: 40px;
  min-width: 40px;
  height: 40px;
  min-height: 40px;
  border-radius: 50%;
  cursor: pointer;
  border: 3px solid transparent;
  transition: all 0.2s;
  flex-shrink: 0;
  aspect-ratio: 1;
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.active {
  border-color: #1f2937;
  box-shadow: 0 0 0 3px rgba(31, 41, 55, 0.2);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 2rem;
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

.btn-primary {
  background: #e0f2fe;
  color: #0369a1;
}

.btn-primary:hover:not(:disabled) {
  background: #bae6fd;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  max-width: 400px;
  width: 100%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease-out;
}

.time-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.character-preview {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.character-icon-large {
  font-size: 3rem;
  line-height: 1;
}

.character-name-text {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #1f2937;
}

.time-picker-body {
  padding: 1.5rem;
  text-align: center;
}

.time-picker-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1.5rem 0;
}

.time-input-container {
  margin-bottom: 1.5rem;
}

.time-input {
  width: 100%;
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1.5rem;
  text-align: center;
  background: #f9fafb;
  color: #1f2937;
  transition: border-color 0.2s;
}

.time-input:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
}

.time-picker-message {
  padding: 1rem;
  background: #f0f9ff;
  border-left: 4px solid #3b82f6;
  border-radius: 8px;
  color: #1e40af;
  font-size: 0.875rem;
  font-style: italic;
  line-height: 1.5;
}

.time-picker-actions {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.time-picker-actions .btn {
  flex: 1;
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
</style>
