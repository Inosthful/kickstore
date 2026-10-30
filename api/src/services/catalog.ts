import type { Product as ProductResponse, StockResponse } from '@kickstore/shared/types'
import type { Product } from '@prisma/client'
import { prisma } from '../db'
import { notFound } from '../errors'

export const displayName = (p: Pick<Product, 'brand' | 'name' | 'colorway'>) =>
  `${p.brand} ${p.name} ${p.colorway}`

// la base stocke le modèle 3D à plat, le contrat l'expose en objet
export function toProduct(p: Product): ProductResponse {
  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    colorway: p.colorway,
    sku: p.sku,
    price: p.price,
    retailPrice: p.retailPrice,
    releaseDate: p.releaseDate.toISOString().slice(0, 10),
    model: {
      url: `/models/${p.modelSlug}.glb`,
      image: `/models/${p.modelSlug}.webp`,
      author: p.modelAuthor,
      authorUrl: p.modelAuthorUrl,
      source: p.modelSource,
      license: p.modelLicense,
    },
  }
}

export const listProducts = async () =>
  (await prisma.product.findMany({ orderBy: { id: 'asc' } })).map(toProduct)

export async function getProduct(id: number) {
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) throw notFound('Produit introuvable')
  return toProduct(product)
}

export async function getStock(productId: number): Promise<StockResponse> {
  if (!(await prisma.product.findUnique({ where: { id: productId } }))) throw notFound('Produit introuvable')
  const rows = await prisma.stock.findMany({ where: { productId }, orderBy: { size: 'asc' } })
  return { sizes: rows.map(({ size, quantity }) => ({ size, stock: quantity })) }
}
