# Fase 0002 — Bitácora de trabajo ("paso a paso")

## Antes de empezar

Leer `openspec/specs/work-progress-log.md` completo, en particular la "Decisión de alcance abierta
para José" sobre visibilidad de staff — confirmar antes de decidir si esta fase agrega algo del
lado admin o no.

## Objetivo

Implementar el modelo y los endpoints de `openspec/specs/work-progress-log.md`.

## Tareas

- [x] Migración Prisma: `ServiceProgressEntries`, campo `Category.requiresProgressLog` (corrida
      contra Postgres local, `20260827150844_add_service_progress_entries`).
- [x] `src/api/service-progress/` + `src/modules/service-progress-db/` — crear/listar/soft-delete.
- [x] Config nueva en `core/config` (JOI): `progressLog.maxImagesPerEntry`,
      `progressLog.editWindowMinutes`, `progressLog.requireNoteOrImage`.
- [x] Extender `completeService` (`services.service.ts`) con la validación
      `PROGRESS_LOG_REQUIRED` cuando `category.requiresProgressLog`.
- [x] Consentimiento de imagen — implementado inline (no como guard estático), condicional a
      `images.length > 0` — ver nota de corrección en `openspec/specs/work-progress-log.md`.
- [x] Tests unitarios (happy path, 409 `EDIT_WINDOW_EXPIRED`/`SERVICE_NOT_IN_PROGRESS`, 400
      `PROGRESS_LOG_REQUIRED`/`NOTE_OR_IMAGE_REQUIRED`/`TOO_MANY_IMAGES`, 403 consentimiento y
      autorización de listado, incluido el caso de staff con permiso de auditoría).
- [x] `pnpm run format` + `pnpm run lint` en 0 warnings — y `pnpm run test` completo (90 suites /
      1122 tests) en verde.
- [ ] Permiso `service-progress.audit:read` sin asignar a ningún rol todavía — asignarlo al rol de
      staff/compliance correspondiente es una tarea de datos (seed/admin), no de código; queda
      pendiente de que José confirme a qué rol.

## Checkpoint de salida

- [x] Un profesional agrega una entrada con fotos durante un servicio `IN_PROGRESS`; el cliente la
      ve vía `GET /services/:id/progress` (verificado con tests unitarios — falta smoke test
      manual contra el backend corriendo, ver Web/Mobile pendientes abajo).
- [x] Eliminar una entrada dentro de la ventana de edición funciona; pasada la ventana, `409`.
- [x] Completar un servicio de una categoría con `requiresProgressLog=true` sin ninguna entrada
      falla con `400 PROGRESS_LOG_REQUIRED`.
- [x] Web: sección de bitácora en `src/app/admin/services/[id]` (no una pestaña separada — no hay
      patrón de Tabs en ese repo, se agregó como `Card` adicional). Gate client-side por permiso
      (`service-progress.audit:read` sin asignar a ningún rol todavía) — ver
      `TekoApp-Frontend-Web/openspec/decisions.md`.
- [ ] Mobile (Fase 0008): no implementado en esta sesión — su spec asumía `images[]` ya subidas por
      separado, lo cual sigue siendo correcto tras la corrección de esta spec (multipart → 2 pasos).
