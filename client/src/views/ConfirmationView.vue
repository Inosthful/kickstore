<script setup lang="ts">
import { readLastOrder } from '@/composables/lastOrder'
import { formatPrice, formatSize } from '@/utils/format'

const order = readLastOrder()!
</script>

<template>
  <section class="confirmation">
    <div class="check">✓</div>
    <h1>Commande confirmée</h1>
    <p class="muted">
      Merci {{ order.customer.firstName }} ! Ta commande n°{{ order.id }} est enregistrée au nom de {{ order.customer.email }}.
    </p>

    <ul>
      <li v-for="item in order.items" :key="`${item.productId}:${item.size}`">
        <span>{{ item.quantity }} × {{ item.name }} ({{ formatSize(item.size) }})</span>
        <span>{{ formatPrice(item.lineTotal) }}</span>
      </li>
    </ul>

    <template v-if="order.discount > 0">
      <div class="row"><span>Sous-total</span><span>{{ formatPrice(order.subtotal) }}</span></div>
      <div class="row"><span>Code {{ order.promoCode }}</span><span>−{{ formatPrice(order.discount) }}</span></div>
    </template>
    <div class="total">
      <span>Total</span>
      <strong>{{ formatPrice(order.total) }}</strong>
    </div>

    <p class="muted">
      Livraison : {{ order.address.street }}, {{ order.address.postalCode }} {{ order.address.city }}
    </p>

    <RouterLink to="/" class="btn">Continuer mes achats</RouterLink>
  </section>
</template>

<style scoped>
.confirmation {
  display: grid;
  gap: 16px;
  max-width: 560px;
  margin: 24px auto 0;
  padding: 32px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  text-align: center;
}

.check {
  width: 56px;
  height: 56px;
  margin: 0 auto;
  border-radius: 50%;
  background: var(--ok);
  color: #fff;
  font-size: 28px;
  line-height: 56px;
}

.muted {
  color: var(--muted);
}

ul {
  display: grid;
  gap: 8px;
  list-style: none;
  padding: 16px 0;
  border-block: 1px solid var(--line);
  text-align: left;
}

li,
.row,
.total {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.row {
  color: var(--muted);
}

.total {
  font-size: 18px;
}
</style>
