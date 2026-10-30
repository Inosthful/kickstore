import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const sizes = [40, 41, 42, 42.5, 43, 44, 45]

// Prix et infos relevés sur StockX le 30/10/2026 (price = dernière vente en euros,
// retailPrice = prix de sortie en dollars, en centimes). Les modèles 3D viennent de
// Sketchfab en licence CC-BY, le crédit est gardé avec chaque paire.
const catalog = [
  {
    brand: 'Jordan', name: '4 Retro', colorway: 'University Blue', sku: 'CT8527-400',
    price: 53100, retailPrice: 20000, releaseDate: new Date('2021-04-28'),
    stock: [2, 4, 3, 1, 4, 0, 2],
    model: { slug: 'jordan-4-university-blue', author: "ShoesPlug", authorUrl: 'https://sketchfab.com/ShoesPlug', source: 'https://sketchfab.com/3d-models/jordan-4-retro-university-blue-68f32cad08544592aafd56a1ac7c60bc', license: 'CC-BY-4.0' },
  },
  {
    brand: 'Jordan', name: '4 Retro', colorway: 'Military Black', sku: 'DH6927-111',
    price: 44500, retailPrice: 21000, releaseDate: new Date('2022-05-21'),
    stock: [3, 5, 6, 2, 4, 3, 1],
    model: { slug: 'jordan-4-military-black', author: "ShoesPlug", authorUrl: 'https://sketchfab.com/ShoesPlug', source: 'https://sketchfab.com/3d-models/jordan-4-retro-military-black-1a9b3e3407d443388b9022e758d757b3', license: 'CC-BY-4.0' },
  },
  {
    brand: 'Jordan', name: '1 Retro High OG', colorway: 'Chicago Lost and Found', sku: 'DZ5485-612',
    price: 41200, retailPrice: 18000, releaseDate: new Date('2022-11-19'),
    stock: [1, 2, 2, 0, 3, 1, 0],
    model: { slug: 'jordan-1-chicago-lost-and-found', author: "SRUSH651 2th☑", authorUrl: 'https://sketchfab.com/THE-OFFICIAL-SRUSH651', source: 'https://sketchfab.com/3d-models/jordan-1-og-high-chicago-lost-and-found-98242ba7e53b4dab954eb56a7964d1f5', license: 'CC-BY-4.0' },
  },
  {
    brand: 'Jordan', name: '1 Retro High', colorway: 'Off-White Chicago', sku: 'AA3834-101',
    price: 510500, retailPrice: 19000, releaseDate: new Date('2017-11-09'),
    stock: [0, 1, 0, 0, 1, 0, 0],
    model: { slug: 'jordan-1-off-white-chicago', author: "SRUSH651 2th☑", authorUrl: 'https://sketchfab.com/THE-OFFICIAL-SRUSH651', source: 'https://sketchfab.com/3d-models/air-jordan-1-off-white-chicago-bb17faf8188148369ae4a535c0af863c', license: 'CC-BY-4.0' },
  },
  {
    brand: 'Jordan', name: '1 Retro High OG SP', colorway: 'Travis Scott Mocha', sku: 'CD4487-100',
    price: 136600, retailPrice: 17500, releaseDate: new Date('2019-05-11'),
    stock: [0, 0, 1, 0, 1, 1, 0],
    model: { slug: 'jordan-1-travis-scott', author: "SRUSH651 2th☑", authorUrl: 'https://sketchfab.com/THE-OFFICIAL-SRUSH651', source: 'https://sketchfab.com/3d-models/air-jordan-1-og-high-travis-scott-e0e456247b4642aa85d9c4c2d859bcca', license: 'CC-BY-4.0' },
  },
  {
    brand: 'Jordan', name: '3 Retro', colorway: 'Black Cement (2018)', sku: '854262-001',
    price: 33200, retailPrice: 20000, releaseDate: new Date('2018-02-17'),
    stock: [2, 3, 4, 1, 2, 2, 1],
    model: { slug: 'jordan-3-black-cement', author: "SRUSH651 2th☑", authorUrl: 'https://sketchfab.com/THE-OFFICIAL-SRUSH651', source: 'https://sketchfab.com/3d-models/2018-jordan-3-black-cement-1432d0a751da490798598198f9e135da', license: 'CC-BY-4.0' },
  },
  {
    brand: 'Jordan', name: '11 Retro', colorway: 'Jubilee 25th Anniversary', sku: 'CT8012-011',
    price: 44300, retailPrice: 22000, releaseDate: new Date('2020-12-12'),
    stock: [1, 2, 3, 2, 2, 1, 1],
    model: { slug: 'jordan-11-jubilee', author: "SRUSH651 2th☑", authorUrl: 'https://sketchfab.com/THE-OFFICIAL-SRUSH651', source: 'https://sketchfab.com/3d-models/jordan-11-jubilee-ea049a35918448ceaa276270f76adb67', license: 'CC-BY-4.0' },
  },
  {
    brand: 'Nike', name: 'Dunk Low', colorway: 'White Midnight Navy', sku: 'HF5441-107',
    price: 12600, retailPrice: 11500, releaseDate: new Date('2025-01-01'),
    stock: [6, 8, 9, 4, 7, 5, 3],
    model: { slug: 'dunk-low-midnight-navy', author: "xFaMouZ7", authorUrl: 'https://sketchfab.com/xFaMouZ7', source: 'https://sketchfab.com/3d-models/nike-dunk-low-midnight-navy-1d5d550ad3754f1aad9201999c7af8b2', license: 'CC-BY-4.0' },
  },
  {
    brand: 'Nike', name: 'SB Dunk Low', colorway: 'Travis Scott', sku: 'CT5053-001',
    price: 195200, retailPrice: 15000, releaseDate: new Date('2020-02-29'),
    stock: [0, 0, 0, 0, 0, 0, 0],
    model: { slug: 'sb-dunk-low-travis-scott', author: "SRUSH651 2th☑", authorUrl: 'https://sketchfab.com/THE-OFFICIAL-SRUSH651', source: 'https://sketchfab.com/3d-models/nike-dunk-sb-low-travis-scott-29349083109e4d42b4ede8cfa8c8e176', license: 'CC-BY-4.0' },
  },
  {
    brand: 'adidas', name: 'Yeezy Boost 350 V2', colorway: 'Zyon', sku: 'FZ1267',
    price: 22300, retailPrice: 22000, releaseDate: new Date('2020-07-18'),
    stock: [4, 5, 6, 3, 5, 2, 2],
    model: { slug: 'yeezy-350-v2-zyon', author: "veryveig", authorUrl: 'https://sketchfab.com/veryveig', source: 'https://sketchfab.com/3d-models/adidas-yeezy-boost-350-v2-zyon-8b69acdf36e048ae8072e20ed5e4c5eb', license: 'CC-BY-4.0' },
  },
  {
    brand: 'Nike', name: 'Air Max 90', colorway: 'Infrared (2020)', sku: 'CT1685-100',
    price: 29100, retailPrice: 14000, releaseDate: new Date('2020-11-09'),
    stock: [2, 4, 5, 2, 3, 2, 1],
    model: { slug: 'air-max-90', author: "Thomson 🚀", authorUrl: 'https://sketchfab.com/thomson159', source: 'https://sketchfab.com/3d-models/nike-air-max-90-ce4a4e5847b34cd6b4ed0ecf134f556d', license: 'CC-BY-4.0' },
  },
  {
    brand: 'Converse', name: 'Chuck Taylor All Star 70 Hi', colorway: 'Black', sku: '156701C',
    price: 8600, retailPrice: 15000, releaseDate: new Date('2013-09-01'),
    stock: [8, 10, 12, 5, 9, 6, 4],
    model: { slug: 'chuck-taylor-high', author: "SRUSH651 2th☑ surreal rush", authorUrl: 'https://sketchfab.com/THE-OFFICIAL-SRUSH651', source: 'https://sketchfab.com/3d-models/converse-chuck-taylor-all-star-high-blackwhite-6af4fb59491740cb9b3a6361f4fdb019', license: 'CC-BY-4.0' },
  },
  {
    brand: 'Vans', name: 'Old Skool', colorway: 'Navy White', sku: 'VN000D3HNVY',
    price: 11100, retailPrice: 7000, releaseDate: new Date('2000-01-01'),
    stock: [7, 9, 10, 4, 8, 5, 3],
    model: { slug: 'vans-old-skool-navy', author: "Lassi Kaukonen", authorUrl: 'https://sketchfab.com/thesidekick', source: 'https://sketchfab.com/3d-models/vans-old-skool-navy-56fe2cca128e4ab39d3a6412788671a5', license: 'CC-BY-4.0' },
  },
  {
    brand: 'New Balance', name: '2002R', colorway: 'Salehe Bembury Peace Be The Journey', sku: 'ML2002R1',
    price: 68900, retailPrice: 15000, releaseDate: new Date('2020-10-23'),
    stock: [1, 1, 2, 0, 2, 1, 0],
    model: { slug: 'new-balance-2002r-salehe-bembury', author: "SRUSH651 2th☑ surreal rush", authorUrl: 'https://sketchfab.com/THE-OFFICIAL-SRUSH651', source: 'https://sketchfab.com/3d-models/new-balance-2002r-salehe-bembury-7c3ce89ec03b44acbad8b03135538c08', license: 'CC-BY-4.0' },
  },
  {
    brand: 'New Balance', name: '997 Made in USA', colorway: 'Grey Orange', sku: 'M997PT',
    price: 24300, retailPrice: 17000, releaseDate: new Date('2020-10-06'),
    stock: [3, 4, 4, 2, 3, 2, 2],
    model: { slug: 'new-balance-997', author: "Isaiah", authorUrl: 'https://sketchfab.com/aizaisia', source: 'https://sketchfab.com/3d-models/new-balance-997-05e79a2dffbc4356bba7e0751fada08f', license: 'CC-BY-4.0' },
  },
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

  for (const { stock, model, ...product } of catalog) {
    await prisma.product.create({
      data: {
        ...product,
        modelSlug: model.slug,
        modelAuthor: model.author,
        modelAuthorUrl: model.authorUrl,
        modelSource: model.source,
        modelLicense: model.license,
        stocks: { create: sizes.map((size, i) => ({ size, quantity: stock[i] })) },
      },
    })
  }

  await prisma.promoCode.createMany({ data: promoCodes })

  console.log(`${catalog.length} produits et ${promoCodes.length} codes promo insérés`)
}

main().finally(() => prisma.$disconnect())
