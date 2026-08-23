# Fase 0006 — Protección de datos, imágenes y su uso

**Spec más fundacional de las 6 — recomendado implementar su esqueleto de schema/config ANTES que
`0001`/`0002`/`0003`/`0005` en la práctica**, aunque se numera último por ser el orden en que José
pidió las features. Ver `openspec/README.md`.

## Antes de empezar

Leer `openspec/specs/data-and-media-consent.md` completo — es la base de consentimiento que usan
`professional-documents.md`, `work-progress-log.md` y potencialmente `multi-option-quotes.md`.

## Objetivo

Implementar el modelo y los endpoints de `openspec/specs/data-and-media-consent.md`.

## Tareas

- [ ] Migración Prisma: `LegalDocumentVersions`, `UserConsents`, `ContentConsentGrants`,
      `DataRetentionPolicies`, enums `LegalDocumentType`/`ContentUsageScope`.
- [ ] `src/api/legal-consents/` + `src/modules/legal-consents-db/` — pendientes, aceptar, historial
      propio, revocar, CRUD staff, auditoría.
- [ ] `RequiresActiveConsentGuard` reusable en `common/` (decorator + guard) — implementarlo acá
      primero, aplicarlo después en `0001`/`0002`.
- [ ] Job/chequeo de `requiresLegalHold` antes de permitir revocación.
- [ ] Tests unitarios (aceptación, revocación permitida vs. bloqueada por legal hold, guard
      bloqueando una subida sin consentimiento).
- [ ] `pnpm run format` + `pnpm run lint --fix` en 0 warnings.

## Checkpoint de salida

- [ ] Un usuario sin consentimiento vigente recibe `403 CONSENT_REQUIRED` al intentar una acción
      protegida por el guard (probar contra un endpoint real ya migrado a usarlo, o un endpoint de
      prueba si `0001`/`0002` todavía no están implementadas).
- [ ] Aceptar un documento legal vigente lo refleja en `GET /legal/consents/pending`
      (desaparece de la lista).
- [ ] Revocar un `ContentConsentGrants` con `requiresLegalHold=true` devuelve `409
      LEGAL_HOLD_ACTIVE` en vez de ocultar el contenido silenciosamente.
