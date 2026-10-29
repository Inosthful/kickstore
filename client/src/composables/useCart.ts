import { computed, ref, watch } from 'vue'
import { api, type CartLine, type Product, type Promo } from '@/api/client'

export interface CartItem {
  productId: number
  name: string
  color: string
  size: number
  quantity: number
  unitPrice: number
}

export const MAX_QUANTITY = 5
const STORAGE_KEY = 'kickstore.cart'
const PROMO_KEY = 'kickstore.promo'

const keyOf = (item: { productId: number; size: number }) => `${item.productId}:${item.size}`
const clamp = (quantity: number) => Math.min(MAX_QUANTITY, Math.max(1, quantity))

function load(): CartItem[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((i) => Number.isInteger(i?.productId) && typeof i.size === 'number' && Number.isInteger(i.quantity))
      .map((i) => ({ ...i, quantity: clamp(i.quantity) }))
  } catch {
    return []
  }
}

const items = ref<CartItem[]>(load())
const promoCode = ref(localStorage.getItem(PROMO_KEY) ?? '')
const promo = ref<Promo | null>(null)
const discount = ref(0)
const lines = ref<Record<string, CartLine>>({})
const validating = ref(items.value.length > 0)
const validationFailed = ref(false)
const isOpen = ref(false)

let lastRequest = 0
let timer: ReturnType<typeof setTimeout>

async function revalidate() {
  clearTimeout(timer)

  if (items.value.length === 0) {
    lines.value = {}
    promo.value = null
    discount.value = 0
    validating.value = false
    validationFailed.value = false
    return
  }

  const request = ++lastRequest
  validating.value = true

  try {
    const result = await api.validateCart(
      items.value.map(({ productId, size, quantity }) => ({ productId, size, quantity })),
      promoCode.value || undefined,
    )
    if (request !== lastRequest) return

    promo.value = result.promo ?? null
    discount.value = result.discount
    lines.value = Object.fromEntries(result.items.map((line) => [keyOf(line), line]))
    for (const item of items.value) {
      const line = lines.value[keyOf(item)]
      if (line && line.status !== 'unavailable') {
        item.unitPrice = line.unitPrice
        item.name = line.name
      }
    }
    validationFailed.value = false
  } catch {
    if (request === lastRequest) validationFailed.value = true
  } finally {
    if (request === lastRequest) validating.value = false
  }
}

watch(items, () => localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value)), { deep: true })
watch(promoCode, (code) => {
  if (code) localStorage.setItem(PROMO_KEY, code)
  else localStorage.removeItem(PROMO_KEY)
  revalidate()
})

watch(
  () => items.value.map((i) => `${keyOf(i)}x${i.quantity}`).join(),
  () => {
    clearTimeout(timer)
    validating.value = items.value.length > 0
    timer = setTimeout(revalidate, 250)
  },
)

watch(isOpen, (open) => {
  if (open) revalidate()
})

revalidate()

export function useCart() {
  const count = computed(() => items.value.reduce((n, i) => n + i.quantity, 0))
  const subtotal = computed(() => items.value.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0))
  const total = computed(() => subtotal.value - discount.value)
  const appliedCode = computed(() => (promo.value?.status === 'applied' ? promo.value.code : undefined))
  const hasIssues = computed(() => items.value.some((i) => lines.value[keyOf(i)]?.status !== 'ok'))
  const canCheckout = computed(
    () => items.value.length > 0 && !validating.value && !validationFailed.value && !hasIssues.value,
  )
  const payload = computed(() =>
    items.value.map(({ productId, size, quantity }) => ({ productId, size, quantity })),
  )

  const lineFor = (item: CartItem) => lines.value[keyOf(item)]

  const maxFor = (item: CartItem) => {
    const line = lineFor(item)
    return line ? Math.min(MAX_QUANTITY, line.stock) : MAX_QUANTITY
  }

  const quantityInCart = (productId: number, size: number) =>
    items.value.find((i) => keyOf(i) === keyOf({ productId, size }))?.quantity ?? 0

  function add(product: Product, size: number) {
    const existing = items.value.find((i) => keyOf(i) === keyOf({ productId: product.id, size }))
    if (existing) {
      existing.quantity = clamp(existing.quantity + 1)
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

  const setQuantity = (item: CartItem, quantity: number) => {
    item.quantity = clamp(quantity)
  }

  const remove = (item: CartItem) => {
    items.value = items.value.filter((i) => i !== item)
  }

  const clear = () => {
    items.value = []
    promoCode.value = ''
  }

  const applyPromo = (code: string) => {
    const next = code.trim().toUpperCase()
    if (next === promoCode.value) revalidate()
    else promoCode.value = next
  }

  return {
    items,
    isOpen,
    validating,
    validationFailed,
    count,
    subtotal,
    discount,
    total,
    promo,
    promoCode,
    appliedCode,
    hasIssues,
    canCheckout,
    payload,
    lineFor,
    maxFor,
    quantityInCart,
    add,
    setQuantity,
    remove,
    clear,
    applyPromo,
    removePromo: () => applyPromo(''),
    revalidate,
    open: () => (isOpen.value = true),
    close: () => (isOpen.value = false),
  }
}
