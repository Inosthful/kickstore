<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { api, ApiError, type StockConflict } from '@/api/client'
import { saveLastOrder } from '@/composables/lastOrder'
import { useCart } from '@/composables/useCart'
import { formatPrice, formatSize } from '@/utils/format'

const router = useRouter()
const cart = useCart()

const form = reactive({ firstName: '', lastName: '', email: '', street: '', postalCode: '', city: '' })

const fields = [
  { prop: 'firstName', path: 'customer.firstName', label: 'Prénom', autocomplete: 'given-name' },
  { prop: 'lastName', path: 'customer.lastName', label: 'Nom', autocomplete: 'family-name' },
  { prop: 'email', path: 'customer.email', label: 'Email', autocomplete: 'email', type: 'email' },
  { prop: 'street', path: 'address.street', label: 'Adresse', autocomplete: 'street-address' },
  { prop: 'postalCode', path: 'address.postalCode', label: 'Code postal', autocomplete: 'postal-code' },
  { prop: 'city', path: 'address.city', label: 'Ville', autocomplete: 'address-level2' },
] as const

const submitting = ref(false)
let ordered = false
const fieldErrors = ref<Record<string, string>>({})
const formError = ref<string | null>(null)
const conflicts = ref<StockConflict[]>([])

const nameOf = (c: StockConflict) =>
  cart.items.value.find((i) => i.productId === c.productId)?.name ?? `Produit ${c.productId}`

watch(cart.count, (count) => {
  if (count === 0 && !ordered) router.replace({ name: 'catalog' })
})

async function submit() {
  if (!cart.canCheckout.value || submitting.value) return

  submitting.value = true
  fieldErrors.value = {}
  formError.value = null
  conflicts.value = []

  try {
    const order = await api.createOrder({
      customer: { firstName: form.firstName, lastName: form.lastName, email: form.email },
      address: { street: form.street, postalCode: form.postalCode, city: form.city },
      items: cart.payload.value,
      promoCode: cart.appliedCode.value,
    })
    ordered = true
    saveLastOrder(order)
    cart.clear()
    router.replace({ name: 'confirmation' })
  } catch (e) {
    if (!(e instanceof ApiError)) throw e

    if (e.status === 400 && e.issues.some((i) => i.path === 'promoCode')) {
      formError.value = "Ton code promo n'est plus valable, le total a été mis à jour."
      await cart.revalidate()
    } else if (e.status === 400) {
      fieldErrors.value = Object.fromEntries(e.issues.map((i) => [i.path, i.message]))
      formError.value = 'Certaines informations sont invalides.'
    } else if (e.status === 409) {
      conflicts.value = e.conflicts
      await cart.revalidate()
    } else {
      formError.value = e.status === 0 ? 'Le serveur est injoignable, réessaie dans un instant.' : 'Une erreur est survenue, réessaie.'
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <h1>Livraison</h1>

  <div class="layout">
    <form class="form" @submit.prevent="submit">
      <div v-if="conflicts.length" class="alert" role="alert">
        <strong>Un article n'est plus disponible en quantité suffisante :</strong>
        <ul>
          <li v-for="c in conflicts" :key="`${c.productId}:${c.size}`">
            {{ nameOf(c) }} ({{ formatSize(c.size) }}) :
            {{ c.available === 0 ? 'rupture de stock' : `plus que ${c.available} en stock` }}
          </li>
        </ul>
        <button type="button" class="link" @click="cart.open()">Modifier mon panier</button>
      </div>
      <div v-else-if="formError" class="alert" role="alert">{{ formError }}</div>

      <label v-for="f in fields" :key="f.prop" :class="{ half: f.prop === 'postalCode' || f.prop === 'city' }">
        <span>{{ f.label }}</span>
        <input
          v-model.trim="form[f.prop]"
          :type="'type' in f ? f.type : 'text'"
          :autocomplete="f.autocomplete"
          :aria-invalid="!!fieldErrors[f.path]"
          required
        />
        <small v-if="fieldErrors[f.path]">{{ fieldErrors[f.path] }}</small>
      </label>

      <button class="btn" type="submit" :disabled="!cart.canCheckout.value || submitting">
        <span v-if="submitting" class="spinner" aria-hidden="true" />
        {{ submitting ? 'Validation en cours…' : `Confirmer la commande · ${formatPrice(cart.total.value)}` }}
      </button>
      <p v-if="cart.validating.value" class="hint">Vérification du stock…</p>
      <p v-else-if="cart.hasIssues.value" class="hint danger">
        Ton panier contient un article indisponible.
        <button type="button" class="link" @click="cart.open()">Voir le panier</button>
      </p>
    </form>

    <aside class="summary">
      <h2>Récapitulatif</h2>
      <ul>
        <li v-for="item in cart.items.value" :key="`${item.productId}:${item.size}`">
          <span>{{ item.quantity }} × {{ item.name }} ({{ formatSize(item.size) }})</span>
          <span>{{ formatPrice(item.unitPrice * item.quantity) }}</span>
        </li>
      </ul>
      <template v-if="cart.discount.value > 0">
        <div class="row"><span>Sous-total</span><span>{{ formatPrice(cart.subtotal.value) }}</span></div>
        <div class="row discount">
          <span>Code {{ cart.appliedCode.value }}</span>
          <span>−{{ formatPrice(cart.discount.value) }}</span>
        </div>
      </template>
      <div class="total">
        <span>Total</span>
        <strong>{{ formatPrice(cart.total.value) }}</strong>
      </div>
      <p class="hint">Paiement simulé : aucune carte n'est demandée.</p>
    </aside>
  </div>
</template>

<style scoped>
h1 {
  margin-bottom: 24px;
  font-size: 30px;
}

.layout {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 32px;
  align-items: start;
}

.form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding: 24px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
}

.form > * {
  grid-column: 1 / -1;
}

.form > label.half {
  grid-column: auto;
}

.alert ul {
  margin: 8px 0 8px 20px;
}

label {
  display: grid;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
}

input {
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: 8px;
  font-weight: 400;
}

input:focus {
  outline: 2px solid var(--ink);
  outline-offset: -1px;
}

input[aria-invalid='true'] {
  border-color: var(--danger);
}

small {
  color: var(--danger);
  font-weight: 400;
}

.hint {
  color: var(--muted);
  font-size: 14px;
}

.hint.danger {
  color: var(--danger);
}

.summary {
  padding: 24px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
}

.summary h2 {
  margin-bottom: 12px;
  font-size: 18px;
}

.summary ul {
  display: grid;
  gap: 10px;
  list-style: none;
  padding: 0;
}

.summary li,
.row,
.total {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.row {
  margin-top: 16px;
  color: var(--muted);
  font-size: 14px;
}

.row + .row {
  margin-top: 4px;
}

.row.discount {
  color: var(--ok);
}

.total {
  margin: 16px 0;
  padding-top: 16px;
  border-top: 1px solid var(--line);
  font-size: 18px;
}

@media (max-width: 860px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
</style>
