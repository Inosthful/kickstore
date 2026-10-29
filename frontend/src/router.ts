import { createRouter, createWebHistory } from 'vue-router'
import { readLastOrder } from '@/composables/lastOrder'
import { useCart } from '@/composables/useCart'

export const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', name: 'catalog', component: () => import('@/views/CatalogView.vue') },
    { path: '/products/:id', name: 'product', component: () => import('@/views/ProductView.vue') },
    {
      path: '/checkout',
      name: 'checkout',
      component: () => import('@/views/CheckoutView.vue'),
      beforeEnter: () => (useCart().count.value > 0 ? true : { name: 'catalog' }),
    },
    {
      path: '/confirmation',
      name: 'confirmation',
      component: () => import('@/views/ConfirmationView.vue'),
      beforeEnter: () => (readLastOrder() ? true : { name: 'catalog' }),
    },
  ],
})
