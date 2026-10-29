import type { Order } from '@/api/client'

const KEY = 'kickstore.lastOrder'

export function saveLastOrder(order: Order) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(order))
  } catch {}
}

export function readLastOrder(): Order | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Order) : null
  } catch {
    return null
  }
}
