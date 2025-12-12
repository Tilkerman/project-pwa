<template>
  <div class="about-view">
    <header class="page-header">
      <button class="back-btn" @click="goBack" aria-label="Назад">
        <span class="back-icon">←</span>
      </button>
      <h1 class="page-title">О проекте</h1>
      <div style="width: 40px;"></div> <!-- Spacer для выравнивания -->
    </header>

    <div class="about-content">
      <div class="about-section">
        <h2 class="section-title">Трекер Привычек</h2>
        <p class="section-text">
          Приложение для отслеживания привычек с персонажами-мотиваторами. 
          Версия {{ appVersion }}
        </p>
        <p class="section-text">
          Можно пользоваться прямо в Telegram (Mini App), а можно установить приложение на телефон.
          После установки оно работает без интернета, все данные хранятся локально.
        </p>
      </div>

      <div class="about-section">
        <h2 class="section-title">🎯 Философия проекта</h2>
        <p class="section-text">
          Мы верим, что избавление от вредных привычек — это не просто счетчик дней, 
          а путешествие с поддержкой и мотивацией. Каждый день без вредной привычки — 
          это маленькая победа, которую стоит отмечать и праздновать.
        </p>
        <p class="section-text">
          Наши персонажи-мотиваторы созданы для того, чтобы вы не чувствовали себя одиноко 
          в этом путешествии. Они будут рядом, поддерживая вас каждый день, отмечая ваши 
          достижения и помогая не сбиться с пути.
        </p>
      </div>

      <div class="about-section">
        <h2 class="section-title">✨ Преимущества</h2>
        <ul class="advantages-list">
          <li>
            <strong>Локальное хранение данных</strong> — все ваши данные хранятся только 
            на вашем устройстве. Никто, кроме вас, не имеет к ним доступа.
          </li>
          <li>
            <strong>Работа офлайн</strong> — приложение работает без интернета. 
            Вы можете использовать его в любое время и в любом месте.
          </li>
          <li>
            <strong>Персонажи-мотиваторы</strong> — уникальные персонажи с разными стилями 
            поддержки помогут вам не сбиться с пути.
          </li>
          <li>
            <strong>Система достижений</strong> — получайте награды за ваши успехи и 
            отслеживайте прогресс.
          </li>
          <li>
            <strong>Гибкие уведомления</strong> — настройте напоминания через браузер 
            или Telegram для каждой привычки отдельно.
          </li>
          <li>
            <strong>Telegram Mini App</strong> — используйте приложение прямо в Telegram 
            без установки дополнительных приложений.
          </li>
          <li>
            <strong>Адаптивный дизайн</strong> — удобно использовать на любом устройстве: 
            телефоне, планшете или компьютере.
          </li>
        </ul>
      </div>

      <div class="about-section">
        <h2 class="section-title">👨‍💻 Об авторе</h2>
        <p class="section-text">
          Приложение создано с любовью и заботой о тех, кто решил изменить свою жизнь 
          к лучшему. Мы понимаем, как сложно бороться с вредными привычками в одиночку, 
          и создали это приложение, чтобы сделать путь к здоровой жизни более приятным 
          и мотивирующим.
        </p>
        <p class="section-text">
          Если у вас есть предложения по улучшению приложения или вы нашли ошибку, 
          мы будем рады вашей обратной связи!
        </p>
      </div>

      <div class="about-section">
        <h2 class="section-title">🛠 Технологии</h2>
        <p class="section-text">
          Приложение построено на современных веб-технологиях:
        </p>
        <ul class="tech-list">
          <li>Vue 3 + TypeScript</li>
          <li>Vite</li>
          <li>Pinia</li>
          <li>IndexedDB для локального хранения</li>
          <li>PWA для работы офлайн</li>
          <li>Telegram Mini App SDK</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
const appVersion = __APP_VERSION__ || '1.0.0'

function goBack() {
  router.push('/settings')
}
</script>

<style scoped>
.about-view {
  min-height: 100vh;
  background: var(--bg-primary);
  padding-bottom: 2rem;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn {
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  transition: background 0.2s;
}

.back-btn:hover {
  background: var(--bg-hover);
}

.back-icon {
  font-size: 1.5rem;
  color: var(--text-primary);
}

.page-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.about-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 1.5rem;
}

.about-section {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: var(--shadow-sm);
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
}

.section-text {
  font-size: 0.9375rem;
  color: var(--text-secondary);
  margin: 0 0 1rem 0;
  line-height: 1.6;
}

.section-text:last-child {
  margin-bottom: 0;
}

.advantages-list,
.tech-list {
  margin: 0;
  padding-left: 1.5rem;
  color: var(--text-secondary);
  line-height: 1.8;
}

.advantages-list li,
.tech-list li {
  margin-bottom: 0.75rem;
  font-size: 0.9375rem;
}

.advantages-list li:last-child,
.tech-list li:last-child {
  margin-bottom: 0;
}

.advantages-list strong {
  color: var(--text-primary);
  font-weight: 600;
}
</style>

