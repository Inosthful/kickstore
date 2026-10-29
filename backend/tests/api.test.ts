import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app'
import { prisma } from '../src/db'

const app = createApp()

let dunk: number
let samba: number

beforeEach(async () => {
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.stock.deleteMany()
  await prisma.product.deleteMany()

  const base = { colorway: 'Panda', color: '#111111' }
  const a = await prisma.product.create({
    data: {
      ...base, name: 'Dunk Low', brand: 'Nike', price: 10000,
      stocks: { create: [{ size: 42, quantity: 3 }, { size: 43, quantity: 0 }] },
    },
  })
  const b = await prisma.product.create({
    data: {
      ...base, name: 'Samba', brand: 'Adidas', price: 5000,
      stocks: { create: [{ size: 40, quantity: 1 }] },
    },
  })
  dunk = a.id
  samba = b.id
})

describe('GET /api/products/:id/stock', () => {
  it('renvoie les pointures triées avec leur stock', async () => {
    const res = await request(app).get(`/api/products/${dunk}/stock`)

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ sizes: [{ size: 42, stock: 3 }, { size: 43, stock: 0 }] })
  })

  it('renvoie 404 pour un produit inconnu', async () => {
    const res = await request(app).get('/api/products/9999/stock')

    expect(res.status).toBe(404)
    expect(res.body.code).toBe('NOT_FOUND')
  })
})
