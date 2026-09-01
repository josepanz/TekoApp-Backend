# Fase 0012 — Onboarding de profesional (Web) y portafolio de trabajos

Spec de diseño, NO implementada todavía. Contrato completo:
`openspec/specs/professional-onboarding-and-portfolio.md`.

## Antes de empezar

Leer `openspec/specs/professional-onboarding-and-portfolio.md` completo — en particular la
sección "Estado real relevado", que confirma que `POST /professionals` y
`POST /professionals/me/documents` YA son self-service y no necesitan cambios de backend para las
Fases 1-3 (esas fases son 100% Web/Mobile). La única fase con trabajo real de backend es la 0 (fix
de seguridad, aislado) y la 4 (portafolio, modelo nuevo).

## Objetivo

Cerrar el gap de seguridad en `verify`/`suspend`, y construir el modelo de portafolio de trabajos
que hoy no existe (`DocumentCategory.PORTFOLIO` reusa el flujo de compliance de un solo archivo,
no una galería real).

## Tareas

- [ ] **Fase 0 (urgente, aislada)**: guard real (`PermissionsGuard`) en
      `POST /professionals/:id/verify` y `POST /professionals/:id/suspend` — hoy cualquier usuario
      autenticado puede llamarlos.
- [ ] **Fase 4**: modelo `ProfessionalPortfolioItems` + migración + endpoints CRUD + público — ver
      detalle completo en la spec. Confirmar con José, ANTES de implementar, la decisión de
      moderación (staff vs. publicación inmediata) — esta spec asume publicación inmediata.
- [ ] Tests unitarios + e2e del módulo nuevo, 0 warnings de lint/format.

## Checkpoint de salida

- [ ] Un usuario sin permiso recibe 403 en `verify`/`suspend`; un admin real sigue pudiendo.
- [ ] Un profesional sube/lista/reordena/oculta/borra sus fotos de portafolio vía la API.
- [ ] El portafolio visible de un profesional es consultable públicamente por `referenceId`.
