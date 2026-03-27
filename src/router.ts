import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'order-entry',
      component: () => import('./pages/OrderEntryPage.vue'),
    },
    {
      path: '/orders',
      name: 'order-history',
      component: () => import('./pages/OrderHistoryPage.vue'),
    },
  ],
})

export default router
