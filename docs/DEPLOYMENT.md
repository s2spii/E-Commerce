# Déploiement & exploitation

Guide de mise en production d'un environnement **reproductible**, sécurisé et sauvegardé.

## 1. Pré-requis

- Node.js 20 (ou les images Docker fournies).
- PostgreSQL 14+ managé (sauvegardes automatiques activées).
- Redis (recommandé pour le rate limiting partagé en multi-instances).
- Terminaison TLS en amont (reverse proxy / load balancer) — **HTTPS partout**.
- Un coffre de secrets (Vault, AWS/GCP Secrets Manager, Doppler…).

## 2. Secrets & configuration

Renseignez toutes les variables de [`.env.example`](../.env.example) via le coffre, **jamais**
dans un fichier versionné. Générez des secrets forts :

```bash
openssl rand -base64 48   # pour chaque JWT secret et COOKIE_SECRET (distincts)
```

> En `NODE_ENV=production`, l'API refuse de démarrer si un secret est manquant, trop court, ou
> laissé à sa valeur d'exemple.

## 3. Build & migrations

### Avec Docker Compose

```bash
docker compose build
docker compose up -d db redis
docker compose run --rm api npx prisma migrate deploy   # applique les migrations
docker compose up -d api web
```

L'image API exécute déjà `prisma migrate deploy` au démarrage (voir `server/Dockerfile`).

### Sans Docker

```bash
npm ci
npm run build -w server          # prisma generate + tsc
npm run db:deploy -w server      # prisma migrate deploy
NODE_ENV=production node server/dist/server.js
npm run build -w web && npm run start -w web
```

## 4. Stratégie de migration

- Les migrations sont **versionnées** (`server/prisma/migrations/`) et appliquées avec
  `migrate deploy` (jamais `migrate dev` en production).
- Migrations **rétrocompatibles** privilégiées (expand/contract) pour permettre les
  déploiements sans interruption et un rollback applicatif sûr.

## 5. Plan de rollback

1. **Application** : redéployer l'image/tag précédent (artefacts immuables, versionnés).
2. **Base de données** : grâce à l'approche expand/contract, l'ancienne version reste
   compatible avec le schéma courant. Pour une migration destructive, restaurer depuis la
   sauvegarde la plus récente (voir §6) après bascule en maintenance.
3. **Vérification** : `GET /api/health/ready` + parcours d'achat de fumée (smoke test).

## 6. Sauvegardes & restauration

- Sauvegardes PostgreSQL **automatiques** (PITR si disponible) + snapshots quotidiens.
- **Tester la restauration régulièrement** (un backup non testé n'existe pas) :

```bash
pg_dump "$DATABASE_URL" > backup.sql            # sauvegarde logique
psql "$RESTORE_URL" < backup.sql                # restauration de vérification
```

## 7. Monitoring, logs & alerting

- **Logs** structurés JSON (Pino) → agrégateur (Loki/Datadog/CloudWatch). Secrets rédigés.
- **Santé** : `/api/health` (liveness) et `/api/health/ready` (readiness, ping BDD) pour les
  sondes Kubernetes/load balancer.
- **Métriques** à instrumenter : latence p95 des pages clés, taux d'erreur 5xx, profondeur de
  file de commandes, stock bas.
- **Alertes de sécurité** : `auth.refresh.reuse_detected`, pics de `auth.login.failed`,
  remboursements anormaux — toutes traçables via `AuditLog`.

## 8. Scalabilité

- API sans état → réplicas horizontaux derrière un load balancer.
- Activer `REDIS_URL` pour un rate limiting cohérent entre réplicas.
- Web Next.js en sortie `standalone` (image légère).
- Mettre les médias derrière un CDN ; stockage objet S3 pour les uploads.

## 9. Checklist de release

- [ ] CI verte (lint, typecheck, tests, `npm audit --omit=dev`, SBOM).
- [ ] Code scanning **CodeQL** actif (GitHub *default setup*) sans alerte non triée.
- [ ] Secrets de production en place (coffre), distincts par environnement.
- [ ] Migrations testées sur une copie de staging.
- [ ] Sauvegarde fraîche + restauration vérifiée.
- [ ] Sondes de santé branchées ; tableaux de bord et alertes actifs.
- [ ] MFA activé sur les comptes admin ; mot de passe seed remplacé.
- [ ] Plan de rollback validé et communiqué.
