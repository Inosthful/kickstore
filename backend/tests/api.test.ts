import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app'
import { prisma } from '../src/db'

const app = createApp()

const customer = { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' }
const address = { street: '1 rue des Sneakers', postalCode: '75011', city: 'Paris' }

let dunk: number
let samba: number

async function stockOf(productId: number, size: number) {
  const row = await prisma.stock.findUniqueOrThrow({ where: { productId_size: { productId, size } } })
  return row.quantity
}

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

describe('POST /api/orders', () => {
  it('crée la commande, décrémente le stock et enregistre les lignes', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        customer,
        address,
        items: [
          { productId: dunk, size: 42, quantity: 2 },
          { productId: samba, size: 40, quantity: 1 },
        ],
      })

    expect(res.status).toBe(201)
    expect(res.body.total).toBe(25000)
    expect(await stockOf(dunk, 42)).toBe(1)
    expect(await stockOf(samba, 40)).toBe(0)
    expect(await prisma.orderItem.count({ where: { orderId: res.body.id } })).toBe(2)
  })

  it('renvoie 400 avec le chemin des champs invalides', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        customer: { ...customer, email: 'pas-un-email' },
        address: { ...address, postalCode: '12' },
        items: [{ productId: dunk, size: 42, quantity: 1 }],
      })

    expect(res.status).toBe(400)
    expect(res.body.issues.map((i: { path: string }) => i.path)).toEqual([
      'customer.email',
      'address.postalCode',
    ])
    expect(await prisma.order.count()).toBe(0)
  })

  it('renvoie 409 et annule tout si une seule ligne est en rupture', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        customer,
        address,
        items: [
          { productId: dunk, size: 42, quantity: 1 },
          { productId: samba, size: 40, quantity: 2 },
        ],
      })

    expect(res.status).toBe(409)
    expect(res.body.code).toBe('OUT_OF_STOCK')
    expect(res.body.conflicts).toEqual([{ productId: samba, size: 40, requested: 2, available: 1 }])
    expect(await stockOf(dunk, 42)).toBe(3)
    expect(await prisma.order.count()).toBe(0)
  })

  it('ne vend la dernière paire qu\'à une seule commande simultanée', async () => {
    const send = () =>
      request(app)
        .post('/api/orders')
        .send({ customer, address, items: [{ productId: samba, size: 40, quantity: 1 }] })

    const results = await Promise.all([send(), send(), send()])
    const statuses = results.map((r) => r.status).sort()

    expect(statuses).toEqual([201, 409, 409])
    expect(await stockOf(samba, 40)).toBe(0)
    expect(await prisma.order.count()).toBe(1)
  })
})
