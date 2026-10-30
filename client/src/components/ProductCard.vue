<script setup lang="ts">
import type { Product } from '@/api/client'
import { formatPrice } from '@/utils/format'

defineProps<{ product: Product }>()
</script>

<template>
  <RouterLink :to="{ name: 'product', params: { id: product.id } }" class="card">
    <div class="visual">
      <img :src="product.model.image" :alt="`${product.brand} ${product.name} ${product.colorway}`" loading="lazy" />
    </div>
    <div class="body">
      <p class="eyebrow">{{ product.brand }}</p>
      <h3>{{ product.name }}</h3>
      <p class="colorway">{{ product.colorway }}</p>
      <p class="price">{{ formatPrice(product.price) }}</p>
    </div>
  </RouterLink>
</template>

<style scoped>
.card {
  display: block;
  overflow: hidden;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  transition: transform 0.2s, box-shadow 0.2s;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 40px rgb(20 20 20 / 10%);
}

.visual {
  aspect-ratio: 4 / 3;
  padding: 8px;
  background: radial-gradient(ellipse at 50% 60%, #fff 0%, var(--tile) 75%);
}

.visual img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.4s;
}

.card:hover .visual img {
  transform: scale(1.05) rotate(-2deg);
}

.body {
  padding: 16px 18px 18px;
}

h3 {
  margin-top: 4px;
  font-size: 18px;
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
