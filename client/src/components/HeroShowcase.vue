<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Product } from '@/api/client'
import SneakerViewer from '@/components/SneakerViewer.vue'
import { formatPrice } from '@/utils/format'

const props = defineProps<{ products: Product[] }>()

const index = ref(0)
const current = computed(() => props.products[index.value])
const go = (step: number) => {
  index.value = (index.value + step + props.products.length) % props.products.length
}
</script>

<template>
  <section class="hero stage">
    <div class="copy">
      <p class="eyebrow light">Vitrine 3D</p>
      <h1>Les paires du moment, sous tous les angles.</h1>
      <p class="lead">
        Chaque paire est un vrai modèle 3D : fais-la tourner, choisis ta pointure, le stock est vérifié en direct par
        le serveur.
      </p>
      <div class="actions">
        <RouterLink v-if="current" :to="{ name: 'product', params: { id: current.id } }" class="btn light">
          Voir la paire
        </RouterLink>
        <a href="#catalogue" class="btn ghost">Tout le catalogue</a>
      </div>
    </div>

    <div class="viewer">
      <SneakerViewer v-if="current" :src="current.model.url" :auto-rotate="true" :zoom="false" />
    </div>

    <div v-if="current" class="caption">
      <button class="arrow" type="button" aria-label="Paire précédente" @click="go(-1)">←</button>
      <div class="meta">
        <p class="eyebrow light">{{ current.brand }} · {{ index + 1 }} / {{ products.length }}</p>
        <p class="name">{{ current.name }} <span>{{ current.colorway }}</span></p>
        <p class="price">{{ formatPrice(current.price) }}</p>
      </div>
      <button class="arrow" type="button" aria-label="Paire suivante" @click="go(1)">→</button>
    </div>
  </section>
</template>

<style scoped>
.hero {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
  grid-template-rows: 1fr auto;
  min-height: 560px;
  padding: 40px;
}

.copy {
  align-self: center;
  max-width: 420px;
}

.eyebrow.light {
  color: rgb(255 255 255 / 60%);
}

h1 {
  margin: 14px 0 16px;
  font-size: clamp(32px, 4vw, 52px);
}

.lead {
  color: rgb(255 255 255 / 72%);
  font-size: 16px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.viewer {
  grid-row: 1 / span 2;
  min-height: 420px;
}

.caption {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-top: 16px;
  border-top: 1px solid rgb(255 255 255 / 15%);
}

.meta {
  flex: 1;
  min-width: 0;
}

.name {
  margin-top: 4px;
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
}

.name span {
  color: rgb(255 255 255 / 60%);
  font-weight: 500;
}

.price {
  margin-top: 2px;
  color: rgb(255 255 255 / 85%);
}

.arrow {
  width: 44px;
  height: 44px;
  border: 1px solid rgb(255 255 255 / 30%);
  border-radius: 50%;
  background: transparent;
  color: #fff;
  font-size: 18px;
  transition: background 0.15s;
}

.arrow:hover {
  background: rgb(255 255 255 / 12%);
}

@media (max-width: 900px) {
  .hero {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
    padding: 28px 24px;
  }

  .viewer {
    grid-row: auto;
    min-height: 340px;
  }

  .copy {
    max-width: none;
  }
}
</style>
