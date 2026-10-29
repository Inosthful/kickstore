import { prisma } from '../db'
import type { CartLineInput } from '../schemas'
import { displayName } from './catalog'
import { mergeLines } from './lines'

type LineStatus = 'ok' | 'insufficient_stock' | 'unavailable'

export async function validateCart(input: CartLineInput[]) {
  const lines = mergeLines(input)
  const products = await prisma.product.findMany({
    where: { id: { in: lines.map((l) => l.productId) } },
    include: { stocks: true },
  })
  const byId = new Map(products.map((p) => [p.id, p]))

  const items = lines.map((line) => {
    const product = byId.get(line.productId)
    if (!product) {
      const status: LineStatus = 'unavailable'
      return { ...line, name: '', unitPrice: 0, lineTotal: 0, stock: 0, status }
    }

    const stock = product.stocks.find((s) => s.size === line.size)?.quantity ?? 0
    const status: LineStatus = stock >= line.quantity ? 'ok' : 'insufficient_stock'
    return {
      ...line,
      name: displayName(product),
      unitPrice: product.price,
      lineTotal: product.price * line.quantity,
      stock,
      status,
    }
  })

  return {
    items,
    total: items.reduce((sum, item) => sum + item.lineTotal, 0),
    valid: items.every((item) => item.status === 'ok'),
  }
}
