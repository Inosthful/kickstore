import { resolve } from 'node:path'

export const config = {
  port: Number(process.env.PORT ?? 3000),
  frontUrl: process.env.FRONT_URL ?? 'http://localhost:5173',
  openapiPath: resolve(import.meta.dirname, '../../contracts/openapi.yaml'),
}
