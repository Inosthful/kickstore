<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { api, ApiError, type Product, type StockSize } from '@/api/client'
import SizePicker from '@/components/SizePicker.vue'
import SneakerViewer from '@/components/SneakerViewer.vue'
import { MAX_QUANTITY, useCart } from '@/composables/useCart'
import { formatDate, formatDollars, formatPrice, formatSize } from '@/utils/format'

const route = useRoute()
const cart = useCart()

const id = computed(() => Number(route.params.id))
const product = ref<Product | null>(null)
const productError = ref<string | null>(null)
const sizes = ref<StockSize[] | null>(null)
const loadingStock = ref(true)
const stockError = ref(false)
const selected = ref<number | null>(null)
const touched = ref(false)

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
    touched.value = false
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
    <div class="stage visual" @pointerdown="touched = true">
      <SneakerViewer v-if="product" :src="product.model.url" :auto-rotate="!touched" />
      <p class="hint" :class="{ hidden: touched }">Glisse pour faire tourner la paire</p>
    </div>

    <section class="details">
      <template v-if="product">
        <p class="eyebrow">{{ product.brand }}</p>
        <h1>{{ product.name }}</h1>
        <p class="colorway">{{ product.colorway }}</p>
        <p class="price">
          {{ formatPrice(product.price) }}
          <span class="retail">retail {{ formatDollars(product.retailPrice) }}</span>
        </p>
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

      <dl v-if="product" class="facts">
        <div><dt>Code style</dt><dd>{{ product.sku }}</dd></div>
        <div><dt>Sortie</dt><dd>{{ formatDate(product.releaseDate) }}</dd></div>
        <div>
          <dt>Modèle 3D</dt>
          <dd>
            <a :href="product.model.source" target="_blank" rel="noopener">{{ product.model.author }}</a>
            sur Sketchfab, licence {{ product.model.license }}
          </dd>
        </div>
      </dl>
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
  grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
  gap: 40px;
  align-items: start;
}

.visual {
  position: sticky;
  top: 88px;
  height: min(620px, 70vh);
}

.hint {
  position: absolute;
  bottom: 18px;
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 12px;
  border-radius: 999px;
  background: rgb(255 255 255 / 10%);
  color: rgb(255 255 255 / 75%);
  font-size: 13px;
  white-space: nowrap;
  pointer-events: none;
  transition: opacity 0.4s;
}

.hint.hidden {
  opacity: 0;
}

h1 {
  margin-top: 4px;
  font-size: 38px;
}

.colorway {
  margin-top: 4px;
  color: var(--muted);
  font-size: 18px;
}

.price {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin: 16px 0 28px;
  font-size: 26px;
  font-weight: 700;
}

.retail {
  color: var(--muted);
  font-size: 14px;
  font-weight: 500;
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
  height: 38px;
}

.note {
  margin-top: 12px;
  font-size: 14px;
  color: var(--accent);
}

.note.danger {
  color: var(--danger);
}

.add {
  width: 100%;
  margin-top: 24px;
}

.facts {
  display: grid;
  gap: 10px;
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid var(--line);
  font-size: 14px;
}

.facts div {
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 12px;
}

.facts dt {
  color: var(--muted);
}

.facts a {
  text-decoration: underline;
  text-underline-offset: 3px;
}

@media (max-width: 860px) {
  .layout {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .visual {
    position: static;
    height: 380px;
  }
}
</style>
