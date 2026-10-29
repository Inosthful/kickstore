<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api, type Product } from '@/api/client'
import ProductCard from '@/components/ProductCard.vue'

const products = ref<Product[]>([])
const loading = ref(true)
const error = ref(false)

async function load() {
  loading.value = true
  error.value = false
  try {
    products.value = await api.listProducts()
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <h1>Les paires du moment</h1>
  <p class="subtitle">Choisis ta pointure, le stock est vérifié en direct.</p>

  <div v-if="error" class="alert state">
    Impossible de charger le catalogue.
    <button class="link" type="button" @click="load">Réessayer</button>
  </div>

  <div v-else class="grid">
    <template v-if="loading">
      <div v-for="n in 6" :key="n" class="skeleton placeholder" />
    </template>
    <template v-else>
      <ProductCard v-for="product in products" :key="product.id" :product="product" />
    </template>
  </div>
</template>

<style scoped>
h1 {
  font-size: 32px;
}

.subtitle {
  margin: 4px 0 28px;
  color: var(--muted);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}

.placeholder {
  height: 360px;
  border-radius: var(--radius);
}

.state {
  display: flex;
  gap: 12px;
}
</style>
