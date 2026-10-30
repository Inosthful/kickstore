import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app'
import { prisma } from '../src/db'

const app = createApp()

const customer = { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' }

// champs communs aux produits de test (modèle 3D fictif)
const base = {
  sku: 'TEST-001',
  retailPrice: 10000,
  releaseDate: new Date('2024-01-01'),
  modelSlug: 'test',
  modelAuthor: 'Test',
  modelAuthorUrl: 'https://example.com',
  modelSource: 'https://example.com/test',
  modelLicense: 'CC-BY-4.0',
}
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

  const a = await prisma.product.create({
    data: {
      ...base, name: 'Dunk Low', brand: 'Nike', colorway: 'Panda', price: 10000,
      stocks: { create: [{ size: 42, quantity: 3 }, { size: 43, quantity: 0 }] },
    },
  })
  const b = await prisma.product.create({
    data: {
      ...base, name: 'Samba', brand: 'Adidas', colorway: 'Black', price: 5000,
      stocks: { create: [{ size: 40, quantity: 1 }] },
    },
  })
  dunk = a.id
  samba = b.id
})

describe('GET /api/products', () => {
  it('expose le produit avec son modèle 3D et son crédit', async () => {
    const res = await request(app).get(`/api/products/${dunk}`)

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      name: 'Dunk Low',
      sku: 'TEST-001',
      releaseDate: '2024-01-01',
      model: { url: '/models/test.glb', image: '/models/test.png', author: 'Test', license: 'CC-BY-4.0' },
    })
    expect(res.body.color).toBeUndefined()
  })
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

describe('POST /api/cart/validate', () => {
  it('recalcule le prix côté serveur et signale les ruptures', async () => {
    const res = await request(app)
      .post('/api/cart/validate')
      .send({
        items: [
          { productId: dunk, size: 42, quantity: 2 },
          { productId: dunk, size: 43, quantity: 1 },
          { productId: 9999, size: 42, quantity: 1 },
        ],
      })

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ subtotal: 30000, discount: 0, total: 30000 })
    expect(res.body.valid).toBe(false)
    expect(res.body.items.map((i: { status: string }) => i.status)).toEqual([
      'ok',
      'insufficient_stock',
      'unavailable',
    ])
  })

  it('refuse une quantité hors limites', async () => {
    const res = await request(app)
      .post('/api/cart/validate')
      .send({ items: [{ productId: dunk, size: 42, quantity: 99 }] })

    expect(res.status).toBe(400)
    expect(res.body.issues[0].path).toBe('items.0.quantity')
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

describe('code promo', () => {
  beforeEach(async () => {
    await prisma.promoCode.deleteMany()
    await prisma.promoCode.createMany({
      data: [
        { code: 'KICK10', percent: 10 },
        { code: 'ETE20', percent: 20, expiresAt: new Date('2020-01-01') },
      ],
    })
  })

  it('applique la remise dans le panier, quelle que soit la casse', async () => {
    const res = await request(app)
      .post('/api/cart/validate')
      .send({ items: [{ productId: dunk, size: 42, quantity: 2 }], promoCode: 'kick10' })

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      subtotal: 20000,
      discount: 2000,
      total: 18000,
      promo: { code: 'KICK10', status: 'applied', percent: 10 },
    })
  })

  it('ne bloque pas le panier avec un code expiré ou inconnu', async () => {
    for (const [code, status] of [['ETE20', 'expired'], ['NIMPORTE', 'invalid']]) {
      const res = await request(app)
        .post('/api/cart/validate')
        .send({ items: [{ productId: dunk, size: 42, quantity: 1 }], promoCode: code })

      expect(res.status).toBe(200)
      expect(res.body).toMatchObject({ discount: 0, total: 10000, valid: true, promo: { status } })
    }
  })

  it('enregistre la remise avec la commande', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ customer, address, items: [{ productId: dunk, size: 42, quantity: 1 }], promoCode: 'KICK10' })

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ subtotal: 10000, discount: 1000, total: 9000, promoCode: 'KICK10' })
    const order = await prisma.order.findUniqueOrThrow({ where: { id: res.body.id } })
    expect(order).toMatchObject({ total: 9000, discount: 1000, promoCode: 'KICK10' })
  })

  it('refuse la commande avec un code expiré sans toucher au stock', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ customer, address, items: [{ productId: dunk, size: 42, quantity: 1 }], promoCode: 'ETE20' })

    expect(res.status).toBe(400)
    expect(res.body.issues).toEqual([{ path: 'promoCode', message: 'Code promo expiré' }])
    expect(await stockOf(dunk, 42)).toBe(3)
    expect(await prisma.order.count()).toBe(0)
  })
})
