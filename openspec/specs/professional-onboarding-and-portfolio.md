# Spec: Onboarding de profesional y portafolio de trabajos

Web: `TekoApp-Frontend-Web/openspec/specs/professional-onboarding-and-portfolio.md`.
Mobile: `TekoApp-Frontend-Mobile/openspec/specs/professional-onboarding-and-portfolio.md`.
Reportado por José 2026-09-01: un cliente recién registrado no tenía ninguna forma visible de
convertirse en profesional en Web (Mobile sí), ni existía un portafolio real de fotos de trabajos
previos (solo una categoría de documento genérica reusando el flujo de compliance).

## Estado real relevado (2026-09-01, antes de escribir esta spec)

- `POST /professionals` YA existe y es self-service
  (`src/api/professionals/controllers/professionals.controller.ts`) — solo `JwtAuthGuard`, sin
  gate de rol. Cualquier usuario logueado puede convertirse en profesional `PENDING` hoy. Mobile
  ya lo consume (`/profesional/onboarding`); Web no tenía ninguna UI que lo llamara (resuelto en
  la Fase 1 de Web).
- `POST /professionals/me/documents` (compliance: antecedentes, títulos, portafolio-viejo) ya
  existe y funciona, pero requiere que el `Professionals` ya exista. Mobile lo consume; Web no
  tenía UI de subida para el propio profesional (resuelto en la Fase 2 de Web).
- **Bug de seguridad encontrado durante el relevamiento** (no reportado por José, hallazgo propio
  de esta sesión, ya corregido en la Fase 0): `POST /professionals/:id/verify` y
  `POST /professionals/:id/suspend` solo decían "solo admin" en el summary de Swagger — no tenían
  `PermissionsGuard`/`@Roles` real. Cualquier usuario autenticado podía aprobar o suspender a
  cualquier profesional.

## Objetivo

1. ✅ Cerrar el gap de seguridad de `verify`/`suspend` (Fase 0).
2. ✅ Dar a Web la misma capacidad de auto-postulación que Mobile ya tenía (Fases 1-2 de Web, sin
   cambios de backend).
3. ✅ Agregar un llamado a la acción ("¿Querés trabajar con nosotros?") en el home de Web y Mobile
   (Fase 3, sin cambios de backend).
4. ✅ Reemplazar la categoría `PORTFOLIO` (documento único, flujo de compliance) por un modelo de
   galería real: múltiples fotos, caption opcional, **con revisión de staff antes de publicarse**
   (Fase 4 — decisión de producto confirmada por José 2026-09-02: "revisión del staff", no
   publicación inmediata como se había asumido inicialmente al escribir esta spec).

## Fuera de alcance

- Rediseñar el flujo de aprobación de documentos de compliance ya existente (antecedentes,
  títulos) — sigue igual.
- Un rol `PROFESSIONAL`/`CLIENT` formal — el "modo" sigue derivándose de la existencia de un
  `Professionals` vinculado.
- Verificación automática de documentos/antecedentes contra un organismo oficial.

## Fase 0 — Fix de seguridad: guard real en verify/suspend ✅ CERRADA

Ver PR #41. Permiso nuevo `PERMISSIONS.PROFESSIONALS.VERIFY` (OR `admin:all`) vía `PermissionsGuard`
en `POST /professionals/:id/verify` y `:id/suspend`. Tests nuevos (`permissions.guard.spec.ts` +
metadata en `professionals.controller.spec.ts`). 110 suites/1264 tests en verde.

## Fase 1-3 — Ningún cambio de backend

Ver specs de Web y Mobile — reusan `POST /professionals` y `POST /professionals/me/documents`, ya
existentes.

## Fase 4 — Modelo de portafolio de trabajos ✅ CERRADA (con revisión de staff)

**Decisión de producto confirmada por José 2026-09-02: "revisión del staff"** — cada foto pasa por
el mismo flujo `PENDING → APPROVED/REJECTED` que los documentos de compliance antes de aparecer en
el perfil público del profesional, con un `isVisible` adicional para que el propio profesional
pueda ocultar una foto ya aprobada sin pedirle nada a staff.

### Modelo `ProfessionalPortfolioItems` (implementado)

```prisma
enum PortfolioReviewStatus {
  PENDING
  APPROVED
  REJECTED
}

model ProfessionalPortfolioItems {
  id              Int                   @id @default(autoincrement())
  referenceId     String                @unique @default(uuid())
  professionalId  Int
  fileKey         String
  caption         String?
  sortOrder       Int                   @default(0)
  isVisible       Boolean               @default(true)
  status          PortfolioReviewStatus @default(PENDING)
  reviewedAt      DateTime?
  reviewedBy      String?
  rejectionReason String?
  // + columnas de auditoría estándar (id/referenceId/createdBy/changeSignature/checksum)
}
```

Migración `20260902004052_add_professional_portfolio` — **aplicada contra Supabase** (autorización
explícita de José, misma sesión). Sin drift, `prisma migrate status` limpio antes y después.

### Endpoints implementados

- `POST /professionals/me/portfolio` (multipart, campo `file` + `caption` opcional) — gateado por
  `RequiresActiveConsentGuard` + `LegalDocumentType.IMAGE_USAGE_CONSENT` (mismo criterio que
  `service-progress`: subir una foto de uso público exige consentimiento vigente de imagen).
- `GET /professionals/me/portfolio` — propio, todos los estados y visibilidad.
- `PATCH /professionals/me/portfolio/:referenceId` — el dueño edita `caption`/`sortOrder`/
  `isVisible` (nunca el archivo — para cambiar la foto en sí, borrar y volver a subir).
- `DELETE /professionals/me/portfolio/:referenceId` — el dueño borra (hard delete, sin necesidad de
  retener historial legal como sí exige un documento de compliance).
- `GET /professionals/:referenceId/portfolio/public` — solo `APPROVED` + `isVisible: true`.
- `GET /admin/professional-portfolio` — cola de revisión de staff, paginada, filtrable por
  `status`. Permiso `PERMISSIONS.PROFESSIONAL_PORTFOLIO.REVIEW` (OR `admin:all`).
- `PATCH /admin/professional-portfolio/:referenceId/review` — aprobar/rechazar (`rejectionReason`
  obligatorio si `REJECTED`), TOCTOU-safe (`updateStatusConditional` desde `PENDING` únicamente).

### Decisiones tomadas al implementar

- **Sin `ProfessionalVerificationHelper.recompute()`**: ese helper es 100% específico de
  `requiredDocumentsVerified` (derivado de `ProfessionalDocumentTypes.isRequired`, un concepto de
  catálogo que el portafolio no tiene). No hay ningún flag agregado equivalente para portafolio —
  cada foto se aprueba/rechaza de forma independiente, sin agregación.
- **`DocumentCategory.PORTFOLIO` queda intacto, sin nuevos usos**: no se tocó
  `ProfessionalDocumentTypes`/`ProfessionalDocuments` — son un flujo de compliance completamente
  aparte. Si en el futuro se confirma que ninguna fila real usa `category = PORTFOLIO`, es
  candidato a limpieza, pero no se tocó en esta fase (fuera de alcance, no confirmado).
- **`PORTFOLIO_ALLOWED_MIME_TYPES`** (`image/jpeg`, `image/png`, `image/webp`) nuevo en
  `uploads.const.ts` — a diferencia de `ALLOWED_MIME_TYPES` (compliance, admite PDF/Word), el
  portafolio son fotos, nunca un documento.
- **`fn_attach_audit_triggers()`** re-invocado en la migración — `professional_portfolio_items`
  califica (tiene `id`+`created_by`+`change_signature`).

Gates en verde: 111 suites / 1280 tests, `pnpm run lint`/`format` 0 warnings, boot real contra
Supabase confirmando rutas mapeadas + conexión + migración aplicada sin drift.

## Checkpoint de salida (Backend) — Fase 4

- [x] Un usuario sin permiso de verificación recibe 403 al llamar `verify`/`suspend`; un admin
      real sigue pudiendo.
- [x] Un profesional puede subir, listar, editar (caption/orden/visibilidad) y borrar sus propias
      fotos de portafolio.
- [x] Cualquiera con sesión puede ver el portafolio visible (aprobado + no oculto) de un
      profesional por su `referenceId`.
- [x] Staff aprueba/rechaza cada foto individualmente vía la cola de revisión.
