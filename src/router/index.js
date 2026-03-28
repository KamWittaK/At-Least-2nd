import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import WheelView from '@/views/WheelView.vue'
import RoulletGame from '@/views/RoulletGame.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/wheel',
      name: 'wheel',
      component: WheelView,
    },
    {
      path: '/games/roulette',
      name: 'roulette',
      component: RoulletGame,
    }


  ],
})

export default router
