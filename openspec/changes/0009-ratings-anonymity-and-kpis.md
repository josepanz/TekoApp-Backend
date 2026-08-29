# Fase 0009 — Ratings: anonimato real + KPIs

**Implementada 2026-08-28.** Backlog documentado en
`TekoApp-Frontend-Mobile/openspec/decisions.md`, sección "Backlog — features grandes pedidas
2026-08-08", ítem 3 ("Ratings — anonimato solo entre cliente↔profesional... administradores ven
TODO... clientes y profesionales también tienen sus propios KPIs/dashboard").

## Alcance real (verificado contra código, mayor del que sugería el backlog original)

Se verificó el código real de `ratings.controller.ts`/`.service.ts` y
`professionals.controller.ts`/`.service.ts` antes de implementar — varios hallazgos no
coincidían con lo asumido:

1. **`isAnonymous` existía en el modelo pero nunca se aplicaba** en ningún endpoint de
   `RatingsController` — `findOne`/`findByUser`/`findByProfessional`/`findByServiceRequest`/
   `getRecentRatings`/`update`/`remove`/`reportRating` siempre devolvían `userId`/`professionalId`
   en claro, sin importar el flag.
2. **`GET /ratings` (`findAll`) no tenía ningún guard más allá de `JwtAuthGuard`** — cualquier
   usuario logueado (no solo staff) podía ver TODAS las calificaciones sin restricción. Es el
   endpoint que usa el admin de Web (`ratings-table.tsx`), pensado para verlo TODO — pero sin
   permiso de por medio.
3. **Bug real en `aggregateUserStats`** (usado por `GET /ratings/user/:userId/stats`): el
   agregado de "recibidas" filtraba `where: { professionalId: userId }` — comparaba el `Users.id`
   crudo contra la PK de `Professionals`, una tabla distinta. Daba 0 salvo coincidencia numérica
   accidental. El de "dadas" tampoco filtraba por `type`, mezclando calificaciones dadas y
   recibidas en un solo conteo.
4. **Bug más severo, fuera del módulo `ratings` pero mismo dominio**: `GET
   /professionals/:id/reviews` (`ProfessionalsService.getProfessionalReviews`) hacía
   `return result as unknown as ProfessionalReviewsListResponseDTO` — un cast crudo sin mapeo —
   filtrando la fila COMPLETA de `Users` (incluyendo `user.include: true` sin `select`) a
   CUALQUIER usuario logueado que consultara el perfil público de un profesional, ignorando
   `isAnonymous` por completo. Endpoint real, consumido hoy por
   `TekoApp-Frontend-Web` (`/pro/calificaciones`, `ReviewsTable`).

## Cambios

- `PERMISSIONS.RATINGS.AUDIT_VIEW` (`ratings.audit:read`) nuevo — mismo patrón que
  `CONTRACTS.AUDIT_VIEW`/`LEGAL.CONSENT_AUDIT_VIEW`.
- `RatingsController.findAll` — guardado con `PermissionsGuard` +
  `@Permissions(PERMISSIONS.RATINGS.AUDIT_VIEW, PERMISSIONS.ADMIN.ALL)`. Único endpoint sin
  masking (ve todo a propósito, trazabilidad legal/disputas).
- `ratings-response.helper.ts` — `RatingViewerContext` (`userId`, `professionalId` propio si
  tiene perfil, `isPrivileged`) + `isAuthor()` (determina el autor real según `type`:
  `CLIENT_TO_PROFESSIONAL` → `userId`, `PROFESSIONAL_TO_CLIENT` → `professionalId` — nunca
  comparar `viewer.userId` contra `rating.userId` a ciegas, ese campo cambia de significado según
  `type`). `mapRatingToResponse`/`mapRatingsToResponse` ahora exigen `viewer` y ponen en `null` el
  campo del autor cuando `isAnonymous && !isPrivileged && !isAuthor`.
- `RatingsService` — todos los métodos que devuelven `RatingDetailResponseDTO`(`[]`) (salvo
  `findAll`) ahora reciben `IUserDataOnJwt` y resuelven el viewer (`buildViewerContext`, incluye
  un `findProfessionalByUserId` para saber si el viewer también es profesional).
  `update`/`remove`/`reportRating` migraron su chequeo de autorización de `rating.userId !==
  userId` (roto para `PROFESSIONAL_TO_CLIENT`: comparaba el cliente calificado contra el
  profesional autor) a `isAuthor()` — **corrige un bug de autorización real**: un profesional
  nunca podía editar/eliminar una `PROFESSIONAL_TO_CLIENT` que él mismo escribió, y un cliente
  nunca podía reportar una calificación que un profesional escribió sobre él (el chequeo
  `CANNOT_REPORT_OWN` lo bloqueaba por error).
- `RatingsDbService.aggregateUserStats` — corregido a `where: { userId, type:
  CLIENT_TO_PROFESSIONAL }` (dadas) / `where: { userId, type: PROFESSIONAL_TO_CLIENT }`
  (recibidas).
- **Nuevo `GET /ratings/me/stats`** — resuelve `req.user.id` internamente, sin parámetro. Existe
  porque `GET /auth/scope` nunca expone el `id` interno del usuario (deliberado, ver
  `UserSummary` en Mobile) — sin este endpoint, un cliente no tenía forma de pedir sus propias
  estadísticas.
- `ProfessionalsDbService.findProfessionalIdByUserId` — nuevo, nunca lanza (a diferencia de
  `findByUserId`), devuelve `null` si el usuario no tiene perfil profesional.
- `professional-reviews-response.helper.ts` (nuevo) — `mapReviewToSummary`/`mapReviewsToSummaries`
  reemplazan el cast crudo: arman `ReviewSummaryResponseDTO` campo por campo (nunca la fila
  completa de `Users`) y aplican la misma regla de `isAnonymous` que `ratings.controller.ts`
  (`user: null` cuando corresponde ocultar).
- `ProfessionalsController.getProfessionalReviews`/`ProfessionalsService.getProfessionalReviews`
  — ahora reciben `IUserDataOnJwt` para resolver el viewer.

## Fuera de alcance (deliberado)

- `findClientRatings`/`findProfessionalRatings` (`GET
  /ratings/professional/:id/client-ratings`) ya excluían `isAnonymous` a nivel de query desde
  antes — no se tocó ese filtro, solo se les pasó un `viewer` real por consistencia (no cambia su
  comportamiento).
- No se rediseñó qué PII exacta se expone para una reseña NO anónima en
  `ReviewSummaryResponseDTO` (sigue con email/teléfono, tal como estaba declarado en el DTO) — se
  corrigió que la respuesta real coincida con lo declarado y que respete `isAnonymous`, no la
  política de qué mostrar cuando no es anónima (decisión de producto aparte).

## Verificado

`pnpm run build`/`lint`/`format` en 0 warnings. `pnpm run test`: 102 suites / 1221 tests en verde
(incluye tests nuevos de masking en `ratings.service.spec.ts` — autor ve su propio anónimo,
privilegiado ve todo, tercero no ve nada — y de `getProfessionalReviews` probando que la fila de
`Users` no se filtra completa, con un campo `password` de prueba en el fixture que el resultado
mapeado NO debe contener).
