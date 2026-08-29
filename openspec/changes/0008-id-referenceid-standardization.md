# Fase 0008 — id/referenceId estandarizado

**Implementada 2026-08-28.** Ejecuta la "Decisión final (2026-08-08)" de
`.claude/rules/database-conventions.md`: exponer `id` (Int, solo ordenamiento) y `referenceId`
(UUID, clave pública) por separado en los dominios que hoy solo devolvían el UUID bajo la clave
`id`. Primer punto del backlog documentado en
`TekoApp-Frontend-Mobile/openspec/decisions.md`, sección "Backlog — features grandes pedidas
2026-08-08", ítem 1.

## Alcance real (verificado contra código, no contra la spec original)

- **Services, ServiceRequests, PaymentMethodEntity, Payments, Rating**: los 5 dominios reales —
  el schema ya tenía `id Int` + `referenceId String @unique` en los 5 (decisión de 2026-08-08 ya
  aplicada a nivel de datos), pero el mapper de respuesta (`exposeReferenceAsId` /
  reimplementaciones manuales del mismo patrón) descartaba el `id` interno y sobreescribía la
  clave `id` con el UUID.
- **`PaymentTransaction` NO existe como entidad propia** — es un campo `transactionId: string`
  dentro de `Payments`, sin DTO/mapper de respuesta propio. Se cae del alcance (no hay nada que
  migrar).

## Cambios

- `src/common/helpers/reference-id.helper.ts` (`exposeReferenceAsId`) — **eliminado** (quedó sin
  ningún caller tras el cambio; grep confirmado antes de borrar).
- `src/api/services/helpers/services-response.helper.ts`,
  `src/api/payments/helpers/payments-response.helper.ts`,
  `src/api/ratings/helpers/ratings-response.helper.ts` — los mappers ya no borran `referenceId` ni
  sobreescriben `id`; ambos campos pasan tal cual desde la entidad cruda de Prisma. Se mantiene sin
  cambios la lógica de FKs entre estos dominios (ej. `Payment.serviceId`/`Rating.serviceId` siguen
  exponiendo el `referenceId` del servicio padre, nunca su PK interna — eso es un concern
  independiente del id/referenceId de la propia entidad, fuera de alcance de este ítem).
- DTOs de respuesta (`ServiceDetailResponseDTO`, `ServiceRequestDetailResponseDTO`,
  `PaymentDetailResponseDTO`, `PaymentMethodDetailResponseDTO`, `RatingDetailResponseDTO`):
  `id` pasa de `string` (ejemplo UUID) a `number` (ejemplo PK secuencial, documentado como "solo
  para ordenamiento"), y se agrega `referenceId: string` como campo nuevo.

## Fuera de alcance (deliberado)

- **Rutas HTTP sin cambios**: los parámetros de ruta (`GET /services/:id`, etc.) siguen
  resolviendo por `referenceId` como valor — no se renombra el parámetro ni se toca el contrato de
  ruteo, tal como aclara `database-conventions.md` ("Fuera de alcance de esta convención").
- **FKs entre entidades** (`serviceId` embebido en Payment/Rating/ServiceRequest apuntando al
  UUID del servicio padre) — comportamiento ya existente, no forma parte de este ítem del backlog.
- **`userId`/`professionalId` numéricos en estos DTOs** — quedan como Int crudo (comportamiento
  preexistente, no es parte del contrato id/referenceId de la propia entidad).

## Impacto en clientes (breaking, sin shim — proyecto sin usuarios reales todavía)

`TekoApp-Frontend-Mobile` y `TekoApp-Web` leían `id` asumiendo que era el UUID (funcionaba porque
`exposeReferenceAsId` lo sobreescribía). Con este cambio `id` pasa a ser un Int — todo código que
navegaba/consultaba usando `entity.id` en estos 5 dominios debe migrar a `entity.referenceId`. Ver
`TekoApp-Frontend-Mobile/openspec/decisions.md` y `TekoApp-Frontend-Web/openspec/decisions.md`
para el detalle de la migración en cada repo.

## Verificación

- `pnpm run build` — sin errores de tipos (el compilador no detectó ningún consumidor interno que
  dependiera del `id` viejo como string, ya que el contrato solo se consume desde afuera).
- `pnpm run lint` — 0 warnings.
- `pnpm run test` — 102 suites / 1211 tests verdes (13 tests actualizados en
  `services.service.spec.ts`, `payments.service.spec.ts`, `ratings.service.spec.ts` para reflejar
  el nuevo contrato — antes afirmaban `result.id === <UUID>`, ahora `result.id === <PK numérica>`
  y `result.referenceId === <UUID>`).
- `pnpm run format` — sin cambios pendientes.
- Sin migración de base de datos — el schema ya tenía ambas columnas desde 2026-08-08, este cambio
  es 100% de la capa de mapeo/DTO.
