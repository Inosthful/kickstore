import { z } from 'zod'

export const MAX_QUANTITY = 5

const text = z.string().trim().min(1, 'Champ requis')

const cartLine = z.object({
  productId: z.int().positive(),
  size: z.number().positive(),
  quantity: z.int().min(1).max(MAX_QUANTITY),
})

const lines = z.array(cartLine).min(1, 'Panier vide').max(20)

export const orderRequestSchema = z.object({
  customer: z.object({
    firstName: text,
    lastName: text,
    email: z.email('Email invalide'),
  }),
  address: z.object({
    street: text,
    postalCode: z.string().regex(/^\d{5}$/, 'Code postal invalide'),
    city: text,
  }),
  items: lines,
})

export type CartLineInput = z.infer<typeof cartLine>
export type OrderRequest = z.infer<typeof orderRequestSchema>
