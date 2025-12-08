<template>
  <div class="app-logo" :style="{ width: size, height: size }">
    <svg 
      :width="size" 
      :height="size" 
      viewBox="0 0 200 200" 
      xmlns="http://www.w3.org/2000/svg"
      class="logo-svg"
    >
      <!-- Фон - фиолетово-синий -->
      <rect width="200" height="200" rx="40" fill="#6366f1"/>
      
      <!-- Буква П -->
      <text 
        x="100" 
        y="140" 
        font-family="Arial, sans-serif" 
        font-size="120" 
        font-weight="bold" 
        fill="white" 
        text-anchor="middle" 
        dominant-baseline="central"
      >П</text>
    </svg>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  size?: string
}>(), {
  size: '64px'
})
</script>

<style scoped>
.app-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.logo-svg {
  display: block;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}
</style>
