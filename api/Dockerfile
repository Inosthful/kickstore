FROM node:24-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json ./
COPY api/package.json api/
COPY client/package.json client/
COPY shared/package.json shared/
RUN npm ci -w api

COPY shared shared
COPY openapi.yaml ./
COPY api api

WORKDIR /app/api
RUN npx prisma generate

ENV DATABASE_URL=file:./kickstore.db
EXPOSE 3000

# base recréée et remplie à chaque démarrage, c'est une démo
CMD ["sh", "-c", "npx prisma db push --skip-generate && npm run db:seed && npm start"]
