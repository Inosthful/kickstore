<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
import CartDrawer from '@/components/CartDrawer.vue'
</script>

<template>
  <AppHeader />
  <main class="container page">
    <RouterView />
  </main>
  <CartDrawer />
</template>
