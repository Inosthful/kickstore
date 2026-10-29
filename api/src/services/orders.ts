import type { Order as OrderResponse, StockConflict } from '@kickstore/shared/types'
import type { Order, OrderItem, Product } from '@prisma/client'
import { prisma } from '../db'
import { HttpError, outOfStock } from '../errors'
import type { OrderRequest } from '../schemas'
import { displayName } from './catalog'
import { mergeLines } from './lines'
import { checkPromo, discountFor } from './promo'

type OrderWithItems = Order & { items: (OrderItem & { product: Product })[] }

export async function createOrder({ customer, address, items, promoCode }: OrderRequest) {
  const lines = mergeLines(items)
  const promo = promoCode ? await checkPromo(promoCode) : undefined

  if (promo && promo.status !== 'applied') {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Données invalides', {
      issues: [{ path: 'promoCode', message: promo.status === 'expired' ? 'Code promo expiré' : 'Code promo inconnu' }],
    })
  }

  const order = await prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({
      where: { id: { in: lines.map((l) => l.productId) } },
    })
    const prices = new Map(products.map((p) => [p.id, p.price]))
    const conflicts: StockConflict[] = []

    for (const line of lines) {
      const { count } = prices.has(line.productId)
        ? await tx.stock.updateMany({
            where: { productId: line.productId, size: line.size, quantity: { gte: line.quantity } },
            data: { quantity: { decrement: line.quantity } },
          })
        : { count: 0 }

      if (count === 0) {
        const current = await tx.stock.findUnique({
          where: { productId_size: { productId: line.productId, size: line.size } },
        })
        conflicts.push({
          productId: line.productId,
          size: line.size,
          requested: line.quantity,
          available: current?.quantity ?? 0,
        })
      }
    }

    if (conflicts.length > 0) throw outOfStock(conflicts)

    const subtotal = lines.reduce((sum, l) => sum + prices.get(l.productId)! * l.quantity, 0)
    const discount = discountFor(subtotal, promo)

    return tx.order.create({
      data: {
        ...customer,
        ...address,
        total: subtotal - discount,
        discount,
        promoCode: promo?.code,
        items: {
          create: lines.map((l) => ({ ...l, unitPrice: prices.get(l.productId)! })),
        },
      },
      include: { items: { include: { product: true } } },
    })
  })

  return toOrderResponse(order)
}

function toOrderResponse(order: OrderWithItems): OrderResponse {
  return {
    id: order.id,
    status: 'confirmed',
    subtotal: order.total + order.discount,
    discount: order.discount,
    total: order.total,
    promoCode: order.promoCode ?? undefined,
    customer: { firstName: order.firstName, lastName: order.lastName, email: order.email },
    address: { street: order.street, postalCode: order.postalCode, city: order.city },
    items: order.items.map((item) => ({
      productId: item.productId,
      name: displayName(item.product),
      size: item.size,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.unitPrice * item.quantity,
    })),
    createdAt: order.createdAt.toISOString(),
  }
}
