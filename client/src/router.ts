import { createRouter, createWebHistory } from 'vue-router'
import { readLastOrder } from '@/composables/lastOrder'
import { useCart } from '@/composables/useCart'

export const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: (to) => (to.hash ? { el: to.hash, behavior: 'smooth' } : { top: 0 }),
  routes: [
    { path: '/', name: 'catalog', component: () => import('@/views/CatalogView.vue') },
    { path: '/products/:id', name: 'product', component: () => import('@/views/ProductView.vue') },
    { path: '/credits', name: 'credits', component: () => import('@/views/CreditsView.vue') },
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
    // page de réglage des modèles, en dev seulement
    ...(import.meta.env.DEV ? [{ path: '/lab', name: 'lab', component: () => import('@/views/LabView.vue') }] : []),
  ],
})
