# Informe de ejecución QA — Pruebas unitarias — feat/e2e-entorno-y-blindaje-locations

| Campo | Valor |
|---|---|
| Fecha y hora | 2026-10-12 17:13 |
| Repo | TekoApp-Backend |
| Rama | `feat/e2e-entorno-y-blindaje-locations` |
| Commit | `5239119` (árbol con cambios sin commitear) |
| Entorno | local, Jest con mocks (sin infraestructura), Node v22.16.0 |
| Comando | `pnpm qa:unit` |
| Ejecutor | agente Claude Code (modelo claude-sonnet-5-5) |

## 1. Resumen

| Suites | Casos | Pasaron | Fallaron | Omitidos | Duración |
|---|---|---|---|---|---|
| 138 (0 con fallo) | 1549 | 1549 | 0 | 0 | 2 min 21 s |

### Cobertura

| Métrica | Cobertura | Cubiertos/Total | Umbral (jest.config.ts) | Estado |
|---|---|---|---|---|
| statements | 81.62% | 5735/7026 | 80% | cumple |
| branches | 66.85% | 3155/4719 | 70% | INCUMPLE |
| functions | 75.74% | 1290/1703 | 80% | INCUMPLE |
| lines | 81.52% | 5215/6397 | 80% | cumple |

## 2. Resultados por suite (agrupadas por dominio)

### Totales por dominio

| Dominio | Suites | Pasaron | Fallaron | Omitidos |
|---|---|---|---|---|
| `src/api/account-deletion` | 3 | 13 | 0 | 0 |
| `src/api/ai-disclosures` | 1 | 11 | 0 | 0 |
| `src/api/analytics` | 2 | 13 | 0 | 0 |
| `src/api/audit-log` | 2 | 4 | 0 | 0 |
| `src/api/auth` | 4 | 69 | 0 | 0 |
| `src/api/budgets` | 1 | 14 | 0 | 0 |
| `src/api/categories` | 2 | 42 | 0 | 0 |
| `src/api/contracts` | 2 | 29 | 0 | 0 |
| `src/api/countries` | 2 | 6 | 0 | 0 |
| `src/api/currencies` | 2 | 6 | 0 | 0 |
| `src/api/languages` | 2 | 6 | 0 | 0 |
| `src/api/legal-consents` | 2 | 13 | 0 | 0 |
| `src/api/locations` | 4 | 48 | 0 | 0 |
| `src/api/material-catalog` | 1 | 4 | 0 | 0 |
| `src/api/notification-preferences` | 2 | 10 | 0 | 0 |
| `src/api/notifications` | 4 | 49 | 0 | 0 |
| `src/api/onboarding` | 2 | 8 | 0 | 0 |
| `src/api/payment-disputes` | 3 | 25 | 0 | 0 |
| `src/api/payments` | 5 | 76 | 0 | 0 |
| `src/api/professional-document-types` | 1 | 3 | 0 | 0 |
| `src/api/professional-documents` | 3 | 29 | 0 | 0 |
| `src/api/professional-portfolio` | 2 | 27 | 0 | 0 |
| `src/api/professionals` | 3 | 53 | 0 | 0 |
| `src/api/promotions` | 2 | 26 | 0 | 0 |
| `src/api/ratings` | 3 | 66 | 0 | 0 |
| `src/api/roles-permission` | 3 | 34 | 0 | 0 |
| `src/api/service-progress` | 1 | 19 | 0 | 0 |
| `src/api/service-types` | 1 | 1 | 0 | 0 |
| `src/api/services` | 3 | 71 | 0 | 0 |
| `src/api/tax` | 2 | 6 | 0 | 0 |
| `src/api/tips` | 3 | 16 | 0 | 0 |
| `src/api/uploads` | 2 | 33 | 0 | 0 |
| `src/api/users` | 2 | 23 | 0 | 0 |
| `src/app.module.spec.ts` | 1 | 6 | 0 | 0 |
| `src/common` | 2 | 19 | 0 | 0 |
| `src/core` | 3 | 21 | 0 | 0 |
| `src/modules/account-deletion-db` | 1 | 7 | 0 | 0 |
| `src/modules/ai-disclosures-db` | 1 | 3 | 0 | 0 |
| `src/modules/analytics-db` | 1 | 15 | 0 | 0 |
| `src/modules/audit-log-db` | 1 | 4 | 0 | 0 |
| `src/modules/auth` | 9 | 107 | 0 | 0 |
| `src/modules/budgets-db` | 1 | 7 | 0 | 0 |
| `src/modules/categories-db` | 1 | 13 | 0 | 0 |
| `src/modules/contracts-db` | 1 | 9 | 0 | 0 |
| `src/modules/countries-db` | 1 | 3 | 0 | 0 |
| `src/modules/currencies-db` | 1 | 3 | 0 | 0 |
| `src/modules/email` | 1 | 23 | 0 | 0 |
| `src/modules/health` | 1 | 6 | 0 | 0 |
| `src/modules/languages-db` | 1 | 3 | 0 | 0 |
| `src/modules/legal-consents-db` | 1 | 8 | 0 | 0 |
| `src/modules/material-catalog-db` | 1 | 5 | 0 | 0 |
| `src/modules/notification-preferences-db` | 1 | 4 | 0 | 0 |
| `src/modules/notifications-db` | 1 | 12 | 0 | 0 |
| `src/modules/observability` | 1 | 10 | 0 | 0 |
| `src/modules/onboarding` | 1 | 5 | 0 | 0 |
| `src/modules/payment-disputes-db` | 1 | 10 | 0 | 0 |
| `src/modules/payments-db` | 2 | 45 | 0 | 0 |
| `src/modules/professional-document-types-db` | 1 | 4 | 0 | 0 |
| `src/modules/professional-documents-db` | 2 | 11 | 0 | 0 |
| `src/modules/professional-portfolio-db` | 1 | 10 | 0 | 0 |
| `src/modules/professional-position-db` | 1 | 17 | 0 | 0 |
| `src/modules/professionals-db` | 1 | 34 | 0 | 0 |
| `src/modules/promotions-db` | 1 | 17 | 0 | 0 |
| `src/modules/push-notifications-db` | 2 | 10 | 0 | 0 |
| `src/modules/push-provider` | 2 | 13 | 0 | 0 |
| `src/modules/ratings-db` | 1 | 22 | 0 | 0 |
| `src/modules/report` | 1 | 10 | 0 | 0 |
| `src/modules/roles-permission-db` | 5 | 104 | 0 | 0 |
| `src/modules/service-progress-db` | 1 | 7 | 0 | 0 |
| `src/modules/services-db` | 1 | 28 | 0 | 0 |
| `src/modules/storage` | 1 | 4 | 0 | 0 |
| `src/modules/tax-db` | 1 | 2 | 0 | 0 |
| `src/modules/tips-db` | 1 | 5 | 0 | 0 |
| `src/modules/users-db` | 2 | 50 | 0 | 0 |

### Detalle por suite

#### `src/api/account-deletion`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/api/account-deletion/controllers/account-deletion.controller.spec.ts` | 2 | 2 | 0 | 0 | OK |
| `src/api/account-deletion/jobs/account-deletion-anonymization.job.spec.ts` | 3 | 3 | 0 | 0 | OK |
| `src/api/account-deletion/services/account-deletion.service.spec.ts` | 8 | 8 | 0 | 0 | OK |

#### `src/api/ai-disclosures`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/api/ai-disclosures/services/ai-disclosures.service.spec.ts` | 11 | 11 | 0 | 0 | OK |

#### `src/api/analytics`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/api/analytics/controllers/analytics.controller.spec.ts` | 4 | 4 | 0 | 0 | OK |
| `src/api/analytics/services/analytics.service.spec.ts` | 9 | 9 | 0 | 0 | OK |

#### `src/api/audit-log`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/api/audit-log/controllers/admin-audit-log.controller.spec.ts` | 2 | 2 | 0 | 0 | OK |
| `src/api/audit-log/services/audit-log.service.spec.ts` | 2 | 2 | 0 | 0 | OK |

#### `src/api/auth`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/api/auth/controllers/auth-api.controller.spec.ts` | 26 | 26 | 0 | 0 | OK |
| `src/api/auth/services/auth-api.service.spec.ts` | 29 | 29 | 0 | 0 | OK |
| `src/api/auth/services/auth-cookie.service.spec.ts` | 6 | 6 | 0 | 0 | OK |
| `src/api/auth/services/auth-migration.service.spec.ts` | 8 | 8 | 0 | 0 | OK |

#### `src/api/budgets`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/api/budgets/services/budgets.service.spec.ts` | 14 | 14 | 0 | 0 | OK |

#### `src/api/categories`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/api/categories/controllers/categories.controller.spec.ts` | 19 | 19 | 0 | 0 | OK |
| `src/api/categories/services/categories.service.spec.ts` | 23 | 23 | 0 | 0 | OK |

#### `src/api/contracts`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/api/contracts/helpers/contracts-pdf.helper.spec.ts` | 5 | 5 | 0 | 0 | OK |
| `src/api/contracts/services/contracts.service.spec.ts` | 24 | 24 | 0 | 0 | OK |

#### `src/api/countries`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/api/countries/controllers/countries.controller.spec.ts` | 3 | 3 | 0 | 0 | OK |
| `src/api/countries/services/countries.service.spec.ts` | 3 | 3 | 0 | 0 | OK |

#### `src/api/currencies`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/api/currencies/controllers/currencies.controller.spec.ts` | 3 | 3 | 0 | 0 | OK |
| `src/api/currencies/services/currencies.service.spec.ts` | 3 | 3 | 0 | 0 | OK |

#### `src/api/languages`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/api/languages/controllers/languages.controller.spec.ts` | 3 | 3 | 0 | 0 | OK |
| `src/api/languages/services/languages.service.spec.ts` | 3 | 3 | 0 | 0 | OK |

#### `src/api/legal-consents`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/api/legal-consents/guards/requires-active-consent.guard.spec.ts` | 3 | 3 | 0 | 0 | OK |
| `src/api/legal-consents/services/legal-consents.service.spec.ts` | 10 | 10 | 0 | 0 | OK |

#### `src/api/locations`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/api/locations/controllers/locations.controller.spec.ts` | 10 | 10 | 0 | 0 | OK |
| `src/api/locations/gateway/locations.gateway.spec.ts` | 10 | 10 | 0 | 0 | OK |
| `src/api/locations/helpers/location-obfuscation.helper.spec.ts` | 4 | 4 | 0 | 0 | OK |
| `src/api/locations/services/locations.service.spec.ts` | 24 | 24 | 0 | 0 | OK |

#### `src/api/material-catalog`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/api/material-catalog/services/material-catalog.service.spec.ts` | 4 | 4 | 0 | 0 | OK |

#### `src/api/notification-preferences`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/api/notification-preferences/controllers/notification-preferences.controller.spec.ts` | 2 | 2 | 0 | 0 | OK |
| `src/api/notification-preferences/services/notification-preferences.service.spec.ts` | 8 | 8 | 0 | 0 | OK |

#### `src/api/notifications`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/api/notifications/controllers/notifications.controller.spec.ts` | 17 | 17 | 0 | 0 | OK |
| `src/api/notifications/processors/notifications.processor.spec.ts` | 10 | 10 | 0 | 0 | OK |
| `src/api/notifications/services/notifications-sse.service.spec.ts` | 2 | 2 | 0 | 0 | OK |
| `src/api/notifications/services/notifications.service.spec.ts` | 20 | 20 | 0 | 0 | OK |

#### `src/api/onboarding`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/api/onboarding/controllers/onboarding.controller.spec.ts` | 3 | 3 | 0 | 0 | OK |
| `src/api/onboarding/services/onboarding-api.service.spec.ts` | 5 | 5 | 0 | 0 | OK |

#### `src/api/payment-disputes`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/api/payment-disputes/controllers/admin-disputes.controller.spec.ts` | 6 | 6 | 0 | 0 | OK |
| `src/api/payment-disputes/controllers/payment-disputes.controller.spec.ts` | 3 | 3 | 0 | 0 | OK |
| `src/api/payment-disputes/services/payment-disputes.service.spec.ts` | 16 | 16 | 0 | 0 | OK |

#### `src/api/payments`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/api/payments/controllers/admin-payments.controller.spec.ts` | 2 | 2 | 0 | 0 | OK |
| `src/api/payments/controllers/payments.controller.spec.ts` | 15 | 15 | 0 | 0 | OK |
| `src/api/payments/helpers/payments-response.helper.spec.ts` | 3 | 3 | 0 | 0 | OK |
| `src/api/payments/helpers/professional-net-amount.helper.spec.ts` | 7 | 7 | 0 | 0 | OK |
| `src/api/payments/services/payments.service.spec.ts` | 49 | 49 | 0 | 0 | OK |

#### `src/api/professional-document-types`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/api/professional-document-types/services/professional-document-types.service.spec.ts` | 3 | 3 | 0 | 0 | OK |

#### `src/api/professional-documents`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/api/professional-documents/controllers/admin-professional-documents.controller.spec.ts` | 12 | 12 | 0 | 0 | OK |
| `src/api/professional-documents/jobs/professional-documents-expiration.job.spec.ts` | 3 | 3 | 0 | 0 | OK |
| `src/api/professional-documents/services/professional-documents.service.spec.ts` | 14 | 14 | 0 | 0 | OK |

#### `src/api/professional-portfolio`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/api/professional-portfolio/controllers/admin-professional-portfolio.controller.spec.ts` | 8 | 8 | 0 | 0 | OK |
| `src/api/professional-portfolio/services/professional-portfolio.service.spec.ts` | 19 | 19 | 0 | 0 | OK |

#### `src/api/professionals`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/api/professionals/controllers/admin-professionals-export.controller.spec.ts` | 2 | 2 | 0 | 0 | OK |
| `src/api/professionals/controllers/professionals.controller.spec.ts` | 22 | 22 | 0 | 0 | OK |
| `src/api/professionals/services/professionals.service.spec.ts` | 29 | 29 | 0 | 0 | OK |

#### `src/api/promotions`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/api/promotions/controllers/promotions.controller.spec.ts` | 11 | 11 | 0 | 0 | OK |
| `src/api/promotions/services/promotions.service.spec.ts` | 15 | 15 | 0 | 0 | OK |

#### `src/api/ratings`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/api/ratings/controllers/ratings.controller.spec.ts` | 21 | 21 | 0 | 0 | OK |
| `src/api/ratings/helpers/ratings-response.helper.spec.ts` | 8 | 8 | 0 | 0 | OK |
| `src/api/ratings/services/ratings.service.spec.ts` | 37 | 37 | 0 | 0 | OK |

#### `src/api/roles-permission`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/api/roles-permission/controllers/roles-api.controller.spec.ts` | 7 | 7 | 0 | 0 | OK |
| `src/api/roles-permission/controllers/users-roles-api.controller.spec.ts` | 6 | 6 | 0 | 0 | OK |
| `src/api/roles-permission/services/roles-permission-api.service.spec.ts` | 21 | 21 | 0 | 0 | OK |

#### `src/api/service-progress`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/api/service-progress/services/service-progress.service.spec.ts` | 19 | 19 | 0 | 0 | OK |

#### `src/api/service-types`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/api/service-types/services/service-types.service.spec.ts` | 1 | 1 | 0 | 0 | OK |

#### `src/api/services`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/api/services/controllers/services.controller.spec.ts` | 18 | 18 | 0 | 0 | OK |
| `src/api/services/helpers/services-response.helper.spec.ts` | 5 | 5 | 0 | 0 | OK |
| `src/api/services/services/services.service.spec.ts` | 48 | 48 | 0 | 0 | OK |

#### `src/api/tax`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/api/tax/controllers/tax-config.controller.spec.ts` | 1 | 1 | 0 | 0 | OK |
| `src/api/tax/services/tax.service.spec.ts` | 5 | 5 | 0 | 0 | OK |

#### `src/api/tips`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/api/tips/controllers/payment-tip.controller.spec.ts` | 2 | 2 | 0 | 0 | OK |
| `src/api/tips/controllers/tip-config.controller.spec.ts` | 1 | 1 | 0 | 0 | OK |
| `src/api/tips/services/tips.service.spec.ts` | 13 | 13 | 0 | 0 | OK |

#### `src/api/uploads`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/api/uploads/controllers/uploads.controller.spec.ts` | 11 | 11 | 0 | 0 | OK |
| `src/api/uploads/services/uploads.service.spec.ts` | 22 | 22 | 0 | 0 | OK |

#### `src/api/users`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/api/users/controllers/users.controller.spec.ts` | 10 | 10 | 0 | 0 | OK |
| `src/api/users/services/users-api.service.spec.ts` | 13 | 13 | 0 | 0 | OK |

#### `src/app.module.spec.ts`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/app.module.spec.ts` | 6 | 6 | 0 | 0 | OK |

#### `src/common`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/common/filters/http-exception.filter.spec.ts` | 4 | 4 | 0 | 0 | OK |
| `src/common/i18n/i18n.helper.spec.ts` | 15 | 15 | 0 | 0 | OK |

#### `src/core`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/core/config/rate-limit.config.spec.ts` | 15 | 15 | 0 | 0 | OK |
| `src/core/filters/http-exception.filter.spec.ts` | 4 | 4 | 0 | 0 | OK |
| `src/core/interceptors/transform.interceptor.spec.ts` | 2 | 2 | 0 | 0 | OK |

#### `src/modules/account-deletion-db`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/modules/account-deletion-db/services/account-deletion-db.service.spec.ts` | 7 | 7 | 0 | 0 | OK |

#### `src/modules/ai-disclosures-db`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/modules/ai-disclosures-db/services/ai-disclosures-db.service.spec.ts` | 3 | 3 | 0 | 0 | OK |

#### `src/modules/analytics-db`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/modules/analytics-db/services/analytics-db.service.spec.ts` | 15 | 15 | 0 | 0 | OK |

#### `src/modules/audit-log-db`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/modules/audit-log-db/services/audit-log-db.service.spec.ts` | 4 | 4 | 0 | 0 | OK |

#### `src/modules/auth`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/modules/auth/guards/basic-auth.guard.spec.ts` | 5 | 5 | 0 | 0 | OK |
| `src/modules/auth/guards/permissions.guard.spec.ts` | 10 | 10 | 0 | 0 | OK |
| `src/modules/auth/helpers/password-expiration.helper.spec.ts` | 8 | 8 | 0 | 0 | OK |
| `src/modules/auth/helpers/password-policy.helper.spec.ts` | 6 | 6 | 0 | 0 | OK |
| `src/modules/auth/repositories/credentials.repository.spec.ts` | 4 | 4 | 0 | 0 | OK |
| `src/modules/auth/services/auth-password.service.spec.ts` | 27 | 27 | 0 | 0 | OK |
| `src/modules/auth/services/auth-token.service.spec.ts` | 8 | 8 | 0 | 0 | OK |
| `src/modules/auth/services/auth.service.spec.ts` | 32 | 32 | 0 | 0 | OK |
| `src/modules/auth/services/nonce.service.spec.ts` | 7 | 7 | 0 | 0 | OK |

#### `src/modules/budgets-db`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/modules/budgets-db/services/budgets-db.service.spec.ts` | 7 | 7 | 0 | 0 | OK |

#### `src/modules/categories-db`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/modules/categories-db/services/categories-db.service.spec.ts` | 13 | 13 | 0 | 0 | OK |

#### `src/modules/contracts-db`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/modules/contracts-db/services/contracts-db.service.spec.ts` | 9 | 9 | 0 | 0 | OK |

#### `src/modules/countries-db`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/modules/countries-db/services/countries-db.service.spec.ts` | 3 | 3 | 0 | 0 | OK |

#### `src/modules/currencies-db`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/modules/currencies-db/services/currencies-db.service.spec.ts` | 3 | 3 | 0 | 0 | OK |

#### `src/modules/email`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/modules/email/services/email.service.spec.ts` | 23 | 23 | 0 | 0 | OK |

#### `src/modules/health`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/modules/health/health.controller.spec.ts` | 6 | 6 | 0 | 0 | OK |

#### `src/modules/languages-db`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/modules/languages-db/services/languages-db.service.spec.ts` | 3 | 3 | 0 | 0 | OK |

#### `src/modules/legal-consents-db`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/modules/legal-consents-db/services/legal-consents-db.service.spec.ts` | 8 | 8 | 0 | 0 | OK |

#### `src/modules/material-catalog-db`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/modules/material-catalog-db/services/material-catalog-db.service.spec.ts` | 5 | 5 | 0 | 0 | OK |

#### `src/modules/notification-preferences-db`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/modules/notification-preferences-db/services/notification-preferences-db.service.spec.ts` | 4 | 4 | 0 | 0 | OK |

#### `src/modules/notifications-db`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/modules/notifications-db/services/notifications-db.service.spec.ts` | 12 | 12 | 0 | 0 | OK |

#### `src/modules/observability`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/modules/observability/services/sentry-reporter.service.spec.ts` | 10 | 10 | 0 | 0 | OK |

#### `src/modules/onboarding`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/modules/onboarding/services/onboarding.service.spec.ts` | 5 | 5 | 0 | 0 | OK |

#### `src/modules/payment-disputes-db`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/modules/payment-disputes-db/services/payment-disputes-db.service.spec.ts` | 10 | 10 | 0 | 0 | OK |

#### `src/modules/payments-db`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/modules/payments-db/services/fee-calculator.service.spec.ts` | 7 | 7 | 0 | 0 | OK |
| `src/modules/payments-db/services/payment-db.service.spec.ts` | 38 | 38 | 0 | 0 | OK |

#### `src/modules/professional-document-types-db`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/modules/professional-document-types-db/services/professional-document-types-db.service.spec.ts` | 4 | 4 | 0 | 0 | OK |

#### `src/modules/professional-documents-db`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/modules/professional-documents-db/helpers/professional-verification.helper.spec.ts` | 4 | 4 | 0 | 0 | OK |
| `src/modules/professional-documents-db/services/professional-documents-db.service.spec.ts` | 7 | 7 | 0 | 0 | OK |

#### `src/modules/professional-portfolio-db`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/modules/professional-portfolio-db/services/professional-portfolio-db.service.spec.ts` | 10 | 10 | 0 | 0 | OK |

#### `src/modules/professional-position-db`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/modules/professional-position-db/services/professional-position-db.service.spec.ts` | 17 | 17 | 0 | 0 | OK |

#### `src/modules/professionals-db`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/modules/professionals-db/services/professionals-db.service.spec.ts` | 34 | 34 | 0 | 0 | OK |

#### `src/modules/promotions-db`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/modules/promotions-db/services/promotions-db.service.spec.ts` | 17 | 17 | 0 | 0 | OK |

#### `src/modules/push-notifications-db`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/modules/push-notifications-db/services/fcm-tokens-db.service.spec.ts` | 5 | 5 | 0 | 0 | OK |
| `src/modules/push-notifications-db/services/push-subscriptions-db.service.spec.ts` | 5 | 5 | 0 | 0 | OK |

#### `src/modules/push-provider`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/modules/push-provider/services/fcm-provider.service.spec.ts` | 6 | 6 | 0 | 0 | OK |
| `src/modules/push-provider/services/web-push-provider.service.spec.ts` | 7 | 7 | 0 | 0 | OK |

#### `src/modules/ratings-db`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/modules/ratings-db/services/ratings-db.service.spec.ts` | 22 | 22 | 0 | 0 | OK |

#### `src/modules/report`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/modules/report/services/report.service.spec.ts` | 10 | 10 | 0 | 0 | OK |

#### `src/modules/roles-permission-db`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/modules/roles-permission-db/services/permissions-db.service.spec.ts` | 27 | 27 | 0 | 0 | OK |
| `src/modules/roles-permission-db/services/role-permissions-db.service.spec.ts` | 7 | 7 | 0 | 0 | OK |
| `src/modules/roles-permission-db/services/roles-db.service.spec.ts` | 30 | 30 | 0 | 0 | OK |
| `src/modules/roles-permission-db/services/user-permissions-db.service.spec.ts` | 18 | 18 | 0 | 0 | OK |
| `src/modules/roles-permission-db/services/user-roles-db.service.spec.ts` | 22 | 22 | 0 | 0 | OK |

#### `src/modules/service-progress-db`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/modules/service-progress-db/services/service-progress-db.service.spec.ts` | 7 | 7 | 0 | 0 | OK |

#### `src/modules/services-db`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/modules/services-db/services/services-db.service.spec.ts` | 28 | 28 | 0 | 0 | OK |

#### `src/modules/storage`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/modules/storage/specs/storage.service.spec.ts` | 4 | 4 | 0 | 0 | OK |

#### `src/modules/tax-db`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/modules/tax-db/services/tax-db.service.spec.ts` | 2 | 2 | 0 | 0 | OK |

#### `src/modules/tips-db`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/modules/tips-db/services/tips-db.service.spec.ts` | 5 | 5 | 0 | 0 | OK |

#### `src/modules/users-db`

| Suite (spec) | Casos | Pasaron | Fallaron | Omitidos | Estado |
|---|---|---|---|---|---|
| `src/modules/users-db/services/user-roles-db.service.spec.ts` | 8 | 8 | 0 | 0 | OK |
| `src/modules/users-db/services/users-db.service.spec.ts` | 42 | 42 | 0 | 0 | OK |

### Casos fallidos u omitidos

Ninguno.

## 3. Defectos encontrados

**DEF-BE-001** — Severidad: media (calidad, no funcional). Detectado por: `pnpm qa:unit` (umbral global de cobertura de `jest.config.ts`). Repro: `pnpm qa:unit`; Jest termina con código 1 pese a 1549/1549 casos en verde porque branches 66.85 % < 70 % y functions 75.74 % < 80 %. Es el incumplimiento ya presente en `develop` (66.75 / 75.72); esta rama lo mejora levemente. Estado: abierto; no se modificó el umbral ni se agregaron tests de cobertura en esta tarea.

## 4. Desvíos y observaciones

- El comando salió con código 1 únicamente por el umbral de cobertura; ningún caso falló ni fue omitido.
- Los logs `ECONNREFUSED` de Redis de nonces durante la corrida son esperados en unit (sin infraestructura) y no afectan resultados.
- La corrida unit se hizo con el árbol sin commitear (cambios: encabezados de comentario en specs, scripts QA y documentación), por eso el encabezado marca el commit base 5239119.
- Sin flakies observados (1 corrida).

## 5. Evidencia

- `coverage/lcov-report/index.html` y `coverage/coverage-summary.json` (ignorados por git; se regeneran con el comando).

## 6. Veredicto

**APROBADO CON OBSERVACIONES.** Criterio (PLAN-DE-PRUEBAS §5): 0 casos fallidos y sin defectos P0/P1; observación: DEF-BE-001, umbral de cobertura global incumplido (branches, functions), preexistente en develop.
