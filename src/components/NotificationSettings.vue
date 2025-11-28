<template>
  <div class="notification-settings">
    <h3 class="settings-title">Настройки уведомлений</h3>
    
    <div class="setting-item">
      <label class="setting-label">
        <input
          v-model="enabled"
          type="checkbox"
          class="checkbox"
          @change="updateSettings"
        />
        Включить уведомления
      </label>
    </div>

    <div v-if="enabled" class="setting-item">
      <label for="notification-time" class="setting-label">Время напоминания</label>
      <input
        id="notification-time"
        v-model="time"
        type="time"
        class="time-input"
        @change="updateSettings"
      />
    </div>

    <div v-if="!hasPermission" class="permission-warning">
      <p>Для работы уведомлений необходимо разрешение браузера.</p>
      <button class="btn btn-primary" @click="requestPermission">
        Запросить разрешение
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { requestNotificationPermission } from '@/utils/notifications'

const props = defineProps<{
  enabled: boolean
  time?: string
}>()

const emit = defineEmits<{
  'update:enabled': [value: boolean]
  'update:time': [value: string]
}>()

const enabled = ref(props.enabled)
const time = ref(props.time || '09:00')
const hasPermission = ref(false)

onMounted(async () => {
  hasPermission.value = 'Notification' in window && Notification.permission === 'granted'
})

watch(() => props.enabled, (newVal) => {
  enabled.value = newVal
})

watch(() => props.time, (newVal) => {
  if (newVal) time.value = newVal
})

async function requestPermission() {
  const granted = await requestNotificationPermission()
  hasPermission.value = granted
  if (granted) {
    enabled.value = true
    updateSettings()
  }
}

function updateSettings() {
  emit('update:enabled', enabled.value)
  emit('update:time', time.value)
}
</script>

<style scoped>
.notification-settings {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.settings-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.5rem;
}

.setting-item {
  margin-bottom: 1.5rem;
}

.setting-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.checkbox {
  margin-right: 0.5rem;
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
}

.time-input {
  width: 100%;
  max-width: 200px;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.time-input:focus {
  outline: none;
  border-color: #4f46e5;
}

.permission-warning {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #fef3c7;
  border-radius: 8px;
  border: 1px solid #fbbf24;
}

.permission-warning p {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  color: #92400e;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #4f46e5;
  color: white;
}

.btn-primary:hover {
  background: #4338ca;
}
</style>

