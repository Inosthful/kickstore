import type { CartLine, CartValidation } from '@kickstore/shared/types'
import { prisma } from '../db'
import type { CartLineInput } from '../schemas'
import { displayName } from './catalog'
import { mergeLines } from './lines'

export async function validateCart(input: CartLineInput[]): Promise<CartValidation> {
  const lines = mergeLines(input)
  const products = await prisma.product.findMany({
    where: { id: { in: lines.map((l) => l.productId) } },
    include: { stocks: true },
  })
  const byId = new Map(products.map((p) => [p.id, p]))

  const items = lines.map((line): CartLine => {
    const product = byId.get(line.productId)
    if (!product) {
      return { ...line, name: '', unitPrice: 0, lineTotal: 0, stock: 0, status: 'unavailable' }
    }

    const stock = product.stocks.find((s) => s.size === line.size)?.quantity ?? 0
    return {
      ...line,
      name: displayName(product),
      unitPrice: product.price,
      lineTotal: product.price * line.quantity,
      stock,
      status: stock >= line.quantity ? 'ok' : 'insufficient_stock',
    }
  })

  return {
    items,
    total: items.reduce((sum, item) => sum + item.lineTotal, 0),
    valid: items.every((item) => item.status === 'ok'),
  }
}
