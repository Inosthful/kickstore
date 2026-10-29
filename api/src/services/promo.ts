import type { Promo } from '@kickstore/shared/types'
import { prisma } from '../db'

export async function checkPromo(code: string): Promise<Promo> {
  const promo = await prisma.promoCode.findUnique({ where: { code } })
  if (!promo) return { code, status: 'invalid' }
  if (promo.expiresAt && promo.expiresAt < new Date()) return { code, status: 'expired' }
  return { code, status: 'applied', percent: promo.percent }
}

export const discountFor = (subtotal: number, promo?: Promo) =>
  promo?.status === 'applied' && promo.percent ? Math.round((subtotal * promo.percent) / 100) : 0
