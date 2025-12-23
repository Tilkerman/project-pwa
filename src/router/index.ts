import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import HabitDetailView from '../views/HabitDetailView.vue'
import StatsView from '../views/StatsView.vue'
import AchievementsView from '../views/AchievementsView.vue'
import SettingsView from '../views/SettingsView.vue'
import NotificationSettingsView from '../views/NotificationSettingsView.vue'
import AboutView from '../views/AboutView.vue'
import ShareView from '../views/ShareView.vue'

const router = createRouter({
  // Hash-роутинг работает одинаково:
  // - на любом хосте/поддиректории (без настройки base на сервере)
  // - в Telegram WebView (desktop/mobile)
  // - в установленной PWA
  // В Telegram WebView иногда открывается URL без "#/".
  // base нужен, чтобы hash-history корректно работал на GitHub Pages (/project-pwa/).
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/habit/:id',
      name: 'habit-detail',
      component: HabitDetailView
    },
    {
      path: '/stats',
      name: 'stats',
      component: StatsView
    },
    {
      path: '/achievements',
      name: 'achievements',
      component: AchievementsView
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView
    },
    {
      path: '/settings/notifications',
      name: 'settings-notifications',
      component: NotificationSettingsView
    },
    {
      path: '/settings/about',
      name: 'settings-about',
      component: AboutView
    },
    {
      path: '/settings/share',
      name: 'settings-share',
      component: ShareView
    }
    ,
    // Fallback: если Telegram открыл URL “не так” или hash пустой/нестандартный,
    // всегда уводим на главную, чтобы не получить пустой экран.
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

export default router

