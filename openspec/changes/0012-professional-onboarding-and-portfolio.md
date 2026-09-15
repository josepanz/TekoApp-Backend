# Fase 0012 — Onboarding de profesional (Web) y portafolio de trabajos

Contrato completo: `openspec/specs/professional-onboarding-and-portfolio.md`.

## Objetivo

Cerrar el gap de seguridad en `verify`/`suspend`, y construir el modelo de portafolio de trabajos
que no existía (`DocumentCategory.PORTFOLIO` reusaba el flujo de compliance de un solo archivo, no
una galería real).

## Tareas

- [x] **Fase 0**: guard real (`PermissionsGuard`) en `POST /professionals/:id/verify` y
      `:id/suspend` — PR #41.
- [x] **Fase 4**: modelo `ProfessionalPortfolioItems` + migración + endpoints CRUD + revisión de
      staff + público. Decisión de moderación confirmada por José 2026-09-02: revisión de staff
      (no publicación inmediata). Migración aplicada contra Supabase con autorización explícita.
- [x] Tests unitarios del módulo nuevo (22 tests), 0 warnings de lint/format. 111 suites/1280
      tests totales en verde. Boot real confirmando rutas + conexión + migración sin drift.

## Checkpoint de salida

- [x] Un usuario sin permiso recibe 403 en `verify`/`suspend`; un admin real sigue pudiendo.
- [x] Un profesional sube/lista/edita/borra sus fotos de portafolio vía la API.
- [x] Staff aprueba/rechaza cada foto; solo lo aprobado y visible aparece en el endpoint público.
