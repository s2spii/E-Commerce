# Architecture

## Vue d'ensemble

Maison Luma suit une architecture **3-tiers** clairement séparée, packagée en monorepo.

```
┌───────────────┐     HTTPS/JSON      ┌────────────────┐     SQL      ┌──────────────┐
│   web (Next)  │  ───────────────▶   │  server (API)  │  ─────────▶  │  PostgreSQL  │
│  SSR + React  │  ◀───────────────   │  Express + TS  │  ◀─────────  │   (Prisma)   │
└───────────────┘   cookies HttpOnly  └────────────────┘              └──────────────┘
                                              │
                                              ├──▶ Redis (rate limit / cache, optionnel)
                                              └──▶ Services externes (Stripe, VIES, SMTP, S3)
```

## Backend — architecture en couches

Chaque domaine métier est un **module** autonome dans `server/src/modules/<domaine>/` et
respecte une séparation stricte des responsabilités :

```
routes        → définit les endpoints, branche middlewares (auth, validation, rate limit)
controller    → traduit HTTP ⇆ domaine (lecture req, écriture res, codes de statut, audit)
service       → logique métier pure, transactions, règles d'invariants
(lib/prisma)  → accès aux données via Prisma
```

Principes appliqués :

- **Le contrôleur ne contient pas de logique métier** ; il délègue au service.
- **Le service ne connaît pas HTTP** ; il lève des erreurs typées (`AppError`) que le
  middleware central transforme en réponses sûres.
- **Les entrées sont validées au plus tôt** (Zod) avant d'atteindre la logique métier.
- **Les opérations multi-étapes sont transactionnelles** (`prisma.$transaction`) pour
  garantir la cohérence (ex. création de commande = stock + commande + coupon + panier).

### Carte des modules

| Module        | Responsabilité                                                            |
| ------------- | ------------------------------------------------------------------------ |
| `auth`        | Inscription, login, MFA (TOTP), JWT + refresh tokens, mot de passe.      |
| `catalog`     | Produits, catégories, variantes, images, stock (mouvements audités).     |
| `cart`        | Paniers anonymes/connectés, lignes, application de codes promo.          |
| `checkout`    | **Pricing** (TVA + remise + port) et calcul des frais de port.           |
| `orders`      | Commande, paiement, expédition, remboursement, retours.                  |
| `promotions`  | Coupons : validation, calcul de remise, redemption.                      |
| `tax`         | Moteur TVA pur + résolveur de taux (BDD) + validation n° TVA (VIES).     |
| `cms`         | Pages éditoriales et bannières.                                          |
| `admin`       | Tableau de bord, utilisateurs/rôles, audit, paramètres.                  |

### Couche transverse

- `config/env.ts` — environnement **validé** (fail-fast au démarrage).
- `config/permissions.ts` — catalogue des permissions + rôles système (source unique).
- `middleware/` — `auth` (auth* + RBAC), `validate` (Zod), `rateLimit`, `audit`, `error`.
- `lib/` — `prisma`, `logger` (Pino, avec rédaction des secrets), `errors`, `redis`, `slug`.

## Modèle de données

Le schéma (`server/prisma/schema.prisma`) couvre identité & RBAC, catalogue, panier,
commandes/paiements/retours, promotions, taxation, CMS et audit. Points de conception :

- **Argent en centimes entiers** ; taux de TVA en **points de base** (2000 = 20,00 %).
- **Instantanés (snapshots)** sur les lignes de commande (nom produit, SKU, prix, taux,
  montant de TVA) : une commande reste fidèle même si le catalogue évolue.
- **Détection de rejeu** des refresh tokens via une `family` de rotation.
- **`AuditLog`** append-only pour la traçabilité réglementaire et sécuritaire.

## Frontend

Next.js 14 (App Router). Les données dynamiques sont récupérées **côté client** avec les
cookies (`credentials: 'include'`), ce qui :

- garde l'API comme **source unique de vérité** (tarification/TVA recalculées serveur) ;
- permet un `next build` autonome (aucune dépendance à une API en cours d'exécution) ;
- isole l'authentification dans des cookies **HttpOnly** (le JS ne lit jamais le token).

## Flux clés

### Tunnel de commande

```
Panier (cart_token cookie)
  └─▶ POST /orders/checkout
        1. recharge le panier serveur (jamais les prix du client)
        2. priceCheckout() : TVA + remise + frais de port  ← source unique
        3. transaction :
             • vérifie/réserve le stock (anti-survente)
             • crée Order + OrderItems (snapshots) + Payment(PENDING)
             • redeem coupon, marque le panier CONVERTED
        4. audit "order.create"
  └─▶ POST /orders/:id/pay  (démo ; en prod : webhook Stripe signé)
        → Order PAID + Payment CAPTURED + Shipment(PREPARING)
```

### Autorisation (RBAC)

```
Requête ─▶ authenticate (vérifie le JWT, RECHARGE rôle+permissions+isActive en BDD)
        ─▶ requirePermission('order:refund', …)  (SUPER_ADMIN bypass)
        ─▶ controller
```

La ré-dérivation des droits en base à chaque requête rend **immédiats** la révocation de
session, la désactivation de compte et les changements de rôle.

## Scalabilité

- API **sans état** (JWT) → scalable horizontalement derrière un load balancer.
- Rate limiting prêt pour un **store Redis partagé** (multi-instances).
- Index de base de données sur les colonnes de filtrage/jointure fréquentes.
- Cache courte durée du résolveur de taux de TVA.
