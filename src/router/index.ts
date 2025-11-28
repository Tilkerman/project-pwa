import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import HabitDetailView from '../views/HabitDetailView.vue'
import StatsView from '../views/StatsView.vue'
import AchievementsView from '../views/AchievementsView.vue'

const router = createRouter({
  history: createWebHistory(),
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
    }
  ]
})

export default router

