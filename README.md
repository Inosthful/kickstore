# KickStore

Projet du TP « Coordination Front / Back ». C'est un mini site de sneakers façon StockX : on choisit sa pointure, on remplit son panier et on valide sa commande, avec un stock vérifié par le serveur.

Le compte-rendu (user stories, points de synchro, DoD, MoSCoW) est dans [docs/compte-rendu.md](docs/compte-rendu.md) et le board du sprint est ici : [KickStore · coordination Front / Back](https://github.com/users/Inosthful/projects/2).

## Organisation

C'est un mono-repo (workspaces npm) :

```
api/                 API Express en TypeScript, Prisma sur SQLite
client/              front Vue 3 + Vite
shared/types/        types TypeScript générés depuis le contrat, utilisés par l'api et le client
contracts/           le contrat d'API (openapi.yaml), écrit avant le code
.github/workflows/   CI (lint du contrat, tests de l'api, build du client) et CD (images Docker)
docker-compose.yml   api + client, et le mock Prism en option
docs/                compte-rendu du TP
```

Le front et le back ne se parlent qu'à travers le contrat. `npm run types` régénère `shared/types` depuis `contracts/openapi.yaml`, et l'api comme le client typent leurs réponses avec ces types : si le contrat change sans qu'un des deux côtés suive, il ne compile plus. La CI vérifie aussi que les types partagés sont à jour avec le contrat.

## Lancer le projet

Le plus simple, avec Docker :

```bash
docker compose up --build
```

Le client est sur http://localhost:8080 et l'api sur http://localhost:3000 (la doc Swagger du contrat est sur `/docs`). La base est recréée avec les données de démo à chaque démarrage.

Sans Docker, on installe tout depuis la racine :

```bash
npm install
cp api/.env.example api/.env
cp client/.env.example client/.env
npm run db:push -w api
npm run db:seed -w api
```

Puis dans deux terminaux :

```bash
npm run dev:api
```

```bash
npm run dev:client
```

## Travailler sans le back (mock Prism)

Le front peut tourner sur un mock généré depuis le contrat, sans lancer le back. Dans deux terminaux :

```bash
npm run mock
```

```bash
npm run dev:mock -w client
```

Sur le mock, ajouter `?prefer=409` (ou `?prefer=400`) à l'URL de la page de commande force la réponse d'erreur correspondante. Pour revenir sur le vrai back, il suffit de relancer `npm run dev:client`. Le détail de la bascule est dans la section 8 du compte-rendu.

## Tests et CI

```bash
npm test
```

Les tests tournent sur une base SQLite à part. Ils vérifient les réponses 201 / 400 / 409, que la transaction annule tout si une seule paire manque, et que trois commandes simultanées sur la dernière paire n'en laissent passer qu'une.

On travaille en GitHub Flow : une branche `feature/...` par US, une pull request vers `main`, et on merge en squash seulement quand la CI est verte. Une fois sur `main`, la CD construit les images Docker de l'api et du client et les publie sur le registre GitHub (`ghcr.io/inosthful/kickstore-api` et `kickstore-client`).
