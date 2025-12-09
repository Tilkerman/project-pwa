<template>
  <div class="app-logo" :style="{ width: size, height: size }">
    <img
      :src="iconPath"
      alt="Логотип"
      :style="{ width: size, height: size }"
      class="logo-img"
    />
  </div>
</template>

<script setup lang="ts">
import iconNew from '@/assets/icon-new.png'

withDefaults(defineProps<{
  size?: string
}>(), {
  size: '64px'
})

// Используем импорт из assets, чтобы исключить проблемы с путями public
const iconPath = iconNew
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
