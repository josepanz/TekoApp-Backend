# Spec: Onboarding de profesional y portafolio de trabajos

Web: `TekoApp-Frontend-Web/openspec/specs/professional-onboarding-and-portfolio.md`.
Mobile: `TekoApp-Frontend-Mobile/openspec/specs/professional-onboarding-and-portfolio.md`.
Reportado por José 2026-09-01: un cliente recién registrado no tiene ninguna forma visible de
convertirse en profesional en Web (Mobile sí, ver más abajo), ni existe un portafolio real de
fotos de trabajos previos (solo una categoría de documento genérica reusando el flujo de
compliance).

## Estado real relevado (2026-09-01, antes de escribir esta spec)

- `POST /professionals` YA existe y es self-service
  (`src/api/professionals/controllers/professionals.controller.ts`) — solo `JwtAuthGuard`, sin
  gate de rol. Cualquier usuario logueado puede convertirse en profesional `PENDING` hoy. Mobile
  ya lo consume (`/profesional/onboarding`); Web no tiene ninguna UI que lo llame.
- `POST /professionals/me/documents` (compliance: antecedentes, títulos, portafolio) ya existe y
  funciona, pero requiere que el `Professionals` ya exista (`professionalsDb.findByUserId(userId)`
  lanza si no hay). Mobile lo consume (`lib/features/professional_documents/`); Web solo tiene la
  cola de revisión de staff (`src/features/professional-documents/`), cero UI de subida para el
  propio profesional.
- `DocumentCategory.PORTFOLIO` ya existe en `ProfessionalDocumentTypes`, pero reusa el mismo
  modelo de documento único con revisión de staff que antecedentes/certificaciones — no hay una
  galería real de "trabajos previos" (múltiples fotos, sin revisión obligatoria, pensada para
  mostrar calidad, no para cumplimiento).
- **Bug de seguridad encontrado durante el relevamiento** (no reportado por José, hallazgo propio
  de esta sesión): `POST /professionals/:id/verify` y `POST /professionals/:id/suspend`
  solo dicen "solo admin" en el summary de Swagger — no tienen `PermissionsGuard`/`@Roles` real.
  Cualquier usuario autenticado puede aprobar o suspender a CUALQUIER profesional hoy. Corregir en
  la Fase 0 de este plan, aislado del resto.
- No existe `PROFESSIONAL`/`CLIENT` como rol formal en `Roles`/`UserRoles` — el "modo" de un
  usuario se deriva solo de si tiene un `Professionals` vinculado por `userId`. Esta spec no
  cambia eso.

## Objetivo

1. Cerrar el gap de seguridad de `verify`/`suspend` (Fase 0, urgente, aislado).
2. Dar a Web la misma capacidad de auto-postulación que Mobile ya tiene (Fase 1-2, sin cambios de
   backend — documentado acá solo para dejar constancia).
3. Agregar un llamado a la acción ("¿Querés trabajar con nosotros?") en el home de Web y Mobile
   (Fase 3, sin cambios de backend).
4. Reemplazar la categoría `PORTFOLIO` (documento único, flujo de compliance) por un modelo de
   galería real: múltiples fotos, caption opcional, sin revisión obligatoria de staff (Fase 4,
   backend nuevo — desbloquea la Fase 5 de Web/Mobile).

## Fuera de alcance

- Rediseñar el flujo de aprobación de documentos de compliance ya existente (antecedentes,
  títulos) — sigue igual.
- Un rol `PROFESSIONAL`/`CLIENT` formal — el "modo" sigue derivándose de la existencia de un
  `Professionals` vinculado.
- Verificación automática de documentos/antecedentes contra un organismo oficial.

## Fase 0 — Fix de seguridad: guard real en verify/suspend

**Sin dependencias. Aislado — se puede mergear el mismo día, independientemente del resto.**

- [ ] Agregar `PermissionsGuard` + permiso (confirmar el nombre exacto contra
      `src/common/enum/permissions.enum.ts` — reusar uno existente de profesionales si aplica, o
      agregar uno nuevo tipo `PROFESSIONALS_VERIFY`) a `POST /professionals/:id/verify` y
      `POST /professionals/:id/suspend`.
- [ ] Test: un usuario sin el permiso recibe 403 al intentar verificar/suspender.
- [ ] Test de regresión: un admin real sigue pudiendo — no romper el flujo de aprobación manual ya
      usado en `openspec/changes/0001-professional-documents-and-background-checks.md`.

## Fase 1 — Postulación de profesional: ningún cambio de backend

`POST /professionals` y `GET /professionals/me` ya cubren esto — Web solo necesita consumirlos
(ver spec de Web). Este ítem existe acá solo para dejar constancia de que NO hace falta tocar el
backend.

## Fase 2 — Subida de documentos: ningún cambio de backend

Mismo caso: `POST /professionals/me/documents`, `GET /professionals/me/documents` ya existen — Web
solo necesita construir la UI (ver spec de Web).

## Fase 3 — CTA de home: sin cambios de backend

Puramente frontend (copy + navegación) en Web y Mobile.

## Fase 4 — Modelo de portafolio de trabajos (nuevo, backend)

**Decisión explícita a confirmar con José antes de implementar** (no asumir): ¿el portafolio
necesita moderación de staff (como hoy, vía `DocumentCategory.PORTFOLIO`) o es de publicación
inmediata al subir (más simple, más rápido para poblar la demo, con un `isVisible` reactivo para
ocultar algo inapropiado después)? Esta spec asume **publicación inmediata + `isVisible` para
ocultado manual reactivo (sin pre-moderación)** — es una decisión de producto, no técnica, que hay
que confirmar antes de tocar código.

### Modelo nuevo `ProfessionalPortfolioItems`

```prisma
model ProfessionalPortfolioItems {
  id             Int      @id @default(autoincrement())
  referenceId    String   @unique @default(uuid()) @map("reference_id")
  professionalId Int      @map("professional_id")
  professional   Professionals @relation(fields: [professionalId], references: [id])
  fileKey        String   @map("file_key")
  caption        String?
  sortOrder      Int      @default(0) @map("sort_order")
  isVisible      Boolean  @default(true) @map("is_visible")
  // + columnas de auditoría estándar (createdAt/createdBy/lastChangedAt/lastChangedBy)
  @@map("professional_portfolio_items")
}
```

- [ ] Migración Prisma (`id` interno + `referenceId` público, ver
      `.claude/rules/database-conventions.md`).
- [ ] `POST /professionals/me/portfolio` — multipart, un archivo por request (mismo patrón de
      `professional-documents`, límite `MAX_FILE_SIZE` existente), `caption` opcional.
- [ ] `GET /professionals/me/portfolio` — propio, incluye ocultos.
- [ ] `DELETE /professionals/me/portfolio/:referenceId` — solo el dueño.
- [ ] `PATCH /professionals/me/portfolio/:referenceId` — reordenar (`sortOrder`) / ocultar
      (`isVisible`).
- [ ] `GET /professionals/:referenceId/portfolio` — público, solo `isVisible: true`, mismo patrón
      de URL presignada temporal que `professional-documents` (nunca persistir la URL resuelta).
- [ ] Antes de decidir si hace falta migrar datos: `SELECT count(*) FROM professional_documents
      WHERE category = 'PORTFOLIO'` — si hay filas reales, decidir si se migran o se dejan como
      están (deprecated) junto con José.
- [ ] Documentar en `decisions.md`: ¿se deja `DocumentCategory.PORTFOLIO` en el enum por
      compatibilidad (deprecated, sin nuevos usos) o se elimina? No eliminar sin confirmar que
      ningún dato real lo usa.
- [ ] Tests unitarios (service, controller) + `pnpm run test:e2e` del módulo nuevo.
- [ ] `pnpm run lint --fix` + `pnpm run format` en 0 warnings.

## Checkpoint de salida (Backend)

- [ ] Un usuario sin permiso de verificación recibe 403 al llamar `verify`/`suspend`; un admin
      real sigue pudiendo.
- [ ] Un profesional puede subir, listar, reordenar, ocultar y borrar sus propias fotos de
      portafolio.
- [ ] Cualquiera puede ver el portafolio visible de un profesional por su `referenceId`.
- [ ] `openspec/decisions.md` documenta la decisión de moderación (inmediata vs. staff) y el
      destino de `DocumentCategory.PORTFOLIO`.
