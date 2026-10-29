import type { StockResponse } from '@kickstore/shared/types'
import type { Product } from '@prisma/client'
import { prisma } from '../db'
import { notFound } from '../errors'

export const displayName = (p: Pick<Product, 'brand' | 'name' | 'colorway'>) =>
  `${p.brand} ${p.name} ${p.colorway}`

export const listProducts = () => prisma.product.findMany({ orderBy: { id: 'asc' } })

export async function getProduct(id: number) {
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) throw notFound('Produit introuvable')
  return product
}

export async function getStock(productId: number): Promise<StockResponse> {
  await getProduct(productId)
  const rows = await prisma.stock.findMany({ where: { productId }, orderBy: { size: 'asc' } })
  return { sizes: rows.map(({ size, quantity }) => ({ size, stock: quantity })) }
}
