import type { CartLineInput } from '../schemas'

export function mergeLines(lines: CartLineInput[]): CartLineInput[] {
  const merged = new Map<string, CartLineInput>()

  for (const line of lines) {
    const key = `${line.productId}:${line.size}`
    const existing = merged.get(key)
    merged.set(key, existing ? { ...existing, quantity: existing.quantity + line.quantity } : line)
  }

  return [...merged.values()]
}
