<template>
  <div class="home-view">
    <!-- Header с логотипом и иконкой настроек -->
    <header class="page-header">
      <div class="header-container">
        <div class="header-logo-container">
          <AppLogo size="40px" />
          <span class="app-name">{{ t('app.name') }}</span>
        </div>
        <div class="header-actions">
          <button
            class="lang-toggle"
            :aria-label="t('language.toggle')"
            @click="toggleLanguage"
          >
            <span class="lang-text">{{ currentLocale === 'ru' ? 'RU' : 'EN' }}</span>
          </button>
          <button
            class="theme-toggle"
            :aria-label="isDark ? t('theme.toggleToDay') : t('theme.toggleToNight')"
            @click="toggleTheme"
          >
            <span class="toggle-track" :class="{ 'is-dark': isDark }">
              <span class="toggle-thumb" :class="{ 'is-dark': isDark }">
                <span class="toggle-icon">{{ isDark ? '🌙' : '☀️' }}</span>
              </span>
            </span>
          </button>
          <button class="settings-btn" @click="goToSettings" :aria-label="t('settings.title')">
            <span class="settings-icon">⚙️</span>
          </button>
        </div>
      </div>
    </header>
    
    <!-- Заголовок H1 - показываем только если привычек меньше 3 -->
    <h1 v-if="!store.loading && store.habits.length < 3" class="main-title">{{ t('home.greeting') }}</h1>
    
    <!-- Подзаголовок - мотивационная фраза, показываем всегда -->
    <p 
      v-if="currentMotivationalQuote" 
      class="subtitle"
      :class="{ 'subtitle-no-title': store.habits.length >= 3 }"
    >{{ currentMotivationalQuote }}</p>
    <p 
      v-else 
      class="subtitle"
      :class="{ 'subtitle-no-title': store.habits.length >= 3 }"
    >{{ t('home.subtitle') }}</p>
    
    <div v-if="store.loading" class="loading">{{ t('home.loading') }}</div>

    <!-- Блок привычек -->
    <div v-else class="habits-section">
      <div v-if="store.habits.length > 0" class="habits-list">
        <div
          v-for="habit in store.habits"
          :key="habit.id"
          class="habit-card"
          :class="{ 'habit-completed': isHabitCompletedToday(habit) }"
          :style="getHabitCardStyle(habit)"
          @click="goToHabit(habit.id)"
        >
          <div class="habit-content">
            <div class="habit-left">
              <div class="habit-icon-large">{{ habit.icon || '🚫' }}</div>
              <div class="habit-info">
                <div class="habit-name-text">{{ habit.name }}</div>
              </div>
            </div>
            <div class="habit-right">
              <div class="habit-progress">{{ getHabitProgress(habit) }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Кнопка добавления привычки - показываем всегда -->
      <button class="btn-add-habit" @click="showForm = true">
        <span class="add-icon">+</span>
        <span class="add-text">{{ t('home.createHabit') }}</span>
      </button>
    </div>
    
    <!-- Модальное окно формы -->
    <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
      <div class="modal-content" @click.stop>
        <HabitForm
          @submit="handleSubmit"
          @cancel="closeForm"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onActivated, onBeforeUnmount, computed, watch, nextTick } from 'vue'
import { useRouter, onBeforeRouteEnter } from 'vue-router'
import HabitForm from '@/components/HabitForm.vue'
import AppLogo from '@/components/AppLogo.vue'
import { useHabitsStore } from '@/stores/habitsStore'
import { getProjectColorStyles } from '@/utils/projectColors'
import { getCurrentStreak } from '@/utils/characters'
import { useThemeStore } from '@/stores/themeStore'
import { useI18n } from '@/composables/useI18n'
import type { Habit } from '@/types'
import ruLocale from '@/locales/ru.json'
import enLocale from '@/locales/en.json'

const router = useRouter()
const store = useHabitsStore()
const themeStore = useThemeStore()
const { t, locale: currentLocale, toggleLanguage } = useI18n()
const showForm = ref(false)
const isDark = computed(() => themeStore.isDark)
const toggleTheme = () => themeStore.toggleTheme()

// Получаем мотивирующие фразы напрямую из локализации
const motivationalQuotes = computed(() => {
  try {
    // Загружаем напрямую из JSON файлов, а не через i18n
    const locale = currentLocale.value === 'ru' ? ruLocale : enLocale
    const quotes = locale.home?.motivationalQuotes || []
    
    console.log('📖 Загружены фразы из локализации:', quotes.length, 'язык:', currentLocale.value)
    if (!Array.isArray(quotes) || quotes.length === 0) {
      console.error('❌ Фразы не найдены или не являются массивом!', quotes)
      return []
    }
    return quotes
  } catch (error) {
    console.error('❌ Ошибка загрузки мотивирующих фраз:', error)
    return []
  }
})

// Текущая мотивирующая фраза - инициализируем сразу fallback
const currentMotivationalQuote = ref(t('home.subtitle'))

// Функция для получения следующей фразы в цикле
function getNextMotivationalQuote(forceUpdate = false) {
  if (motivationalQuotes.value.length === 0) {
    console.warn('⚠️ Мотивирующие фразы не загружены, используем fallback')
    return t('home.subtitle') // Fallback к старой фразе
  }
  
  try {
    const lastIndexKey = 'lastMotivationalQuoteIndex'
    const lastIndex = parseInt(localStorage.getItem(lastIndexKey) || '-1', 10)
    const nextIndex = (lastIndex + 1) % motivationalQuotes.value.length
    
    // Сохраняем индекс для следующего раза
    localStorage.setItem(lastIndexKey, nextIndex.toString())
    
    const quote = motivationalQuotes.value[nextIndex]
    console.log(`📝 Показываем фразу ${nextIndex + 1}/${motivationalQuotes.value.length}:`, quote.substring(0, 50) + '...')
    
    return quote
  } catch (error) {
    console.error('⚠️ Ошибка при получении мотивирующей фразы:', error)
    return t('home.subtitle')
  }
}

// Обновляем фразу при смене языка
watch(currentLocale, () => {
  console.log('🌐 Язык изменен, обновляем фразу')
  currentMotivationalQuote.value = getNextMotivationalQuote(true)
})

// Обновляем фразу при активации компонента (когда пользователь возвращается на страницу)
onActivated(() => {
  console.log('🔄 Компонент активирован, обновляем фразу')
  currentMotivationalQuote.value = getNextMotivationalQuote(true)
})

onMounted(async () => {
  try {
    console.log('🚀 Компонент монтирован, загружаем привычки и фразу')
    await store.loadHabits()
    
    // Ждем, пока computed обновится
    await nextTick()
    
    // Проверяем, что фразы загружены
    console.log('📚 Загружено фраз:', motivationalQuotes.value.length)
    if (motivationalQuotes.value.length === 0) {
      console.warn('⚠️ Массив фраз пуст! Проверяем локализацию...')
      // Пробуем загрузить напрямую
      try {
        const directQuotes = t('home.motivationalQuotes', { returnObjects: true })
        console.log('📖 Прямая загрузка:', Array.isArray(directQuotes) ? directQuotes.length : 'не массив')
      } catch (e) {
        console.error('❌ Ошибка прямой загрузки:', e)
      }
    }
    
    // Устанавливаем мотивирующую фразу при монтировании
    const quote = getNextMotivationalQuote(true)
    currentMotivationalQuote.value = quote
    console.log('✅ Фраза установлена:', quote.substring(0, 50) + '...')
  } catch (error) {
    console.error('❌ Ошибка при загрузке привычек:', error)
    currentMotivationalQuote.value = t('home.subtitle')
  }
})

function goToHabit(id: string) {
  router.push(`/habit/${id}`)
}

function goToSettings() {
  router.push('/settings')
}

// Получение прогресса привычки
function getHabitProgress(habit: Habit): string {
  const totalDays = habit.markedDays.length
  const streak = getCurrentStreak(habit)
  
  if (totalDays === 0) {
    return t('home.startToday')
  }
  
  if (streak > 0) {
    return `${streak} ${getDayWord(streak)} ${t('home.days.inRow')}`
  }
  
  return `${totalDays} ${getDayWord(totalDays)}`
}

// Склонение слова "день"
function getDayWord(count: number): string {
  if (currentLocale.value === 'en') {
    return count === 1 ? t('home.days.day') : t('home.days.days')
  }
  
  const lastDigit = count % 10
  const lastTwoDigits = count % 100
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return t('home.days.days')
  }
  
  if (lastDigit === 1) {
    return t('home.days.day')
  }
  
  if (lastDigit >= 2 && lastDigit <= 4) {
    return t('home.days.day2')
  }
  
  return t('home.days.days')
}

// Проверка, выполнена ли привычка сегодня
function isHabitCompletedToday(habit: Habit): boolean {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  return habit.markedDays.includes(todayStr)
}

// Стили для карточки привычки
function getHabitCardStyle(habit: Habit) {
  const colorStyles = getProjectColorStyles(habit.color || 'blue', habit.customColor)
  const isCompleted = isHabitCompletedToday(habit)
  
  if (isCompleted) {
    return {
      backgroundColor: '#f0fdf4', // светло-зеленый фон для выполненных
    }
  }
  
  // Преобразуем hex в rgba с прозрачностью
  const hex = colorStyles.bg.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  return {
    backgroundColor: `rgba(${r}, ${g}, ${b}, 0.08)`, // легкий фон цвета привычки
  }
}

async function handleSubmit(data: {
  name: string
  character: Habit['character']
  notificationTime?: string
  notificationEnabled: boolean
  customNotificationMessage?: string
  color?: Habit['color']
  customColor?: string
  icon?: string
  additionalMotivation?: boolean
}) {
  await store.createHabit(
    data.name,
    data.character,
    data.notificationTime,
    data.color || 'blue',
    data.icon,
    data.additionalMotivation !== undefined ? data.additionalMotivation : true,
    data.customNotificationMessage,
    data.customColor
  )
  closeForm()
}

function closeForm() {
  showForm.value = false
}
</script>

<style scoped>
.home-view {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 0 1rem 2rem;
  padding-top: 100px;
  min-height: 100vh;
  overflow-x: hidden;
  box-sizing: border-box;
}

/* Header с логотипом и иконкой настроек */
.page-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  width: 100%;
  background: var(--bg-secondary);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border-color);
  overflow-x: hidden;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 1rem;
  max-width: 600px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.header-logo-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.settings-btn {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.lang-toggle {
  border: none;
  padding: 0.375rem 0.75rem;
  background: var(--bg-hover);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  transition: background 0.2s ease;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lang-toggle:hover {
  background: var(--border-color);
}

.lang-text {
  font-size: 0.875rem;
  font-weight: 600;
  user-select: none;
}

.theme-toggle {
  border: none;
  padding: 0;
  background: transparent;
  cursor: pointer;
}

.toggle-track {
  width: 58px;
  height: 30px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  padding: 3px;
  background: var(--bg-hover);
  position: relative;
  transition: background 0.2s ease;
}

.toggle-track.is-dark {
  background: var(--primary-color);
}

.toggle-thumb {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--bg-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease, background 0.2s ease, color 0.2s ease;
  transform: translateX(0);
  color: var(--text-primary);
}

.toggle-thumb.is-dark {
  transform: translateX(28px);
  background: var(--bg-secondary);
}

.toggle-icon {
  font-size: 14px;
  line-height: 1;
}

.settings-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.dark .settings-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.settings-btn:active {
  background-color: rgba(0, 0, 0, 0.1);
}

.dark .settings-btn:active {
  background-color: rgba(255, 255, 255, 0.15);
}

.settings-icon {
  font-size: 24px;
  line-height: 1;
  color: #333;
  display: inline-block;
  user-select: none;
}

.dark .settings-icon {
  color: #e5e7eb;
}

/* Заголовок H1 - крупный, жирный, тёплый */
.main-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  text-align: center;
  margin: 0 0 0.5rem 0;
  line-height: 1.3;
  padding: 0 0.5rem;
}

/* Подзаголовок - маленький, серый */
.subtitle {
  font-size: 0.875rem;
  font-weight: 400;
  color: var(--text-secondary);
  text-align: center;
  margin: 0.5rem 0 2rem 0;
  line-height: 1.5;
  padding: 0 1rem;
  min-height: 1.5rem;
  display: block;
  visibility: visible;
  opacity: 1;
}

/* Дополнительный отступ сверху, когда заголовка H1 нет */
.subtitle-no-title {
  margin-top: 2.5rem;
  padding-top: 0.5rem;
}


.loading {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}

/* Секция привычек */
.habits-section {
  margin-bottom: 1.5rem;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
}

.habits-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

/* Карточка привычки - улучшенная */
.habit-card {
  display: flex;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--bg-secondary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.08);
  min-height: 72px;
  position: relative;
  border: 1px solid var(--border-color);
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.habit-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.12);
}

.habit-card:active {
  transform: translateY(0);
}

.habit-card.habit-completed {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-color: #86efac;
}

.dark .habit-card {
  background: var(--bg-secondary);
  border-color: var(--border-color);
}

.dark .habit-card.habit-completed {
  background: linear-gradient(135deg, #064e3b 0%, #065f46 100%);
  border-color: #10b981;
}

.habit-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex: 1;
  min-width: 0;
  width: 100%;
}

.habit-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  min-width: 0;
}

.habit-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
}

/* Иконка привычки - увеличенная и заметная */
.habit-icon-large {
  font-size: 2rem;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.dark .habit-icon-large {
  background: rgba(255, 255, 255, 0.1);
}

.habit-card.habit-completed .habit-icon-large {
  background: rgba(16, 185, 129, 0.15);
}

.dark .habit-card.habit-completed .habit-icon-large {
  background: rgba(16, 185, 129, 0.2);
}

.habit-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

/* Название привычки */
.habit-name-text {
  font-size: 1rem;
  color: var(--text-primary);
  font-weight: 600;
  line-height: 1.4;
  margin: 0;
}

/* Индикатор прогресса */
.habit-progress {
  font-size: 1rem;
  color: var(--text-primary);
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;
  padding: 0.25rem 0.75rem;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 8px;
}

.dark .habit-progress {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.habit-card.habit-completed .habit-progress {
  background: rgba(16, 185, 129, 0.15);
  color: #059669;
}

.dark .habit-card.habit-completed .habit-progress {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

/* Кнопка добавления привычки - переработанная */
.btn-add-habit {
  width: 100%;
  height: 56px;
  padding: 0;
  background: #E8F3FF;
  border: none;
  border-radius: 14px;
  font-size: 1rem;
  font-weight: 600;
  color: #2563eb;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.btn-add-habit:hover {
  background: #dbeafe;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.btn-add-habit:active {
  transform: translateY(0);
}

.add-icon {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1;
}

.add-text {
  font-size: 1rem;
  font-weight: 600;
}

/* Модальное окно */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  z-index: 1000;
  overflow-y: auto;
  overflow-x: hidden;
  width: 100%;
  max-width: 100%;
  animation: fadeIn 0.2s ease-out;
  touch-action: pan-y;
}

.modal-content {
  background: #ffffff;
  width: 100%;
  max-width: 100%;
  min-height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  animation: fadeIn 0.3s ease-out;
  display: flex;
  flex-direction: column;
  touch-action: pan-y;
  -webkit-overflow-scrolling: touch;
  box-sizing: border-box;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Адаптивность */
@media (max-width: 480px) {
  .page-header {
    padding: 12px 16px;
  }
  
  .header-logo-container {
    gap: 0.375rem;
  }
  
  .main-title {
    font-size: 1.5rem;
    padding: 0 0.75rem;
  }
  
  .subtitle {
    font-size: 0.8125rem;
    padding: 0 0.75rem;
  }
  
  .habit-card {
    padding: 1rem 1.25rem;
    min-height: 68px;
    border-radius: 14px;
  }
  
  .habit-icon-large {
    font-size: 1.75rem;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 10px;
  }
  
  .habit-name-text {
    font-size: 0.9375rem;
  }
  
  .habit-progress {
    font-size: 0.75rem;
  }
  
  .btn-add-habit {
    height: 52px;
  }
}

@media (min-width: 600px) {
  .home-view {
    padding: 1.5rem 1.5rem 2rem;
  }
}
</style>
