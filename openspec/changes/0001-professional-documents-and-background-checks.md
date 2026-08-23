# Fase 0001 — Documentos y antecedentes del profesional

## Antes de empezar

Leer `openspec/specs/professional-documents.md` completo (modelo de datos, parametrización,
endpoints, riesgos) y `openspec/specs/data-and-media-consent.md` (guard de consentimiento que esta
fase debe usar).

## Objetivo

Implementar el modelo y los endpoints de `openspec/specs/professional-documents.md`.

## Tareas

- [ ] Migración Prisma: `DocumentTypes`, `ProfessionalDocuments`, enums `DocumentCategory`/
      `DocumentReviewStatus`. Registrar en `fn_attach_audit_triggers()`.
- [ ] `src/api/document-types/` + `src/modules/document-types-db/` — catálogo (CRUD staff + GET
      público filtrable).
- [ ] `src/api/professional-documents/` + `src/modules/professional-documents-db/` — subida,
      listado propio, listado público acotado, listado admin, endpoint de revisión.
- [ ] `RequiresActiveConsentGuard` aplicado al endpoint de subida (requiere que
      `data-and-media-consent` tenga al menos su guard base implementado — coordinar orden real de
      desarrollo, ver `openspec/README.md`).
- [ ] `ProfessionalVerificationHelper.recompute()` y su invocación desde `review` y desde el job de
      expiración.
- [ ] Job Bull de expiración automática (`ProfessionalDocuments.expiresAt < now()` → `EXPIRED`).
- [ ] Tests unitarios de los 2 servicios nuevos (happy path, 403 consentimiento, 409 revisión
      concurrente, expiración) — `jest.clearAllMocks()` en `afterEach`, nombres en español
      describiendo comportamiento.
- [ ] `pnpm run format` + `pnpm run lint --fix` en 0 warnings antes de cerrar.

## Checkpoint de salida

- [ ] Un profesional sube un documento vía `POST /professionals/me/documents`, un staff lo aprueba
      vía `PATCH /admin/professional-documents/:referenceId/review`, y
      `GET /professionals/:referenceId/documents/public` refleja el cambio.
- [ ] Intentar subir sin consentimiento vigente devuelve `403 CONSENT_REQUIRED`.
- [ ] El job de expiración pasa un documento vencido a `EXPIRED` y recomputa
      `verificationStatus` del profesional correctamente.
