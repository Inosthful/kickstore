<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { api, ApiError, type Product, type StockSize } from '@/api/client'
import SizePicker from '@/components/SizePicker.vue'
import SneakerImage from '@/components/SneakerImage.vue'
import { MAX_QUANTITY, useCart } from '@/composables/useCart'
import { formatPrice, formatSize } from '@/utils/format'

const route = useRoute()
const cart = useCart()

const id = computed(() => Number(route.params.id))
const product = ref<Product | null>(null)
const productError = ref<string | null>(null)
const sizes = ref<StockSize[] | null>(null)
const loadingStock = ref(true)
const stockError = ref(false)
const selected = ref<number | null>(null)

async function loadProduct() {
  productError.value = null
  try {
    product.value = await api.getProduct(id.value)
  } catch (e) {
    productError.value =
      e instanceof ApiError && e.status === 404 ? 'Cette paire est introuvable.' : 'Impossible de charger cette paire.'
  }
}

async function loadStock() {
  loadingStock.value = true
  stockError.value = false
  try {
    sizes.value = await api.getStock(id.value)
    if (!sizes.value.some((s) => s.size === selected.value && s.stock > 0)) selected.value = null
  } catch {
    stockError.value = true
  } finally {
    loadingStock.value = false
  }
}

watch(
  id,
  () => {
    product.value = null
    sizes.value = null
    selected.value = null
    loadProduct()
    loadStock()
  },
  { immediate: true },
)

const selectedStock = computed(() => sizes.value?.find((s) => s.size === selected.value)?.stock ?? 0)
const inCart = computed(() => (selected.value === null ? 0 : cart.quantityInCart(id.value, selected.value)))
const limit = computed(() => Math.min(selectedStock.value, MAX_QUANTITY))
const soldOut = computed(() => sizes.value !== null && sizes.value.every((s) => s.stock === 0))

const buttonLabel = computed(() => {
  if (selected.value === null) return 'Choisis une pointure'
  if (inCart.value >= limit.value) return 'Maximum atteint dans le panier'
  return 'Ajouter au panier'
})

function addToCart() {
  if (!product.value || selected.value === null) return
  cart.add(product.value, selected.value)
  cart.open()
}
</script>

<template>
  <RouterLink to="/" class="back">← Retour au catalogue</RouterLink>

  <div v-if="productError" class="alert">{{ productError }}</div>

  <div v-else class="layout">
    <div class="visual">
      <SneakerImage v-if="product" :color="product.color" />
      <div v-else class="skeleton visual-placeholder" />
    </div>

    <section>
      <template v-if="product">
        <p class="brand">{{ product.brand }}</p>
        <h1>{{ product.name }}</h1>
        <p class="colorway">{{ product.colorway }}</p>
        <p class="price">{{ formatPrice(product.price) }}</p>
      </template>
      <template v-else>
        <div class="skeleton line short" />
        <div class="skeleton line title" />
        <div class="skeleton line short" />
      </template>

      <h2>Pointure</h2>

      <div v-if="stockError" class="alert">
        Impossible de charger le stock.
        <button class="link" type="button" @click="loadStock">Réessayer</button>
      </div>
      <template v-else>
        <SizePicker v-model="selected" :sizes="sizes" :loading="loadingStock" />
        <p v-if="soldOut" class="note danger">Cette paire est en rupture de stock sur toutes les pointures.</p>
        <p v-else-if="selected !== null" class="note" :class="{ danger: selectedStock <= 3 }">
          {{ selectedStock <= 3 ? `Plus que ${selectedStock} en stock en ${formatSize(selected)}` : `En stock en ${formatSize(selected)}` }}
        </p>
      </template>

      <button
        class="btn add"
        type="button"
        :disabled="!product || selected === null || inCart >= limit"
        @click="addToCart"
      >
        {{ buttonLabel }}
      </button>
    </section>
  </div>
</template>

<style scoped>
.back {
  display: inline-block;
  margin-bottom: 20px;
  color: var(--muted);
  font-size: 14px;
}

.layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
}

.visual {
  padding: 32px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
}

.visual-placeholder {
  aspect-ratio: 320 / 190;
}

.brand {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted);
}

h1 {
  font-size: 34px;
}

.colorway {
  color: var(--muted);
}

.price {
  margin: 12px 0 28px;
  font-size: 24px;
  font-weight: 700;
}

h2 {
  margin-bottom: 12px;
  font-size: 15px;
}

.line {
  height: 18px;
  margin-bottom: 10px;
}

.line.short {
  width: 30%;
}

.line.title {
  width: 60%;
  height: 34px;
}

.note {
  margin-top: 12px;
  font-size: 14px;
  color: var(--ok);
}

.note.danger {
  color: var(--danger);
}

.add {
  width: 100%;
  margin-top: 24px;
}

@media (max-width: 760px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
</style>
