<script setup lang="ts">
import type { Product } from '@/api/client'
import { formatPrice } from '@/utils/format'
import SneakerImage from './SneakerImage.vue'

defineProps<{ product: Product }>()
</script>

<template>
  <RouterLink :to="{ name: 'product', params: { id: product.id } }" class="card">
    <div class="visual"><SneakerImage :color="product.color" /></div>
    <p class="brand">{{ product.brand }}</p>
    <h3>{{ product.name }}</h3>
    <p class="colorway">{{ product.colorway }}</p>
    <p class="price">{{ formatPrice(product.price) }}</p>
  </RouterLink>
</template>

<style scoped>
.card {
  display: block;
  padding: 16px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  transition: transform 0.15s, box-shadow 0.15s;
}

.card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 24px rgb(0 0 0 / 8%);
}

.visual {
  padding: 12px;
  margin-bottom: 12px;
  background: var(--bg);
  border-radius: 8px;
}

.brand {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted);
}

h3 {
  font-size: 17px;
  margin-top: 2px;
}

.colorway {
  color: var(--muted);
  font-size: 14px;
}

.price {
  margin-top: 10px;
  font-weight: 700;
}
</style>
