import { computed, ref } from 'vue'
import type { Product } from '@/api/client'

export interface CartItem {
  productId: number
  name: string
  color: string
  size: number
  quantity: number
  unitPrice: number
}

export const MAX_QUANTITY = 5

const keyOf = (item: { productId: number; size: number }) => `${item.productId}:${item.size}`

const items = ref<CartItem[]>([])

export function useCart() {
  const count = computed(() => items.value.reduce((n, i) => n + i.quantity, 0))
  const total = computed(() => items.value.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0))
  const canCheckout = computed(() => items.value.length > 0)
  const payload = computed(() =>
    items.value.map(({ productId, size, quantity }) => ({ productId, size, quantity })),
  )

  const quantityInCart = (productId: number, size: number) =>
    items.value.find((i) => keyOf(i) === keyOf({ productId, size }))?.quantity ?? 0

  function add(product: Product, size: number) {
    const existing = items.value.find((i) => keyOf(i) === keyOf({ productId: product.id, size }))
    if (existing) {
      existing.quantity = Math.min(MAX_QUANTITY, existing.quantity + 1)
      return
    }
    items.value.push({
      productId: product.id,
      name: `${product.brand} ${product.name} ${product.colorway}`,
      color: product.color,
      size,
      quantity: 1,
      unitPrice: product.price,
    })
  }

  const clear = () => {
    items.value = []
  }

  return { items, count, total, canCheckout, payload, quantityInCart, add, clear }
}
