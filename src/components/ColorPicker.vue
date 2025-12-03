<template>
  <div class="color-picker-modal" @click.self="$emit('close')">
    <div class="color-picker-content" @click.stop>
      <div class="color-picker-header">
        <h3>Выберите цвет</h3>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>
      
      <div class="color-picker-body">
        <!-- Большой селектор цвета (saturation/lightness) -->
        <div 
          class="color-saturation-area"
          :style="{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hue}, 100%, 50%))` }"
          @mousedown="startDragging"
          @touchstart="startDragging"
        >
          <div 
            class="color-selector"
            :style="{ 
              left: `${saturation * 100}%`, 
              top: `${(1 - lightness) * 100}%`,
              backgroundColor: currentColor
            }"
          ></div>
        </div>
        
        <!-- Ползунок оттенка (hue) -->
        <div class="hue-slider-container">
          <div 
            class="hue-slider"
            :style="{ background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)' }"
            @mousedown="startHueDragging"
            @touchstart="startHueDragging"
          >
            <div 
              class="hue-slider-handle"
              :style="{ left: `${(hue / 360) * 100}%` }"
            ></div>
          </div>
        </div>
        
        <!-- Поле ввода hex -->
        <div class="color-input-section">
          <div class="color-preview" :style="{ backgroundColor: currentColor }"></div>
          <input
            v-model="hexValue"
            type="text"
            class="hex-input"
            placeholder="#000000"
            @input="handleHexInput"
          />
          <button class="edit-btn" @click="showAdvanced = !showAdvanced" title="Дополнительные настройки">
            ✏️
          </button>
        </div>
      </div>
      
      <div class="color-picker-footer">
        <button class="btn btn-secondary" @click="$emit('close')">Отмена</button>
        <button class="btn btn-primary" @click="confirmColor">Применить</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'confirm': [value: string]
  'close': []
}>()

// HSL значения
const hue = ref(0)
const saturation = ref(1)
const lightness = ref(0.5)
const isDragging = ref(false)
const isHueDragging = ref(false)
const showAdvanced = ref(false)

// Конвертация hex в HSL
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }

  return { h: h * 360, s, l }
}

// Конвертация HSL в hex
function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs((h / 60) % 2 - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0

  if (h < 60) { r = c; g = x; b = 0 }
  else if (h < 120) { r = x; g = c; b = 0 }
  else if (h < 180) { r = 0; g = c; b = x }
  else if (h < 240) { r = 0; g = x; b = c }
  else if (h < 300) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }

  r = Math.round((r + m) * 255)
  g = Math.round((g + m) * 255)
  b = Math.round((b + m) * 255)

  return `#${[r, g, b].map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')}`
}

// Текущий цвет в hex
const currentColor = computed(() => {
  return hslToHex(hue.value, saturation.value, lightness.value)
})

const hexValue = computed({
  get: () => props.modelValue || '#000000',
  set: (value) => {
    if (/^#[0-9A-Fa-f]{6}$/i.test(value)) {
      const hsl = hexToHsl(value)
      hue.value = hsl.h
      saturation.value = hsl.s
      lightness.value = hsl.l
      emit('update:modelValue', value)
    }
  }
})

// Инициализация из prop
watch(() => props.modelValue, (newValue) => {
  if (newValue && /^#[0-9A-Fa-f]{6}$/i.test(newValue)) {
    const hsl = hexToHsl(newValue)
    hue.value = hsl.h
    saturation.value = hsl.s
    lightness.value = hsl.l
  }
}, { immediate: true })

function handleHexInput(event: Event) {
  const input = event.target as HTMLInputElement
  let value = input.value.trim()
  
  if (!value.startsWith('#')) {
    value = '#' + value
  }
  
  if (/^#[0-9A-Fa-f]{0,6}$/i.test(value)) {
    hexValue.value = value
  }
}

function startDragging(event: MouseEvent | TouchEvent) {
  isDragging.value = true
  updateSaturationLightness(event)
  
  const moveHandler = (e: MouseEvent | TouchEvent) => {
    if (isDragging.value) {
      updateSaturationLightness(e)
    }
  }
  
  const endHandler = () => {
    isDragging.value = false
    document.removeEventListener('mousemove', moveHandler as EventListener)
    document.removeEventListener('mouseup', endHandler)
    document.removeEventListener('touchmove', moveHandler as EventListener)
    document.removeEventListener('touchend', endHandler)
  }
  
  document.addEventListener('mousemove', moveHandler as EventListener)
  document.addEventListener('mouseup', endHandler)
  document.addEventListener('touchmove', moveHandler as EventListener)
  document.addEventListener('touchend', endHandler)
}

function updateSaturationLightness(event: MouseEvent | TouchEvent) {
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  
  let clientX: number
  let clientY: number
  
  if ('touches' in event) {
    clientX = event.touches[0].clientX
    clientY = event.touches[0].clientY
  } else {
    clientX = event.clientX
    clientY = event.clientY
  }
  
  const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
  const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
  
  saturation.value = x
  lightness.value = 1 - y
  
  emit('update:modelValue', currentColor.value)
}

function startHueDragging(event: MouseEvent | TouchEvent) {
  isHueDragging.value = true
  updateHue(event)
  
  const moveHandler = (e: MouseEvent | TouchEvent) => {
    if (isHueDragging.value) {
      updateHue(e)
    }
  }
  
  const endHandler = () => {
    isHueDragging.value = false
    document.removeEventListener('mousemove', moveHandler as EventListener)
    document.removeEventListener('mouseup', endHandler)
    document.addEventListener('touchmove', moveHandler as EventListener)
    document.addEventListener('touchend', endHandler)
  }
  
  document.addEventListener('mousemove', moveHandler as EventListener)
  document.addEventListener('mouseup', endHandler)
  document.addEventListener('touchmove', moveHandler as EventListener)
  document.addEventListener('touchend', endHandler)
}

function updateHue(event: MouseEvent | TouchEvent) {
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  
  let clientX: number
  
  if ('touches' in event) {
    clientX = event.touches[0].clientX
  } else {
    clientX = event.clientX
  }
  
  const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
  hue.value = x * 360
  
  emit('update:modelValue', currentColor.value)
}

function confirmColor() {
  emit('confirm', currentColor.value)
  emit('close')
}
</script>

<style scoped>
.color-picker-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 1rem;
}

.color-picker-content {
  background: white;
  border-radius: 16px;
  max-width: 400px;
  width: 100%;
  padding: 1.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.color-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.color-picker-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
}

.color-picker-body {
  margin-bottom: 1.5rem;
}

.color-saturation-area {
  width: 100%;
  height: 200px;
  position: relative;
  border-radius: 8px;
  cursor: crosshair;
  margin-bottom: 1rem;
  border: 1px solid #e5e7eb;
}

.color-selector {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 2px solid white;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

.hue-slider-container {
  margin-bottom: 1rem;
}

.hue-slider {
  width: 100%;
  height: 20px;
  position: relative;
  border-radius: 10px;
  cursor: pointer;
  border: 1px solid #e5e7eb;
}

.hue-slider-handle {
  position: absolute;
  width: 24px;
  height: 24px;
  border: 2px solid white;
  border-radius: 50%;
  transform: translate(-50%, -2px);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2);
  background: hsl(var(--hue, 0), 100%, 50%);
  pointer-events: none;
}

.color-input-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.color-preview {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 2px solid #e5e7eb;
  flex-shrink: 0;
}

.hex-input {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  font-family: monospace;
  text-transform: uppercase;
}

.hex-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.edit-btn {
  padding: 0.75rem;
  background: #f3f4f6;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.edit-btn:hover {
  background: #e5e7eb;
}

.color-picker-footer {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
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

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}
</style>

