<template>
  <div class="habit-form">
    <h2 class="form-title">{{ isEditing ? 'Редактировать привычку' : 'Новая привычка' }}</h2>
    
    <div class="form-group">
      <label for="habit-name">Название привычки</label>
      <input
        id="habit-name"
        v-model="formData.name"
        type="text"
        placeholder="Например: Бросить курить"
        class="form-input"
      />
    </div>

    <CharacterSelector v-model="formData.character" />

    <div class="form-group">
      <label>
        <input
          v-model="formData.notificationEnabled"
          type="checkbox"
          class="checkbox"
        />
        Включить напоминания
      </label>
    </div>

    <div v-if="formData.notificationEnabled" class="form-group">
      <label for="notification-time">Время напоминания</label>
      <input
        id="notification-time"
        v-model="formData.notificationTime"
        type="time"
        class="form-input"
      />
    </div>

    <div class="form-actions">
      <button type="button" class="btn btn-secondary" @click="$emit('cancel')">
        Отмена
      </button>
      <button
        type="submit"
        class="btn btn-primary"
        :disabled="!formData.name.trim()"
        @click="handleSubmit"
      >
        {{ isEditing ? 'Сохранить' : 'Создать' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Habit, CharacterType } from '@/types'
import CharacterSelector from './CharacterSelector.vue'

const props = defineProps<{
  habit?: Habit
}>()

const emit = defineEmits<{
  submit: [data: { name: string; character: CharacterType; notificationTime?: string; notificationEnabled: boolean }]
  cancel: []
}>()

const isEditing = computed(() => !!props.habit)

const formData = ref({
  name: props.habit?.name || '',
  character: (props.habit?.character || 'babushka') as CharacterType,
  notificationTime: props.habit?.notificationTime || '09:00',
  notificationEnabled: props.habit?.notificationEnabled || false
})

watch(() => props.habit, (newHabit) => {
  if (newHabit) {
    formData.value = {
      name: newHabit.name,
      character: newHabit.character,
      notificationTime: newHabit.notificationTime || '09:00',
      notificationEnabled: newHabit.notificationEnabled || false
    }
  }
}, { immediate: true })

function handleSubmit() {
  if (!formData.value.name.trim()) return

  emit('submit', {
    name: formData.value.name.trim(),
    character: formData.value.character,
    notificationTime: formData.value.notificationEnabled ? formData.value.notificationTime : undefined,
    notificationEnabled: formData.value.notificationEnabled
  })
}
</script>


<style scoped>
.habit-form {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #4f46e5;
}

.checkbox {
  margin-right: 0.5rem;
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #4f46e5;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #4338ca;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}
</style>

