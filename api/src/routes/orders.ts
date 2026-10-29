import { Router } from 'express'
import { parse } from '../errors'
import { orderRequestSchema } from '../schemas'
import { createOrder } from '../services/orders'

export const ordersRouter = Router()

ordersRouter.post('/', async (req, res) => {
  const order = await createOrder(parse(orderRequestSchema, req.body))
  res.status(201).json(order)
})
