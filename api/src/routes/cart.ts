import { Router } from 'express'
import { parse } from '../errors'
import { cartRequestSchema } from '../schemas'
import { validateCart } from '../services/cart'

export const cartRouter = Router()

cartRouter.post('/validate', async (req, res) => {
  const { items, promoCode } = parse(cartRequestSchema, req.body)
  res.json(await validateCart(items, promoCode))
})
