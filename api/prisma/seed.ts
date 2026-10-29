import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const sizes = [40, 41, 42, 42.5, 43, 44, 45]

const catalog = [
  { name: 'Dunk Low', brand: 'Nike', colorway: 'Panda', color: '#1b1b1b', price: 12900, stock: [2, 5, 3, 1, 4, 0, 2] },
  { name: '1 High', brand: 'Jordan', colorway: 'Chicago', color: '#c8102e', price: 18900, stock: [0, 1, 1, 0, 2, 1, 0] },
  { name: 'Samba OG', brand: 'Adidas', colorway: 'Cloud White', color: '#e9e4d8', price: 11000, stock: [4, 6, 8, 3, 5, 2, 1] },
  { name: '550', brand: 'New Balance', colorway: 'White Green', color: '#2f7d4f', price: 13000, stock: [1, 0, 2, 0, 3, 3, 1] },
  { name: 'Gel-Kayano 14', brand: 'Asics', colorway: 'Cream Silver', color: '#a9afb8', price: 15000, stock: [0, 0, 0, 0, 0, 0, 0] },
  { name: 'Chuck 70 High', brand: 'Converse', colorway: 'Egret', color: '#f1ead7', price: 9500, stock: [7, 9, 10, 4, 6, 5, 3] },
]

const promoCodes = [
  { code: 'KICK10', percent: 10 },
  { code: 'ETE20', percent: 20, expiresAt: new Date('2026-09-01') },
]

async function main() {
  await prisma.promoCode.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.stock.deleteMany()
  await prisma.product.deleteMany()

  for (const { stock, ...product } of catalog) {
    await prisma.product.create({
      data: {
        ...product,
        stocks: { create: sizes.map((size, i) => ({ size, quantity: stock[i] })) },
      },
    })
  }

  await prisma.promoCode.createMany({ data: promoCodes })

  console.log(`${catalog.length} produits et ${promoCodes.length} codes promo insérés`)
}

main().finally(() => prisma.$disconnect())
