# Fase 0002 — Bitácora de trabajo ("paso a paso")

## Antes de empezar

Leer `openspec/specs/work-progress-log.md` completo, en particular la "Decisión de alcance abierta
para José" sobre visibilidad de staff — confirmar antes de decidir si esta fase agrega algo del
lado admin o no.

## Objetivo

Implementar el modelo y los endpoints de `openspec/specs/work-progress-log.md`.

## Tareas

- [ ] Migración Prisma: `ServiceProgressEntries`, campo `Category.requiresProgressLog`.
- [ ] `src/api/service-progress/` + `src/modules/service-progress-db/` — crear/listar/soft-delete.
- [ ] Config nueva en `core/config` (JOI): `progressLog.maxImagesPerEntry`,
      `progressLog.editWindowMinutes`, `progressLog.requireNoteOrImage`.
- [ ] Extender `completeService` (`services.service.ts`) con la validación
      `PROGRESS_LOG_REQUIRED` cuando `category.requiresProgressLog`.
- [ ] `RequiresActiveConsentGuard` en el endpoint de subida.
- [ ] Tests unitarios (happy path, 409 `EDIT_WINDOW_EXPIRED`, 400 `PROGRESS_LOG_REQUIRED`, 403
      consentimiento).
- [ ] `pnpm run format` + `pnpm run lint --fix` en 0 warnings.

## Checkpoint de salida

- [ ] Un profesional agrega una entrada con fotos durante un servicio `IN_PROGRESS`; el cliente la
      ve vía `GET /services/:referenceId/progress`.
- [ ] Eliminar una entrada dentro de la ventana de edición funciona; pasada la ventana, `409`.
- [ ] Completar un servicio de una categoría con `requiresProgressLog=true` sin ninguna entrada
      falla con `400 PROGRESS_LOG_REQUIRED`.
