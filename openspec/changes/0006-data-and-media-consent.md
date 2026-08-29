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

- [x] Migración Prisma: `LegalDocumentVersions`, `UserConsents`, `ContentConsentGrants`,
      `DataRetentionPolicies`, enums `LegalDocumentType`/`ContentUsageScope`. Aplicada contra la DB
      real de Supabase (2026-08-25, migración `20260825125059_add_legal_consents`). También se
      introdujo acá el enum `AiDisclosureEntityType` (pertenece conceptualmente a la Fase 0005) —
      ver nota en `decisions.md`.
- [x] `src/api/legal-consents/` + `src/modules/legal-consents-db/` — pendientes, aceptar, historial
      propio, revocar, CRUD staff, auditoría paginada. 2 controllers (`LegalConsentsController` +
      `AdminLegalConsentsController`), 10 endpoints, exactamente el contrato de
      `openspec/specs/data-and-media-consent.md`.
- [x] `RequiresActiveConsentGuard` — implementado en `src/api/legal-consents/guards/` (no en
      `common/`, ver nota en `decisions.md` sobre por qué), exportado desde `LegalConsentsModule`
      para que `0001`/`0002` lo apliquen importando el módulo.
- [x] Chequeo de `requiresLegalHold` antes de permitir revocación —
      `LegalConsentsService.revokeContentConsent`, `409 LEGAL_HOLD_ACTIVE`.
- [x] Amendment (2026-08-25, durante el punto 2 del roadmap): `HttpExceptionFilter` ahora expone
      `errorCode` (`CONSENT_REQUIRED`/`LEGAL_HOLD_ACTIVE`) — necesario para que el interceptor
      global de Mobile distinga estos casos de cualquier otro 403/409. Ver `decisions.md`.
- [x] Tests unitarios: 17 tests (guard: 3, servicio api: 8, servicio db: 6) cubriendo aceptación
      feliz/404/409, revocación feliz/404/409-no-dueño/409-legal-hold, y el guard bloqueando sin
      consentimiento vigente.
- [x] `pnpm run lint` + `prettier --write` en 0 warnings/errores sobre todos los archivos nuevos.
- [x] Build (`pnpm run build`) + boot real de la app confirmando que los 10 endpoints se registran
      y responden (probado un `GET /legal/consents/pending` sin token → `401` correcto a través de
      todo el pipeline, no solo compilación).

## Checkpoint de salida

- [x] Un usuario sin consentimiento vigente recibe `403 CONSENT_REQUIRED` al intentar una acción
      protegida por el guard — cubierto por test unitario del guard (no hay todavía un endpoint
      real de `0001`/`0002` migrado a usarlo, ya que esas fases no se implementaron todavía; el
      checkpoint end-to-end contra un endpoint real de subida queda para cuando se implemente `0001`
      o `0002`).
- [x] Aceptar un documento legal vigente lo refleja en `GET /legal/consents/pending`
      (desaparece de la lista) — cubierto por test unitario (`findPendingVersionsForUser` excluye
      versiones con `consents: { none: { userId } }`).
- [x] Revocar un `ContentConsentGrants` con `requiresLegalHold=true` devuelve `409
      LEGAL_HOLD_ACTIVE` en vez de ocultar el contenido silenciosamente — cubierto por test unitario.
- [ ] Pendiente de José (no automatizable): correr un flujo real contra la DB de Supabase (crear una
      `LegalDocumentVersions` vía `POST /admin/legal/document-versions`, aceptarla como usuario real,
      confirmar que desaparece de "pendientes") — la migración ya corrió contra esa DB, pero nadie
      probó el flujo HTTP completo con datos reales todavía.

## Extensión (2026-08-27) — para habilitar el punto 7 del roadmap (Web: auditoría de consentimiento)

Al verificar la spec de Web (`TekoApp-Frontend-Web/openspec/specs/data-and-media-consent-admin.md`)
contra este código real, se encontraron 2 brechas reales (no en la spec original de esta Fase):

- **`GET /admin/legal/consents` no tenía filtros** (solo paginación) pese a que la spec de Web pedía
  "filtrable por usuario, tipo de documento, país, rango de fecha" — se agregaron `documentType`,
  `countryId`, `userReferenceId` a `GetLegalConsentsAuditQueryDTO`, más filtro de rango de fecha
  sobre `acceptedAt` (ver nota abajo sobre `createdAt`).
- **No existía ningún endpoint admin para auditar `ContentConsentGrants`** (la 2da pestaña que pide
  Web) — solo había un endpoint self-service (`GET /users/me/data-consents`). Se agregó
  `GET /admin/legal/content-consents`, mismo permiso (`LEGAL.CONSENT_AUDIT_VIEW`/`ADMIN.ALL`) que el
  endpoint de `UserConsents`, filtrable por `contentType`/`usageScope`/`revoked`/`uploaderReferenceId`.
- **`UserConsentResponseDTO` no exponía `ipAddress`/`userAgent`/`acceptanceHash` ni el usuario** —
  el endpoint funcionaba en runtime (el cast crudo no los stripeaba, ver
  `ClassSerializerInterceptor`), pero el Swagger generado (y por lo tanto `pnpm generate:api-types`
  de Web) no los tenía tipados. Se creó `UserConsentAuditResponseDTO` (extiende el DTO base, no lo
  reemplaza — `POST .../accept` sigue devolviendo el DTO original sin cambios de contrato) con
  mapeo explícito en `helpers/legal-consents-response.helper.ts` en vez de cast crudo, porque estos
  campos son sensibles (ver `openspec/specs/data-and-media-consent.md`, Riesgos).
- **`PrismaPaginationUtil` aplica cualquier `startDate`/`endDate` incondicionalmente sobre una
  columna `createdAt`** — ni `UserConsents` ni `ContentConsentGrants` tienen esa columna (solo
  `acceptedAt`/`grantedAt`). Se resolvió sin tocar el util compartido: los 2 métodos nuevos de
  `LegalConsentsDbService` arman su propio `where` con el rango de fecha sobre el campo correcto, y
  eliminan `startDate`/`endDate`/los demás filtros anidados del objeto que recibe `paginate` (para
  que no intente aplicarlos de nuevo sobre `createdAt`).
- Rol "compliance": José confirmó (roadmap, punto 7) que los permisos `LEGAL.CONFIG_MANAGE`/
  `LEGAL.CONSENT_AUDIT_VIEW` van tanto al rol `admin` existente como a un rol `compliance` nuevo —
  **tarea de datos/seed pendiente, no de código** (mismo tratamiento que
  `service-progress.audit:read` en la Fase 0002).
- Tests: 8 tests nuevos (4 en `legal-consents-db.service.spec.ts`, 4 en `legal-consents.service.spec.ts`)
  cubriendo el armado del `where` anidado y el mapeo explícito. `pnpm run lint`/`pnpm run build`/
  `pnpm run test` en 0 errores/warnings (96 suites, 1161 tests).
