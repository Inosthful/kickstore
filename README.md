# KickStore

Projet du TP « Coordination Front / Back ». C'est un mini site de sneakers façon StockX : on choisit sa pointure, on remplit son panier et on valide sa commande, avec un stock vérifié par le serveur.

Le compte-rendu (user stories, points de synchro, DoD, MoSCoW) est dans [docs/compte-rendu.md](docs/compte-rendu.md) et le board du sprint est ici : [KickStore · coordination Front / Back](https://github.com/users/Inosthful/projects/2).

## Organisation

- `docs/openapi.yaml` : le contrat d'API, écrit avant le code
- `backend/` : API Express en TypeScript, Prisma sur SQLite
- `frontend/` : Vue 3 + Vite

Le front et le back sont deux projets séparés. Le front ne connaît le back qu'à travers le contrat : ses types TypeScript sont générés depuis `openapi.yaml` (`npm run api:types`), donc si le contrat change sans que le front suive, il ne compile plus.

## Lancer le projet

Le back, sur http://localhost:3000 (la doc Swagger du contrat est sur `/docs`) :

```bash
cd backend
npm install
cp .env.example .env
npm run db:push
npm run db:seed
npm run dev
```

Le front, sur http://localhost:5173 :

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Tests

```bash
cd backend
npm test
```

Les tests tournent sur une base SQLite à part. Ils vérifient les réponses 201 / 400 / 409, que la transaction annule tout si une seule paire manque, et que trois commandes simultanées sur la dernière paire n'en laissent passer qu'une.
