<script setup lang="ts">
import { useCart } from '@/composables/useCart'

const { count, open } = useCart()
</script>

<template>
  <header class="header">
    <div class="container bar">
      <RouterLink to="/" class="logo">KICK<span>STORE</span></RouterLink>
      <button class="cart" type="button" aria-label="Ouvrir le panier" @click="open()">
        Panier
        <span v-if="count > 0" class="badge">{{ count }}</span>
      </button>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgb(243 241 236 / 85%);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--line);
}

.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  height: 64px;
}

.logo {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.logo span {
  color: var(--accent);
}


.cart {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border: 1px solid var(--ink);
  border-radius: 999px;
  background: transparent;
  font-weight: 600;
}

.badge {
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--ink);
  color: #fff;
  font-size: 12px;
  line-height: 22px;
  text-align: center;
}
</style>
