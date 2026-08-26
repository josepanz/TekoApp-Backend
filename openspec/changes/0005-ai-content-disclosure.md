# Fase 0005 — Disclosure de contenido generado por IA

## Antes de empezar

Leer `openspec/specs/ai-content-disclosure.md` completo — en particular el límite explícito de que
esta fase NO integra ningún proveedor de IA, solo el esqueleto de disclosure.

## Objetivo

Implementar el modelo y los endpoints de `openspec/specs/ai-content-disclosure.md`.

## Tareas

- [x] Migración Prisma: `AiContentDisclosures`, enums `AiDisclosureEntityType`/
      `AiDisclosureSource`.
- [x] `src/api/ai-disclosures/` + `src/modules/ai-disclosures-db/` — `PUT`/`DELETE`/`GET` puntual +
      `GET /admin/ai-disclosures` paginado.
- [x] Config nueva en `core/config`: `aiDisclosure.userDeclarableTypes`.
- [x] Helper `AiDisclosureHelper.registerPlatformDisclosure()` exportado desde `modules/` para uso
      futuro de otras features (sin caller real todavía — documentarlo como preparado, no usado).
- [x] Claves i18n nuevas para los textos de disclosure visibles (es/en).
- [x] Tests unitarios (auto-declaración propia vs. de otro usuario → 403, tipo no declarable →
      400).
- [x] `pnpm run format` + `pnpm run lint --fix` en 0 warnings.

## Checkpoint de salida

- [x] Un usuario declara su propio contenido como asistido por IA vía `PUT /ai-disclosures` y
      `GET /ai-disclosures/:entityType/:entityReferenceId` lo refleja.
- [x] Intentar declarar disclosure sobre contenido de otro usuario devuelve `403`.
- [x] `GET /admin/ai-disclosures` devuelve el listado paginado consumible por el panel de Web.
