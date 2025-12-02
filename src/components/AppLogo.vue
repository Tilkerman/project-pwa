<template>
  <div class="app-logo" :style="{ width: size, height: size }">
    <svg 
      :width="size" 
      :height="size" 
      viewBox="0 0 200 200" 
      xmlns="http://www.w3.org/2000/svg"
      class="logo-svg"
    >
      <defs>
        <!-- Красное свечение -->
        <filter id="redGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="2"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        <!-- Градиент для луны -->
        <linearGradient id="moonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#06b6d4;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#0891b2;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#0e7490;stop-opacity:1" />
        </linearGradient>
        
        <!-- Градиент для красного свечения -->
        <radialGradient id="redGlowGradient" cx="30%" cy="50%">
          <stop offset="0%" style="stop-color:#ef4444;stop-opacity:0.8" />
          <stop offset="50%" style="stop-color:#dc2626;stop-opacity:0.4" />
          <stop offset="100%" style="stop-color:#991b1b;stop-opacity:0" />
        </radialGradient>
      </defs>
      
      <!-- Красное свечение (фон) -->
      <g opacity="0.6">
        <!-- Левая сторона - прямоугольные полосы -->
        <rect x="20" y="60" width="8" height="30" fill="#ef4444" filter="url(#redGlow)" opacity="0.8"/>
        <rect x="30" y="55" width="6" height="40" fill="#dc2626" filter="url(#redGlow)" opacity="0.7"/>
        <rect x="38" y="70" width="5" height="25" fill="#ef4444" filter="url(#redGlow)" opacity="0.6"/>
        
        <!-- Правая сторона - мягкое свечение -->
        <ellipse cx="140" cy="150" rx="25" ry="15" fill="url(#redGlowGradient)"/>
      </g>
      
      <!-- Полумесяц (луна) -->
      <path d="M 100 50 
               Q 60 50 50 100
               Q 50 150 100 150
               Q 150 150 150 100
               Q 150 50 100 50
               Z
               M 100 50
               Q 80 50 70 100
               Q 80 150 100 150
               Z" 
            fill="url(#moonGradient)" 
            stroke="#0891b2" 
            stroke-width="1"/>
      
      <!-- Внутренняя часть луны (вырез) -->
      <path d="M 100 50
               Q 80 50 70 100
               Q 80 150 100 150
               Q 120 150 130 100
               Q 120 50 100 50
               Z" 
            fill="#0e7490" 
            opacity="0.3"/>
      
      <!-- Маятник внутри луны -->
      <g transform="translate(100, 100)">
        <!-- Линия маятника -->
        <line x1="0" y1="-30" x2="0" y2="20" stroke="#0e7490" stroke-width="2" opacity="0.8"/>
        
        <!-- Круглый груз маятника -->
        <circle cx="0" cy="20" r="12" fill="#06b6d4" stroke="#0e7490" stroke-width="1.5"/>
        
        <!-- Внутренний круг -->
        <circle cx="0" cy="20" r="6" fill="#0891b2" opacity="0.6"/>
        
        <!-- Стрелка (указывает на 2 часа) -->
        <line x1="0" y1="20" x2="4" y2="16" stroke="#0e7490" stroke-width="2" stroke-linecap="round"/>
      </g>
      
      <!-- Глитч-эффекты на поверхности луны -->
      <rect x="55" y="85" width="3" height="8" fill="#0e7490" opacity="0.5"/>
      <rect x="60" y="90" width="2" height="6" fill="#0e7490" opacity="0.4"/>
      <rect x="65" y="88" width="2.5" height="5" fill="#0e7490" opacity="0.5"/>
    </svg>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  size?: string
}>()

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

