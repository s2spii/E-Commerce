# Sécurité

La sécurité est traitée en **defense in depth** : plusieurs couches indépendantes, alignées
sur l'**OWASP Top 10** et l'**ASVS**. Ce document décrit les mesures implémentées et la
configuration attendue en production.

## 1. Authentification

| Mesure                      | Implémentation                                                       |
| --------------------------- | ------------------------------------------------------------------- |
| Hachage des mots de passe   | **Argon2id** (`memoryCost`, `timeCost`, `parallelism` configurables). |
| Politique de robustesse     | ≥ 12 caractères, classes mixtes, refus des mots de passe courants.  |
| Anti-énumération            | Comparaison de hash factice quand l'utilisateur n'existe pas.       |
| Anti-bruteforce             | Verrouillage temporaire après 5 échecs + rate limiting.            |
| MFA                         | **TOTP** (RFC 6238) + 10 codes de récupération à usage unique.      |
| MFA admin                   | Obligatoire : tout compte non-client se voit imposer la config MFA. |

### Sessions et jetons

- **Access token** : JWT court (15 min), `issuer`/`audience` vérifiés.
- **Refresh token** : chaîne opaque aléatoire ; **seul son SHA-256 est stocké**. Rotation à
  chaque usage, regroupement en `family`, et **détection de rejeu** (réutilisation d'un jeton
  révoqué ⇒ révocation de toute la famille).
- À chaque requête authentifiée, le rôle, les permissions et le statut `isActive` sont
  **rechargés depuis la base** ⇒ révocation/désactivation **immédiates**.

## 2. Autorisation (RBAC)

- Catalogue de permissions unique (`config/permissions.ts`) ; rôles = bundles de permissions.
- Garde `requirePermission(...)` sur **chaque** action sensible (least privilege).
- Rôles système : `SUPER_ADMIN`, `ADMIN`, `CATALOG_MANAGER`, `SUPPORT_AGENT`, `CUSTOMER`.
- Vérification de **propriété des ressources** (un client ne lit que ses propres commandes).

## 3. Protection des entrées et des sorties

| Menace                 | Contre-mesure                                                          |
| ---------------------- | --------------------------------------------------------------------- |
| Injection SQL          | **Prisma** (requêtes paramétrées) ; pas de SQL concaténé.             |
| XSS                    | API JSON ; React échappe par défaut ; en-têtes Helmet.                |
| CSRF                   | **Token double-submit** (`x-csrf-token` ↔ cookie `csrf_token`) sur les mutations par cookie ; SameSite (`lax`/`strict`) + CORS allow-list ; clients Bearer exemptés. |
| Validation             | **Zod** sur `body`/`query`/`params` ; les valeurs parsées remplacent l'entrée brute. |
| HPP                    | Middleware `hpp` (pollution de paramètres HTTP).                      |
| Payloads volumineux    | Corps de requête **bornés** (100 ko) — atténuation DoS.               |
| Mass assignment        | Schémas Zod en allow-list ; jamais de spread direct du `body` vers l'ORM. |

## 4. En-têtes & transport

- **Helmet** : HSTS (prod), `X-Content-Type-Options`, `Referrer-Policy`, frameguard, CSP de base.
- **HTTPS partout** : `Secure` sur les cookies en production ; HSTS `includeSubDomains; preload`.
- `x-powered-by` désactivé ; `trust proxy` pour une IP client fiable (rate limit/audit).

## 5. Cookies

| Cookie          | Flags                                                       |
| --------------- | ---------------------------------------------------------- |
| `access_token`  | HttpOnly, Secure (prod), SameSite=Lax, signé.             |
| `refresh_token` | HttpOnly, Secure (prod), SameSite=Strict, signé, path scoping. |
| `cart_token`    | HttpOnly, Secure (prod), SameSite=Lax, signé.             |

## 6. Limitation de débit

- Limiteur **global** (anti-scraping).
- Limiteur **strict** sur `login` (avec `skipSuccessfulRequests`).
- Limiteur **très strict** sur les endpoints sensibles (setup/disable MFA).
- Prêt pour un store **Redis** partagé en déploiement multi-instances.

## 7. Journalisation & audit

- Logs structurés (Pino) avec **rédaction** des secrets (`authorization`, `password`,
  `mfaSecret`, tokens, `set-cookie`…).
- **Journal d'audit** append-only (`AuditLog`) : connexions, échecs de login, création de
  commande, remboursements, changements de rôle, actions CMS/produit, modifications de TVA.
- Corrélation des requêtes via `x-request-id`.

## 8. Gestion des secrets

- Aucun secret en clair dans le dépôt ; `.env` ignoré par Git, `.env.example` fourni.
- L'API **refuse de démarrer en production** avec des secrets manquants, trop courts ou
  laissés à leur valeur d'exemple.
- Production : injection via coffre de secrets (Vault, AWS/GCP Secrets Manager, Doppler).

## 9. Chaîne d'approvisionnement & CI/CD

- `npm audit --omit=dev --audit-level=high` en CI (build cassé si vulnérabilité haute en prod).
- **SBOM** CycloneDX généré et archivé à chaque build.
- **CodeQL** : analyse statique (SAST) via le *default setup* GitHub, sur chaque push/PR.
- Lockfile commité ; installations reproductibles.
- Images Docker multi-stage exécutées en **utilisateur non-root**.
- Dependabot pour les mises à jour de sécurité (voir `.github/dependabot.yml`).

## 10. Conformité données

- Minimisation : on ne stocke que les données nécessaires ; pas de PAN de carte (délégué au PSP).
- Snapshots de commande pour la piste d'audit comptable.
- Suppression/anonymisation possible via désactivation de compte + révocation de sessions.

---

## Checklist de mise en production

- [ ] Secrets forts et uniques injectés via un coffre (≠ `.env.example`).
- [ ] HTTPS terminé en amont (TLS 1.2+), HSTS activé.
- [ ] `CORS_ORIGINS` limité aux domaines réels.
- [ ] Redis configuré pour le rate limiting partagé.
- [ ] Sauvegardes BDD automatiques + **restauration testée**.
- [ ] MFA activé sur **tous** les comptes admin ; mot de passe seed changé.
- [ ] Alerting sur `auth.refresh.reuse_detected` et pics de `auth.login.failed`.
- [ ] Revue de dépendances (SBOM) et scan SAST/DAST avant release.

## Signalement de vulnérabilité

Contact sécurité : `security@maisonluma.example` (PGP recommandé). Merci de pratiquer une
divulgation responsable.
