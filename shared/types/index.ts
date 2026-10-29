// types générés depuis contracts/openapi.yaml (npm run types à la racine)
import type { components } from './api'

type Schemas = components['schemas']

export type Product = Schemas['Product']
export type StockSize = Schemas['StockSize']
export type StockResponse = Schemas['StockResponse']
export type CartLineInput = Schemas['CartLineInput']
export type CartRequest = Schemas['CartRequest']
export type CartLine = Schemas['CartLine']
export type CartValidation = Schemas['CartValidation']
export type Promo = Schemas['Promo']
export type OrderRequest = Schemas['OrderRequest']
export type Order = Schemas['Order']
export type StockConflict = Schemas['StockConflict']
export type ApiErrorBody = Schemas['Error']
