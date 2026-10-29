FROM node:24-slim AS build

WORKDIR /app
COPY package.json package-lock.json ./
COPY api/package.json api/
COPY client/package.json client/
COPY shared/package.json shared/
RUN npm ci -w client

COPY shared shared
COPY client client

ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build -w client

FROM nginx:1.29-alpine
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/client/dist /usr/share/nginx/html
