<div align="center">

# ✦ MAISON LUMA ✦

**Plateforme e-commerce premium — full-stack, sécurisée, et conforme aux règles de TVA.**

Frontend Next.js · API Express/TypeScript · PostgreSQL/Prisma · Sécurité OWASP · Moteur fiscal UE

</div>

---

## 1. Vue d'ensemble

Maison Luma est une boutique en ligne **haut de gamme** pensée pour la conversion et conçue
sur une base technique solide, maintenable et scalable. Le projet est un **monorepo** :

| Dossier   | Rôle                                                                 |
| --------- | ------------------------------------------------------------------- |
| `server/` | API REST sécurisée (Express + TypeScript), Prisma/PostgreSQL.       |
| `web/`    | Vitrine premium + espace client + back-office (Next.js 14).         |
| `docs/`   | Architecture, sécurité, fiscalité, référence d'API.                 |

> Les montants monétaires sont stockés et calculés en **centimes (entiers)** pour éliminer
> toute erreur d'arrondi en virgule flottante.

## 2. Fonctionnalités

**Boutique**
- Catalogue produits avec variantes, attributs, stock, images, SEO et prix.
- Recherche, filtres (catégorie, prix, disponibilité), tri et mise en avant.
- Panier (anonyme ou connecté), codes promo, frais de port automatiques.
- Tunnel de commande avec calcul de **TVA en temps réel** (B2C/B2B, UE, export).
- Espace client : profil, historique de commandes, suivi, retours.

**Back-office (RBAC)**
- CRUD produits, catégories, variantes, stock (avec mouvements de stock audités).
- Gestion des commandes : statuts, remboursements, retours.
- Promotions et codes promo. Pages CMS et bannières.
- Gestion des utilisateurs, rôles et permissions fines.
- Tableau de bord, indicateurs et **journaux d'audit**.
- Configuration des **taux de TVA** par pays et classe fiscale.

## 3. Stack technique

- **Backend** : Node.js 20, Express, TypeScript, Prisma ORM, PostgreSQL, Redis (optionnel),
  Zod (validation), Argon2id, JWT, otplib (TOTP), Pino (logs), Vitest (tests).
- **Frontend** : Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS.
- **Infra** : Docker / Docker Compose, GitHub Actions (CI sécurisée + SBOM).

## 4. Démarrage rapide

### Option A — Docker (recommandé)

```bash
cp .env.example .env          # puis renseignez des secrets RÉELS
docker compose up --build     # db + redis + api + web

# Dans un autre terminal : initialiser le schéma et les données de démo
docker compose exec api npx prisma migrate deploy
docker compose exec api npm run db:seed
```

- Boutique : http://localhost:3000
- API : http://localhost:4000/api/health

### Option B — Local (sans Docker)

Prérequis : Node.js ≥ 20, PostgreSQL ≥ 14 (et Redis facultatif).

```bash
cp .env.example .env          # configurez DATABASE_URL et les secrets
npm install                   # installe server + web (workspaces)

# Backend
npm run db:migrate -w server  # crée le schéma
npm run db:seed   -w server   # données de démo + super admin
npm run dev       -w server   # API sur :4000

# Frontend (autre terminal)
npm run dev -w web            # boutique sur :3000
```

### Identifiants de démonstration

Après le seed (voir la sortie console) :

```
Admin : admin@maisonluma.example
Mot de passe : ChangeMe!Luma2026   ← à changer immédiatement, puis activer le MFA
```

## 5. Variables d'environnement

Toutes les variables sont documentées dans [`.env.example`](./.env.example). Les essentielles :

| Variable                                  | Description                                          |
| ----------------------------------------- | ---------------------------------------------------- |
| `DATABASE_URL`                            | Chaîne de connexion PostgreSQL.                      |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`| Secrets JWT distincts (≥ 32 caractères).             |
| `COOKIE_SECRET`                           | Secret de signature des cookies.                     |
| `TAX_HOME_COUNTRY`                        | Pays du vendeur (déterminant fiscal). Défaut `FR`.   |
| `TAX_PRICES_INCLUDE_TAX`                  | `true` si les prix catalogue sont TTC.               |
| `CORS_ORIGINS`                            | Origines autorisées (séparées par des virgules).     |

> En production, l'API **refuse de démarrer** si les secrets sont absents, trop courts ou
> laissés à leur valeur d'exemple. Injectez les secrets via un coffre (Vault, AWS/GCP Secrets
> Manager, Doppler), jamais via un fichier versionné.

## 6. Sécurité (defense in depth)

Voir [`docs/SECURITY.md`](./docs/SECURITY.md) pour le détail. En résumé :

- Mots de passe hachés en **Argon2id** ; politique de robustesse (≥ 12 caractères).
- **MFA (TOTP)** + codes de récupération ; obligatoire pour les comptes admin.
- **JWT** courts + **refresh tokens** opaques, hachés, à rotation, avec détection de rejeu.
- **RBAC** : permissions fines vérifiées sur chaque action sensible.
- **Rate limiting** sur login, MFA et endpoints sensibles ; verrouillage anti-bruteforce.
- Validation **Zod** côté serveur ; Helmet, CORS strict, HPP, corps de requête bornés.
- Cookies **HttpOnly / Secure / SameSite** ; gestion d'erreurs qui ne fuit aucun interne.
- **Journaux d'audit** sur connexions, commandes, remboursements et actions admin.

## 7. Fiscalité / TVA

Voir [`docs/TAX.md`](./docs/TAX.md). Le moteur fiscal détermine automatiquement la TVA selon
le pays de destination, le type de client et le contexte :

- Vente **domestique**, **distance intra-UE (OSS)**, **autoliquidation B2B**, **export** hors UE.
- Taux configurables par pays et **classe fiscale** (standard, réduit, livres, exonéré…).
- Validation des numéros de TVA (format + **VIES**), ventilation par taux pour la facturation.
- Architecture prête pour les obligations françaises de **facturation électronique 2026+**.

## 8. Tests & qualité

```bash
npm run test    -w server      # tests unitaires (Vitest)
npm run lint    -w server      # ESLint
npm run typecheck -w server    # vérification TypeScript stricte
npm audit --omit=dev           # dépendances de production
```

Le moteur fiscal et les primitives de sécurité sont couverts par des tests unitaires
(scénarios TVA, hachage de mots de passe, frais de port).

## 9. Structure du projet

```
.
├── server/                # API
│   ├── prisma/            # schéma + seed
│   └── src/
│       ├── config/        # env validé, catalogue de permissions
│       ├── lib/           # prisma, logger, erreurs, redis, slug
│       ├── middleware/    # auth/RBAC, validation, rate limit, audit, erreurs
│       └── modules/       # auth, catalog, cart, checkout, orders,
│                          # promotions, tax, cms, admin
├── web/                   # frontend Next.js (vitrine + admin)
├── docs/                  # ARCHITECTURE · SECURITY · TAX · API
├── docker-compose.yml
└── .github/workflows/     # CI/CD sécurisée
```

## 10. Feuille de route

Éléments volontairement laissés en extension (documentés, non bloquants) :
intégration de paiement Stripe réelle (webhooks signés), envoi d'e-mails transactionnels,
upload média S3, génération de factures PDF + flux e-reporting FR, recommandations produits,
et tests E2E (Playwright) / charge (k6). Voir les `docs/`.

---

<div align="center"><sub>Maison Luma — conçu pour durer.</sub></div>
