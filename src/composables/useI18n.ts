import { computed } from 'vue'
import { useI18n as useVueI18n } from 'vue-i18n'

export function useI18n() {
  const { locale, t } = useVueI18n()
  
  const currentLocale = computed(() => locale.value as 'ru' | 'en')
  
  function toggleLanguage() {
    const newLocale = currentLocale.value === 'ru' ? 'en' : 'ru'
    locale.value = newLocale
    localStorage.setItem('locale', newLocale)
  }
  
  function setLanguage(lang: 'ru' | 'en') {
    locale.value = lang
    localStorage.setItem('locale', lang)
  }
  
  return {
    locale: currentLocale,
    t,
    toggleLanguage,
    setLanguage
  }
}

