import { Router } from 'express'
import { notFound } from '../errors'
import { getProduct, getStock, listProducts } from '../services/catalog'

export const productsRouter = Router()

function productId(raw: string) {
  const id = Number(raw)
  if (!Number.isInteger(id) || id < 1) throw notFound('Produit introuvable')
  return id
}

productsRouter.get('/', async (_req, res) => {
  res.json({ products: await listProducts() })
})

productsRouter.get('/:id', async (req, res) => {
  res.json(await getProduct(productId(req.params.id)))
})

productsRouter.get('/:id/stock', async (req, res) => {
  res.json(await getStock(productId(req.params.id)))
})
