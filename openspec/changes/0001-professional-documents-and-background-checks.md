# Fase 0001 — Documentos y antecedentes del profesional

## Antes de empezar

Leer `openspec/specs/professional-documents.md` completo (modelo de datos, parametrización,
endpoints, riesgos) y `openspec/specs/data-and-media-consent.md` (guard de consentimiento que esta
fase debe usar).

## Objetivo

Implementar el modelo y los endpoints de `openspec/specs/professional-documents.md`.

## Tareas

- [x] Migración Prisma: `ProfessionalDocumentTypes`, `ProfessionalDocuments`, enums `DocumentCategory`/
      `DocumentReviewStatus`. Registrado en `fn_attach_audit_triggers()` (solo `professional_documents`
      califica — `professional_document_types` no tiene `change_signature`, a propósito, mismo
      criterio que `AiContentDisclosures`).
- [x] `src/api/professional-document-types/` + `src/modules/professional-document-types-db/` — catálogo (CRUD staff + GET
      público filtrable, NO paginado — ver `decisions.md`).
- [x] `src/api/professional-documents/` + `src/modules/professional-documents-db/` — subida,
      listado propio, listado público acotado, listado admin, endpoint de revisión.
- [x] `RequiresActiveConsentGuard` aplicado al endpoint de subida — `DATA_PROCESSING_CONSENT` (no
      `IMAGE_USAGE_CONSENT`, ver `decisions.md`).
- [x] `ProfessionalVerificationHelper.recompute()` y su invocación desde `review`, el job de
      expiración, y la auto-aprobación al subir (`requiresStaffReview=false`).
- [x] Job de expiración automática — `@Cron` diario, no un `@Processor` de Bull (corrección a la
      spec original, ver `decisions.md`); reusa la cola real de notificaciones para el aviso.
- [x] Tests unitarios de los 2 servicios nuevos + helper de verificación + job de expiración (32
      tests: happy path, 403/404 aplicabilidad, 409 revisión concurrente, expiración, TOCTOU) —
      `jest.clearAllMocks()` en `afterEach`, nombres en español describiendo comportamiento.
- [x] `pnpm run format` + `pnpm run lint` en 0 warnings — y `pnpm run test` completo (96 suites,
      1154 tests) en verde.

## Checkpoint de salida

- [x] Un profesional sube un documento vía `POST /professionals/me/documents`, un staff lo aprueba
      vía `PATCH /admin/professional-documents/:referenceId/review`, y
      `GET /professionals/:referenceId/documents/public` refleja el cambio (verificado con tests
      unitarios — falta smoke test manual contra el backend corriendo con datos reales).
- [x] Intentar subir sin consentimiento vigente devuelve `403 CONSENT_REQUIRED` (guard verificado
      en Fase 0006, reusado tal cual acá).
- [x] El job de expiración pasa un documento vencido a `EXPIRED` y recomputa
      `verificationStatus` del profesional correctamente.
- [x] Mobile (Fase 0007): implementado en esta misma sesión.
- [ ] Web (Fase 0001): en curso — se agregó `GET /admin/professional-documents` (cola global
      paginada), endpoint que la spec original no tenía y que Web necesita de verdad (ver
      `decisions.md`).
