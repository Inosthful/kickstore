import { prisma } from '../db'
import { notFound } from '../errors'

export const listProducts = () => prisma.product.findMany({ orderBy: { id: 'asc' } })

export async function getProduct(id: number) {
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) throw notFound('Produit introuvable')
  return product
}

export async function getStock(productId: number) {
  await getProduct(productId)
  const rows = await prisma.stock.findMany({ where: { productId }, orderBy: { size: 'asc' } })
  return { sizes: rows.map(({ size, quantity }) => ({ size, stock: quantity })) }
}
