import type { components } from './schema'

type Schemas = components['schemas']

export type Product = Schemas['Product']
export type StockSize = Schemas['StockSize']
export type CartLine = Schemas['CartLine']
export type CartLineInput = Schemas['CartLineInput']
export type CartValidation = Schemas['CartValidation']
export type OrderRequest = Schemas['OrderRequest']
export type Order = Schemas['Order']
export type StockConflict = Schemas['StockConflict']
type ErrorBody = Partial<Schemas['Error']>

const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export class ApiError extends Error {
  readonly code: string
  readonly issues: NonNullable<ErrorBody['issues']>
  readonly conflicts: StockConflict[]

  constructor(
    readonly status: number,
    body: ErrorBody | null = null,
  ) {
    super(body?.message ?? 'Serveur injoignable')
    this.code = body?.code ?? 'NETWORK_ERROR'
    this.issues = body?.issues ?? []
    this.conflicts = body?.conflicts ?? []
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(baseUrl + path, init)
  } catch {
    throw new ApiError(0)
  }

  const body = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(res.status, body)
  return body as T
}

export const api = {
  listProducts: () => request<{ products: Product[] }>('/api/products').then((r) => r.products),
  getProduct: (id: number) => request<Product>(`/api/products/${id}`),
  getStock: (id: number) =>
    request<Schemas['StockResponse']>(`/api/products/${id}/stock`).then((r) => r.sizes),
}
