# Compte-rendu : coordination Front / Back sur KickStore

TP Agilité, module 1 séquence 1.

## 1. Cadrage

KickStore est un site de sneakers inspiré de StockX, en version très simplifiée. J'ai choisi de travailler sur le flux d'achat parce que c'est là que le front et le back dépendent le plus l'un de l'autre : le front affiche un stock, le back le fait varier, et les deux doivent être d'accord à chaque étape.

La fonctionnalité en une phrase :

> Permettre à un acheteur de choisir sa pointure, d'ajouter la paire à son panier et de valider sa commande en s'assurant que le stock est réellement disponible.

J'ai fait le TP seul, donc j'ai tenu les deux rôles. Pour garder l'esprit de l'exercice, le front et le back sont deux projets séparés qui ne communiquent qu'à travers le contrat d'API (`docs/openapi.yaml`).

## 2. Cadre de travail : Scrum léger + board Kanban

En reprenant les trois questions du cours :

- le produit est en construction, il n'existe pas encore → Scrum ;
- j'ai besoin de jalons pour resynchroniser front et back (contrat validé avant de coder, recette croisée à la fin) → Scrum ;
- le périmètre est fixé par le TP, donc prévisible → Scrum.

J'ai donc fait un seul sprint qui couvre le périmètre du TP. Le suivi se fait sur un [board Kanban dans GitHub Projects](https://github.com/users/Inosthful/projects/2) (Backlog → À faire → En cours → Review → Terminé), avec un ticket par tâche FRONT, BACK ou SYNC. Chaque ticket reprend ses critères d'acceptation, son point de synchro et ses dépendances, et chaque US est fermée par une pull request. Les tickets SYNC passent toujours en premier : tant que le contrat n'est pas validé, les tâches front et back de la même US restent bloquées.

## 3. User stories

### US 1 : choix de la pointure (Must)

> En tant qu'acheteur, je veux voir les pointures disponibles d'une paire, afin de ne pas choisir une taille qui n'est plus en stock.

- **Front** : boutons de pointure avec trois états (sélectionné, grisé si stock à 0, chargement).
- **Back** : route `GET /api/products/:id/stock`, lecture de la table Stock.
- **Point de synchro** : le format de réponse `{ "sizes": [{ "size": 42, "stock": 3 }] }`. Le contrat fixe `size` et `stock` (et pas `pointure` / `quantity`), les demi-pointures en nombre (`42.5`) et le tri par pointure croissante.

Critères d'acceptation :

- les pointures s'affichent avec leur stock, triées ;
- une pointure à 0 est grisée et on ne peut pas la sélectionner ;
- pendant le chargement on voit un état d'attente, et si l'API ne répond pas un message avec « Réessayer ».

### US 2 : panier (Should)

> En tant qu'acheteur, je veux ajouter des paires à mon panier, changer les quantités ou en retirer, afin de voir le total avant de commander.

- **Front** : panier en drawer, sauvegarde dans le localStorage, calcul du total.
- **Back** : route `POST /api/cart/validate` qui recalcule les prix et vérifie le stock ligne par ligne.
- **Point de synchro** : la décision d'architecture. Le panier vit dans le navigateur, mais il est revalidé par le back avant la commande, et c'est le prix du serveur qui fait foi. Le contrat fixe aussi le statut de chaque ligne (`ok`, `insufficient_stock`, `unavailable`) et la limite de 5 paires par ligne.

Critères d'acceptation :

- ajouter, changer la quantité ou retirer une paire met à jour le total ;
- le panier est toujours là après un rechargement de la page ;
- si une ligne n'est plus disponible ou plus en quantité suffisante, elle est signalée et on ne peut pas passer commande.

### US 3 : validation de la commande (Must)

> En tant qu'acheteur, je veux valider ma commande avec mon adresse de livraison, afin d'être sûr que les paires me sont bien réservées.

- **Front** : formulaire de livraison, bouton « Valider » avec spinner, écran de confirmation ou message d'erreur.
- **Back** : route `POST /api/orders`, transaction en base qui revérifie puis décrémente le stock, génération du numéro de commande.
- **Point de synchro** : le corps de la requête et les codes HTTP.
  - Envoi : `{ customer: { firstName, lastName, email }, address: { street, postalCode, city }, items: [{ productId, size, quantity }] }`
  - `201` : la commande créée, avec son `id` et son `total`.
  - `400` : données invalides, `issues` donne le champ concerné (ex. `address.postalCode`).
  - `409` : stock épuisé entre-temps, `conflicts` donne les paires qui posent problème.

Critères d'acceptation :

- un formulaire invalide renvoie une 400 et le message s'affiche sous le bon champ ;
- avec du stock, la commande est créée (201), le stock baisse en base et on arrive sur l'écran de confirmation ;
- si quelqu'un a pris la dernière paire entre-temps, on reçoit une 409, un message explique quelle paire manque, et rien n'est enregistré.

### US 4 : code promo (Could, pas fait)

> En tant qu'acheteur, je veux saisir un code promo, afin d'obtenir une réduction sur ma commande.

Restée dans le backlog. Le point de synchro à trancher avant de la commencer : est-ce que la remise est calculée par `POST /api/cart/validate`, par `POST /api/orders`, ou par les deux ?

## 4. Priorisation (MoSCoW)

- **Must** : base de données minimale (Product, Stock, Order), US 1, US 3.
- **Should** : US 2.
- **Could** : US 4, code promo.
- **Won't** : paiement réel (Stripe / PayPal), compte client, historique des commandes.

L'ordre de réalisation a suivi cette priorité : contrat, base, US 1, US 3, puis US 2. Pour l'US 3, j'ai d'abord fait un panier minimal en mémoire, que l'US 2 a ensuite complété.

## 5. Definition of Done

Une US est terminée seulement si :

1. le contrat d'API a été validé côté front et côté back avant d'écrire le code ;
2. la route back est testée (tests d'intégration + appels à la main) : elle renvoie les bons codes HTTP et les données sont bien enregistrées en base ;
3. le front gère tous les cas : chargement, succès, erreur réseau, rupture de stock ;
4. les cas d'erreur sont gérés côté serveur et côté interface ;
5. l'affichage est vérifié sur desktop et sur mobile ;
6. la recette est faite avec le front branché sur le vrai back, sans données fictives.

Signé : Enzo Martinez (Front) · Enzo Martinez (Back)

## 6. Les trois règles de synchro à retenir

- se mettre d'accord sur le nom des champs JSON avant de coder ;
- fixer les codes d'erreur ensemble (400 pour des données invalides, 409 pour un conflit de stock) ;
- ne jamais changer la structure d'une réponse sans prévenir l'autre côté : chez moi, modifier `openapi.yaml` régénère les types du front, donc le front ne compile plus tant qu'il ne suit pas.

## 7. Debrief

- **Le plus dur à découper** : l'US 3 dépend en partie du panier de l'US 2. J'ai fait un panier minimal pour pouvoir livrer l'US 3 d'abord, comme le voulait la priorité.
- **Désaccord sur le « fini »** : côté back, la route de commande paraissait finie dès que les tests passaient, alors que côté front elle ne l'était pas tant que la 409 n'était pas affichée proprement. C'est ce qui m'a fait ajouter le point 4 de la DoD.
- **Points de synchro qu'on retrouve partout** : les noms de champs, le format des erreurs et le choix de qui calcule les montants (ici, toujours le serveur).
