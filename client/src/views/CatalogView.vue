<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { api, type Product } from '@/api/client'
import HeroShowcase from '@/components/HeroShowcase.vue'
import ProductCard from '@/components/ProductCard.vue'

const products = ref<Product[]>([])
const loading = ref(true)
const error = ref(false)
const brand = ref<string | null>(null)

const brands = computed(() => [...new Set(products.value.map((p) => p.brand))])
const shown = computed(() => (brand.value ? products.value.filter((p) => p.brand === brand.value) : products.value))

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
  <HeroShowcase v-if="products.length" :products="products" />
  <div v-else-if="loading" class="skeleton hero-placeholder" />

  <section id="catalogue" class="catalogue">
    <div class="head">
      <div>
        <p class="eyebrow">Catalogue</p>
        <h2>{{ products.length || '' }} paires, toutes en 3D</h2>
      </div>
      <div v-if="brands.length" class="filters" role="group" aria-label="Filtrer par marque">
        <button class="chip" :class="{ active: brand === null }" type="button" @click="brand = null">Toutes</button>
        <button
          v-for="b in brands"
          :key="b"
          class="chip"
          :class="{ active: brand === b }"
          type="button"
          @click="brand = brand === b ? null : b"
        >
          {{ b }}
        </button>
      </div>
    </div>

    <div v-if="error" class="alert state">
      Impossible de charger le catalogue.
      <button class="link" type="button" @click="load">Réessayer</button>
    </div>

    <div v-else class="grid">
      <template v-if="loading">
        <div v-for="n in 6" :key="n" class="skeleton placeholder" />
      </template>
      <template v-else>
        <ProductCard v-for="product in shown" :key="product.id" :product="product" />
      </template>
    </div>
  </section>
</template>

<style scoped>
.hero-placeholder {
  height: 560px;
  border-radius: var(--radius);
}

.catalogue {
  margin-top: 56px;
  scroll-margin-top: 80px;
}

.head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

h2 {
  margin-top: 6px;
  font-size: 30px;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
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
