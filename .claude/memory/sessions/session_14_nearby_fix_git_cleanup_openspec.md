# Sesión 14 — 2026-08-23 — Fix nearby-professionals, limpieza de historia (recaída), openspec nuevo

## Qué se hizo

Sesión larga trabajada principalmente desde `TekoApp-Frontend-Mobile`, tocando este repo en 3
puntos puntuales.

### 1. Fix real: `GET /locations/nearby` devolvía la fila cruda de Postgres (PR #32)

`$queryRaw` (usado para el Haversine) nunca pasa por el `$extends` de Prisma que normaliza el
resto de la API — el endpoint devolvía snake_case y `NUMERIC` como string, no el contrato
camelCase/number que el resto de la API promete. Encontrado al construir el mapa de cercanos en
mobile. Fix: `NearbyProfessionalRow` (tipo de la fila cruda) + `NearbyProfessionalResponseDTO` +
mapper (`mapNearbyProfessionalRow`) en `locations.service.ts`.

### 2. Recaída del trailer `Co-Authored-By: Claude` — limpiado de nuevo, `develop` reescrito

La Sesión 13 (2026-07-20) ya había limpiado todo el historial con `git-filter-repo`, pero un
commit del 2026-08-08 (`fix: allow a second partial refund on the same payment`) volvió a traer la
trailer — confirma que el filtro limpia lo ya existente pero no evita que se vuelva a colar en
commits futuros (ver `[[feedback_no_coauthor_claude_trailer]]` en memoria persistente). Se
re-corrió `git filter-repo --force --message-callback` sobre `develop` (después de mergear las PRs
abiertas de ese momento, para no dejarlas con conflictos de base) y se force-pusheó. **`master`/
`qa` NO se tocaron** — quedó pedido explícitamente acotado a `develop` por ahora.

Nota operativa para la próxima vez que se repita: `filter-repo` reescribe TODOS los refs locales
alcanzables (no solo la rama activa) y borra el remote `origin` como medida de seguridad — hay que
re-agregarlo antes de poder pushear, y resetear `master`/`qa` locales a su versión de origin
después (`git fetch origin master qa && git branch -f master origin/master && git branch -f qa origin/qa`)
si no se los quiere tocar, porque el rewrite también los toca localmente de paso.

### 3. Nuevo: `openspec/` (SDD) para las 6 features del backlog 2026-08-22

José pidió documentar (NO implementar) 6 features grandes: documentos/antecedentes del
profesional, bitácora de trabajo, presupuestos multi-opción, contratos desde presupuesto,
disclosure de IA, protección de datos/imágenes. Este repo no tenía la convención `openspec/` que
ya usa `TekoApp-Frontend-Mobile` — se creó por primera vez acá (`README.md`, `project.md`,
`decisions.md`, `specs/` con 6 contratos de dominio, `changes/0001`-`0006` con los planes de fase).

**Error a mitad de tarea, corregido**: un agente delegado para escribir esto primero lo puso en
`docs/specs/` — `docs/` en este repo está reservado para el output auto-generado de compodoc (ver
`CLAUDE.md`/`.claude/CLAUDE.md`), quedó mezclado con basura autogenerada. Corregido mandándole un
mensaje de continuación al mismo agente (no relanzando uno nuevo) para que migrara todo a
`openspec/` y borrara lo mal ubicado — confirmado que `docs/` quedó intacto.

## Estado al cierre

`pnpm lint`/`test`/`build` verdes en el fix de nearby (PR #32, ya mergeado). `develop` con historia
limpia (0 commits con la trailer). PR de `openspec/` (esta sesión) pendiente de push/PR/merge al
momento de escribir esto.

## Pendiente para la próxima sesión

- Cablear los triggers de negocio reales hacia `NotificationsService.create()` — hoy ningún flujo
  (aceptar servicio, pago recibido, etc.) dispara una notificación/push realmente, la
  infraestructura está lista pero nada la usa (encontrado desde el lado mobile de la Fase 0005).
- Implementar las 6 features documentadas en `openspec/changes/0001`-`0006` cuando se priorice.
- Promoción `develop → qa → master` pedida por José en esta misma sesión, en curso.
