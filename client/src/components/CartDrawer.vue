<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCart } from '@/composables/useCart'
import { formatPrice, formatSize } from '@/utils/format'
import SneakerImage from './SneakerImage.vue'

const router = useRouter()
const {
  items, isOpen, validating, validationFailed, total, canCheckout,
  lineFor, maxFor, setQuantity, remove, close,
} = useCart()

function checkout() {
  close()
  router.push({ name: 'checkout' })
}

const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="isOpen" class="overlay" @click.self="close()">
        <aside class="drawer" role="dialog" aria-modal="true" aria-label="Panier">
          <header>
            <h2>Panier</h2>
            <button class="close" type="button" aria-label="Fermer" @click="close()">✕</button>
          </header>

          <p v-if="items.length === 0" class="empty">Ton panier est vide.</p>

          <ul v-else class="lines">
            <li v-for="item in items" :key="`${item.productId}:${item.size}`" class="line">
              <div class="thumb"><SneakerImage :color="item.color" /></div>
              <div class="info">
                <p class="name">{{ item.name }}</p>
                <p class="meta">Pointure {{ formatSize(item.size) }} · {{ formatPrice(item.unitPrice) }}</p>

                <p v-if="lineFor(item)?.status === 'unavailable'" class="issue">Cette paire n'est plus disponible.</p>
                <p v-else-if="lineFor(item)?.status === 'insufficient_stock'" class="issue">
                  {{ lineFor(item)!.stock === 0 ? 'Rupture de stock.' : `Plus que ${lineFor(item)!.stock} en stock.` }}
                  <button
                    v-if="lineFor(item)!.stock > 0"
                    type="button"
                    class="link"
                    @click="setQuantity(item, lineFor(item)!.stock)"
                  >
                    Ajuster
                  </button>
                </p>

                <div class="actions">
                  <div class="stepper">
                    <button type="button" aria-label="Moins" :disabled="item.quantity <= 1" @click="setQuantity(item, item.quantity - 1)">−</button>
                    <span>{{ item.quantity }}</span>
                    <button type="button" aria-label="Plus" :disabled="item.quantity >= maxFor(item)" @click="setQuantity(item, item.quantity + 1)">+</button>
                  </div>
                  <button type="button" class="link" @click="remove(item)">Retirer</button>
                </div>
              </div>
            </li>
          </ul>

          <footer v-if="items.length > 0">
            <div class="total">
              <span>Total</span>
              <strong>{{ formatPrice(total) }}</strong>
            </div>
            <p v-if="validationFailed" class="issue">Impossible de vérifier le panier pour le moment.</p>
            <p v-else-if="validating" class="hint">Vérification du stock…</p>
            <button type="button" class="btn" :disabled="!canCheckout" @click="checkout">Commander</button>
          </footer>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  justify-content: flex-end;
  background: rgb(0 0 0 / 40%);
}

.drawer {
  display: flex;
  flex-direction: column;
  width: min(420px, 100%);
  height: 100%;
  background: var(--surface);
  box-shadow: -8px 0 32px rgb(0 0 0 / 15%);
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--line);
}

.close {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: var(--bg);
}

.empty {
  padding: 32px 24px;
  color: var(--muted);
}

.lines {
  flex: 1;
  overflow-y: auto;
  list-style: none;
  padding: 8px 24px;
}

.line {
  display: flex;
  gap: 14px;
  padding: 16px 0;
  border-bottom: 1px solid var(--line);
}

.thumb {
  flex: none;
  width: 84px;
  height: 84px;
  padding: 8px;
  background: var(--bg);
  border-radius: 8px;
}

.info {
  flex: 1;
  min-width: 0;
}

.name {
  font-weight: 600;
}

.meta {
  color: var(--muted);
  font-size: 14px;
}

.issue {
  margin-top: 6px;
  color: var(--danger);
  font-size: 14px;
}

.actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
}

.stepper {
  display: flex;
  align-items: center;
  border: 1px solid var(--line);
  border-radius: 8px;
}

.stepper button {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  font-size: 18px;
}

.stepper span {
  min-width: 28px;
  text-align: center;
  font-weight: 600;
}

footer {
  display: block;
  padding: 20px 24px;
  border-top: 1px solid var(--line);
}

.total {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 18px;
}

.hint {
  margin-bottom: 10px;
  color: var(--muted);
  font-size: 14px;
}

.btn {
  width: 100%;
}

.drawer-enter-active,
.drawer-leave-active {
  transition: background 0.25s;
}

.drawer-enter-active .drawer,
.drawer-leave-active .drawer {
  transition: transform 0.25s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  background: rgb(0 0 0 / 0%);
}

.drawer-enter-from .drawer,
.drawer-leave-to .drawer {
  transform: translateX(100%);
}
</style>
