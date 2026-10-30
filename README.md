# KickStore

Projet du TP « Coordination Front / Back ». C'est un mini site de sneakers façon StockX : on choisit sa pointure, on remplit son panier et on valide sa commande, avec un stock vérifié par le serveur. Depuis la séquence 4, chaque paire est un vrai modèle 3D qu'on peut faire tourner (three.js), avec les prix et coloris relevés sur StockX.

Le compte-rendu (user stories, points de synchro, DoD, MoSCoW) est dans [docs/compte-rendu.md](docs/compte-rendu.md) et le board du sprint est ici : [KickStore · coordination Front / Back](https://github.com/users/Inosthful/projects/2).

## Organisation

C'est un mono-repo (workspaces npm) :

```
openapi.yaml         le contrat d'API, écrit avant le code
api/                 API Express en TypeScript, Prisma sur SQLite
client/              front Vue 3 + Vite, viewer three.js dans client/src/three
client/public/models les 15 modèles 3D (glb compressés) et leurs vignettes
client/tools/        script d'ajout d'un modèle (optimisation + crédit)
shared/types/        types TypeScript générés depuis le contrat, utilisés par l'api et le client
.github/workflows/   CI (lint du contrat, tests de l'api, build du client) et CD (images Docker)
docker-compose.yml   api + client, et le mock Prism en option
docs/                compte-rendu du TP
```

Le front et le back ne se parlent qu'à travers le contrat. `npm run types` régénère `shared/types` depuis `openapi.yaml`, et l'api comme le client typent leurs réponses avec ces types : si le contrat change sans qu'un des deux côtés suive, il ne compile plus. La CI vérifie aussi que les types partagés sont à jour avec le contrat.

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

Sur le mock, ajouter `?prefer=409` (ou `?prefer=400`) à l'URL de la page de commande force la réponse d'erreur correspondante. Pour revenir sur le vrai back, il suffit de relancer `npm run dev:client`. Codes promo de la base de démo : `KICK10` (-10 %) et `ETE20` (expiré). Le détail de la bascule est dans la section 8 du compte-rendu.

## Modèles 3D

Les paires viennent de Sketchfab, en licence Creative Commons Attribution (l'auteur est cité sur la fiche de chaque paire et dans la réponse de l'API, champ `model`). Pour ajouter une paire :

1. télécharger le modèle sur Sketchfab au format glTF (il faut un compte) et dézipper ;
2. `npm run model:add <dossier> <slug>` : conversion des matériaux en metal/roughness (three.js ne lit plus l'extension specular/glossiness de Sketchfab), compression Draco, textures WebP 2048, écriture de `client/public/models/<slug>.glb` et du crédit dans `credits.json` ;
3. en dev, ouvrir `http://localhost:5173/lab?model=<slug>` pour vérifier le cadrage, puis `/lab?thumbs=1` pour rendre les vignettes WebP (une scène WebGL rend chaque paire, le serveur Vite écrit les fichiers) ;
4. ajouter la paire dans `api/prisma/seed.ts` avec ses infos StockX.

Le viewer oriente chaque modèle tout seul (axe long sur X, col à l'arrière, posé au sol) parce que les fichiers Sketchfab arrivent dans tous les sens, parfois avec les deux chaussures de la paire.

## Tests et CI

```bash
npm test
```

Les tests tournent sur une base SQLite à part. Ils vérifient les réponses 201 / 400 / 409, que la transaction annule tout si une seule paire manque, que trois commandes simultanées sur la dernière paire n'en laissent passer qu'une, et le calcul des codes promo.

On travaille en GitHub Flow : une branche `feature/...` par US, une pull request vers `main`, et on merge en squash seulement quand la CI est verte. Une fois sur `main`, la CD construit les images Docker de l'api et du client et les publie sur le registre GitHub (`ghcr.io/inosthful/kickstore-api` et `kickstore-client`).
