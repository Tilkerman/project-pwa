<template>
  <div class="app-logo" :style="{ width: size, height: size }">
    <img
      :src="currentSrc"
      alt="Логотип"
      :style="{ width: size, height: size }"
      class="logo-img"
      loading="eager"
      decoding="async"
      @error="handleError"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import iconNew from '@/assets/icon-new.png'

withDefaults(defineProps<{
  size?: string
}>(), {
  size: '64px'
})

// iOS PWA иногда залипает на старых hashed-ассетах или не загружает большой PNG.
// Поэтому:
// - по умолчанию пробуем PNG (красивый логотип),
// - если не загрузился, переключаемся на стабильный /icon.svg в public.
const base = import.meta.env.BASE_URL || '/'
const iconSvg = `${base}icon.svg`

const currentSrc = ref<string>(iconNew)

function handleError() {
  // Fallback на SVG (в пределах BASE_URL)
  if (currentSrc.value !== iconSvg) currentSrc.value = iconSvg
}
</script>

<style scoped>
.app-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.logo-img {
  display: block !important;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  object-fit: contain;
  width: 100% !important;
  height: 100% !important;
  visibility: visible !important;
  opacity: 1 !important;
}
</style>
