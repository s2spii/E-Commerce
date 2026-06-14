# Référence d'API

Base : `${API_URL}/api`. Réponses enveloppées : succès `{"data": ...}`, erreur
`{"error": {"code", "message", "details?"}}`. Authentification par cookies **HttpOnly**
(`access_token`/`refresh_token`) ou en-tête `Authorization: Bearer <token>`.

## Conventions

- Montants en **centimes** (entiers). Taux de TVA en **points de base** (2000 = 20 %).
- Pagination : `?page` (def. 1), `?pageSize`. Réponses : `{ items, pagination }`.
- Codes : `200/201/204` succès ; `400` validation ; `401` non authentifié ; `403` interdit ;
  `404` introuvable ; `409` conflit ; `422` non traitable ; `429` trop de requêtes.

## Santé

| Méthode | Endpoint            | Description                  |
| ------- | ------------------- | ---------------------------- |
| GET     | `/health`           | Liveness.                    |
| GET     | `/health/ready`     | Readiness (ping BDD).        |

## Authentification — `/auth`

| Méthode | Endpoint          | Auth | Corps / notes                                              |
| ------- | ----------------- | ---- | --------------------------------------------------------- |
| POST    | `/register`       | —    | `{ email, password, firstName?, lastName? }`              |
| POST    | `/login`          | —    | `{ email, password, mfaToken? }` → tokens ou `{mfaRequired:true}` |
| POST    | `/refresh`        | 🍪   | Rotation du refresh token.                                |
| POST    | `/logout`         | 🍪   | Révoque la session.                                       |
| GET     | `/me`             | ✅   | Profil courant.                                           |
| POST    | `/mfa/setup`      | ✅   | Renvoie `secret`, `otpauthUrl`, `qrDataUrl`.              |
| POST    | `/mfa/enable`     | ✅   | `{ token }` → renvoie les codes de récupération.          |
| POST    | `/mfa/disable`    | ✅   | `{ password }`.                                           |

## Catalogue — `/catalog`

| Méthode | Endpoint            | Auth | Notes                                                       |
| ------- | ------------------- | ---- | ---------------------------------------------------------- |
| GET     | `/products`         | —    | `?q,category,minPrice,maxPrice,inStock,featured,sort,page,pageSize` |
| GET     | `/products/:slug`   | —    | Détail (variantes, images, avis).                          |
| GET     | `/categories`       | —    | Catégories actives.                                        |

## Panier — `/cart` (cookie `cart_token`)

| Méthode | Endpoint              | Notes                                              |
| ------- | --------------------- | ------------------------------------------------- |
| GET     | `/`                   | `?country,customerType,vatNumber` → totaux + TVA. |
| POST    | `/items`              | `{ variantId, quantity }`.                         |
| PATCH   | `/items/:variantId`   | `{ quantity }` (0 = retire).                        |
| DELETE  | `/items/:variantId`   | Retire l'article.                                  |
| POST    | `/coupon`             | `{ code }`.                                         |
| DELETE  | `/coupon`             | Retire le code.                                     |

## Commandes — `/orders` (✅ authentifié)

| Méthode | Endpoint            | Notes                                                        |
| ------- | ------------------- | ----------------------------------------------------------- |
| POST    | `/checkout`         | `{ shippingAddress, billingAddress?, customerType?, vatNumber?, email? }` |
| GET     | `/`                 | Mes commandes.                                              |
| GET     | `/:id`              | Détail (propriétaire ou `order:read`).                      |
| POST    | `/:id/pay`          | **Démo** : simule la capture (prod = webhook Stripe).       |
| POST    | `/:id/returns`      | `{ reason?, items[] }`.                                     |

## Fiscalité — `/tax`

| Méthode | Endpoint          | Auth          | Notes                                  |
| ------- | ----------------- | ------------- | -------------------------------------- |
| POST    | `/quote`          | —             | Devis TVA (voir `docs/TAX.md`).        |
| POST    | `/vat/validate`   | —             | `{ vatNumber }` (format + VIES).       |
| GET     | `/rates`          | `tax:write`   | Liste des taux (admin).                |
| PUT     | `/rates`          | `tax:write`   | Crée/met à jour un taux.               |
| DELETE  | `/rates/:id`      | `tax:write`   | Supprime un taux.                      |

## CMS — `/cms`

| Méthode | Endpoint           | Auth        | Notes                  |
| ------- | ------------------ | ----------- | ---------------------- |
| GET     | `/banners`         | —           | Bannières actives.     |
| GET     | `/pages/:slug`     | —           | Page publiée.          |
| GET     | `/admin/cms/pages` | `cms:write` | Liste (admin).         |
| PUT     | `/admin/cms/pages` | `cms:write` | Upsert page.           |
| PUT     | `/admin/cms/banners`| `cms:write`| Upsert bannière.       |

## Administration — `/admin`

| Méthode | Endpoint                       | Permission        |
| ------- | ------------------------------ | ----------------- |
| GET     | `/dashboard`                   | `dashboard:view`  |
| GET     | `/users`                       | `user:manage`     |
| POST    | `/users`                       | `user:manage`     |
| PATCH   | `/users/:id/role`              | `role:manage`     |
| PATCH   | `/users/:id/active`            | `user:manage`     |
| GET     | `/roles`                       | `user:manage`     |
| GET     | `/audit-logs`                  | `audit:read`      |
| GET/PUT | `/settings`                    | `settings:write`  |
| POST    | `/catalog/products`            | `product:write`   |
| PATCH   | `/catalog/products/:id`        | `product:write`   |
| DELETE  | `/catalog/products/:id`        | `product:delete`  |
| POST    | `/catalog/categories`          | `category:write`  |
| POST    | `/catalog/variants/:id/stock`  | `inventory:write` |
| GET     | `/orders`                      | `order:read`      |
| GET     | `/orders/:id`                  | `order:read`      |
| PATCH   | `/orders/:id/status`           | `order:write`     |
| POST    | `/orders/:id/refund`           | `order:refund`    |
| PATCH   | `/orders/returns/:id`          | `return:manage`   |
| GET     | `/promotions/coupons`          | `promotion:write` |
| POST    | `/promotions/coupons`          | `promotion:write` |

## Exemple d'authentification

```bash
# Connexion (stocke les cookies)
curl -c jar.txt -X POST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@maisonluma.example","password":"ChangeMe!Luma2026"}'

# Appel authentifié
curl -b jar.txt http://localhost:4000/api/admin/dashboard
```
