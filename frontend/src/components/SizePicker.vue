<script setup lang="ts">
import type { StockSize } from '@/api/client'
import { formatSize } from '@/utils/format'

defineProps<{ sizes: StockSize[] | null; loading: boolean }>()
const selected = defineModel<number | null>({ required: true })
</script>

<template>
  <div class="sizes" role="radiogroup" aria-label="Pointure" :aria-busy="loading">
    <template v-if="loading || !sizes">
      <span v-for="n in 7" :key="n" class="size skeleton" />
    </template>
    <template v-else>
      <button
        v-for="{ size, stock } in sizes"
        :key="size"
        type="button"
        role="radio"
        class="size"
        :class="{ selected: selected === size, soldout: stock === 0 }"
        :aria-checked="selected === size"
        :disabled="stock === 0"
        :title="stock === 0 ? 'Rupture de stock' : undefined"
        @click="selected = size"
      >
        {{ formatSize(size) }}
      </button>
    </template>
  </div>
</template>

<style scoped>
.sizes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
  gap: 8px;
}

.size {
  height: 48px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
  font-weight: 600;
  transition: border-color 0.12s, background 0.12s;
}

.size:hover:not(:disabled) {
  border-color: var(--ink);
}

.size.selected {
  background: var(--ink);
  border-color: var(--ink);
  color: #fff;
}

.size.soldout {
  background: var(--bg);
  color: #b4b2aa;
  text-decoration: line-through;
  cursor: not-allowed;
}

.size.skeleton {
  border-color: transparent;
}
</style>
