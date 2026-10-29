import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', name: 'catalog', component: () => import('@/views/CatalogView.vue') },
    { path: '/products/:id', name: 'product', component: () => import('@/views/ProductView.vue') },
  ],
})
