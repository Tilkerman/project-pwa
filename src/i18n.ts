import { createI18n } from 'vue-i18n'
import ru from './locales/ru.json'
import en from './locales/en.json'

const messages = {
  ru,
  en
}

// Определяем язык по умолчанию из localStorage или браузера
const getDefaultLocale = (): string => {
  const saved = localStorage.getItem('locale')
  if (saved && (saved === 'ru' || saved === 'en')) {
    return saved
  }
  
  // Определяем язык браузера
  const browserLang = navigator.language || (navigator as any).userLanguage
  if (browserLang.startsWith('ru')) {
    return 'ru'
  }
  return 'en'
}

export const i18n = createI18n({
  legacy: false,
  locale: getDefaultLocale(),
  fallbackLocale: 'ru',
  messages
})

// Сохраняем язык при изменении
i18n.global.locale.value = getDefaultLocale()

export default i18n

