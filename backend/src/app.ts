import { readFileSync } from 'node:fs'
import cors from 'cors'
import express from 'express'
import swaggerUi from 'swagger-ui-express'
import { parse as parseYaml } from 'yaml'
import { config } from './config'
import { errorHandler, notFound } from './errors'
import { cartRouter } from './routes/cart'
import { ordersRouter } from './routes/orders'
import { productsRouter } from './routes/products'

export function createApp() {
  const app = express()

  app.use(cors({ origin: config.frontUrl }))
  app.use(express.json())

  const spec = parseYaml(readFileSync(config.openapiPath, 'utf8'))
  app.get('/', (_req, res) => res.redirect('/docs'))
  app.get('/openapi.yaml', (_req, res) => res.sendFile(config.openapiPath))
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec, { customSiteTitle: 'KickStore API' }))

  app.use('/api/products', productsRouter)
  app.use('/api/cart', cartRouter)
  app.use('/api/orders', ordersRouter)

  app.use((_req, _res, next) => next(notFound('Route introuvable')))
  app.use(errorHandler)

  return app
}
