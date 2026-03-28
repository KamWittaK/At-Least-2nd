import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import WheelView from '@/views/WheelView.vue'
import RoulletGame from '@/views/RoulletGame.vue'
import BlackJackGame from '@/views/BlackJackGame.vue'
import OverUnderGame from '@/views/OverUnderGame.vue'

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
    },
    {
      path: '/games/blackjack',
      name: 'blackjack',
      component: BlackJackGame
    },
    {
      path: '/games/overunder',
      alias: 'overunder',
      name: 'overunder',
      component: OverUnderGame,
    },

  ],
})

export default router
