# Fiscalité & TVA

Le moteur fiscal de Maison Luma calcule **automatiquement** la TVA selon le pays de
destination, le type de client (B2C/B2B) et le contexte de la transaction. Il est conçu pour
être **configurable** et **évolutif** face aux changements réglementaires.

## 1. Conception

- **Moteur pur et testé** : `server/src/modules/tax/tax.engine.ts` ne fait aucune I/O et est
  entièrement déterministe (couvert par des tests unitaires). Le service lui injecte les taux.
- **Taux en base** : table `TaxRate` (par pays, **classe fiscale**, période de validité),
  éditable depuis le back-office (permission `tax:write`). Des défauts de code servent de
  filet de sécurité (`tax.data.ts`).
- **Argent en centimes** ; taux en **points de base** (2000 = 20,00 %). Arrondi **par ligne**
  au centime (règle « demi vers le haut »).
- **Ventilation par taux** (`taxBreakdown`) produite pour la facturation et l'e-reporting.

## 2. Scénarios couverts

| Scénario                   | Condition                                            | TVA appliquée                       |
| -------------------------- | ---------------------------------------------------- | ----------------------------------- |
| `DOMESTIC`                 | destination = pays du vendeur                        | taux du pays vendeur (par classe)   |
| `EU_B2C_OSS`               | UE → UE, particulier (régime OSS)                    | taux du **pays de destination**     |
| `EU_B2C_ORIGIN`            | UE → UE, particulier, vendeur **non** inscrit OSS    | taux du pays vendeur                 |
| `EU_B2B_REVERSE_CHARGE`    | UE → UE, pro avec **n° TVA valide**                  | **0 %** + mention d'autoliquidation |
| `EXPORT`                   | UE → hors UE                                          | **0 %** (exonération à l'export)    |
| `OUT_OF_SCOPE`             | vendeur hors UE                                       | 0 % (à paramétrer selon le régime)  |

> **OSS (One-Stop-Shop)** : depuis juillet 2021, les ventes à distance intra-UE B2C sont
> taxées au taux du pays de destination au-delà d'un seuil pan-UE de **10 000 €**. En deçà, un
> micro-vendeur peut appliquer le taux d'origine — d'où le paramètre `ossRegistered`.

## 3. Classes fiscales

Chaque produit porte une `taxClass` (`Product.taxClass`). Exemples fournis pour la France :

| Classe          | Exemple de taux FR |
| --------------- | ------------------ |
| `STANDARD`      | 20,0 %             |
| `REDUCED`       | 10,0 %             |
| `SUPER_REDUCED` | 5,5 %              |
| `BOOKS`         | 5,5 %              |
| `ZERO`          | 0,0 %              |

Le résolveur applique : taux exact `(pays, classe)` → sinon `(pays, STANDARD)` → sinon `0`
(et une alerte admin devrait être levée si un pays n'a aucun taux configuré).

## 4. Prix TTC vs HT

Piloté par `TAX_PRICES_INCLUDE_TAX` :

- **Prix TTC** (`true`, défaut) : le moteur **retire** une fois la TVA du pays vendeur pour
  obtenir un **net stable**, puis applique le taux du scénario. Conséquence utile : un acheteur
  en autoliquidation ou à l'export paie **le net** (TVA retirée).
- **Prix HT** (`false`) : le prix catalogue est déjà net ; la TVA est ajoutée.

Exemple (prix TTC 120,00 € à 20 %) :

| Cas                         | Net      | TVA      | Total payé |
| --------------------------- | -------- | -------- | ---------- |
| FR → FR (B2C)               | 100,00 € | 20,00 €  | 120,00 €   |
| FR → DE (B2C, OSS 19 %)     | 100,00 € | 19,00 €  | 119,00 €   |
| FR → DE (B2B n° TVA valide) | 100,00 € | 0,00 €   | 100,00 €   |
| FR → US (export)            | 100,00 € | 0,00 €   | 100,00 €   |

## 5. Numéros de TVA (B2B)

- **Pré-contrôle de format** par pays (`VAT_NUMBER_PATTERNS`).
- **Validation faisant foi** via **VIES** (`validateVatNumber`), avec timeout et repli sur le
  format en cas d'indisponibilité du service (le résultat est consigné sur la commande via
  `vatNumberValid`). L'autoliquidation n'est accordée que si le numéro est **valide**.

## 6. Remises et frais de port

- La remise (code promo) s'applique sur le **sous-total net** puis est **répartie
  proportionnellement** entre les lignes avant le recalcul définitif de la TVA.
- Les **frais de port** suivent l'opération principale : ajoutés comme une ligne taxable
  (classe `STANDARD`), donc correctement exonérés en autoliquidation/export.

## 7. France — facturation électronique 2026+

La réforme française impose progressivement la **facturation électronique** (e-invoicing) entre
assujettis et le **e-reporting** des transactions :

- **Réception** des e-factures obligatoire pour **toutes** les entreprises assujetties dès
  l'entrée en vigueur ;
- **Émission** déployée par paliers selon la taille de l'entreprise.

> Les échéances exactes et modalités (PDP/portail public) relèvent des textes en vigueur et
> doivent être vérifiées au moment du déploiement.

Le système est **préparé** pour ces obligations :

- montants, taux, **ventilation par taux** et mentions (autoliquidation/export) déjà calculés
  et **stockés par commande** (`Order.taxBreakdown`, snapshots de lignes) ;
- identité fiscale du vendeur configurable (`COMPANY_VAT_NUMBER`, `COMPANY_SIREN`…) ;
- point d'extension prévu pour générer un format structuré (Factur-X/UBL) et transmettre via
  une **Plateforme de Dématérialisation Partenaire (PDP)** — voir la feuille de route.

## 8. Tester le moteur

```bash
npm run test -w server          # inclut tax.engine.test.ts (13 scénarios)
```

Endpoint de devis (sans engagement) :

```bash
curl -X POST http://localhost:4000/api/tax/quote -H 'Content-Type: application/json' -d '{
  "destinationCountry": "DE",
  "customerType": "B2B",
  "vatNumber": "DE123456789",
  "lines": [{ "taxClass": "STANDARD", "unitAmount": 12000, "quantity": 1 }]
}'
```
