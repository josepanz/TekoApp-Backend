# Convención de IDs

## Regla para tablas nuevas

Toda tabla nueva que representa una **entidad de negocio** (expuesta o potencialmente expuesta por
API a TekoApp-Frontend-Web o TekoApp-Mobile) debe tener:

- **`id`**: PK secuencial (`Int @default(autoincrement())`). Uso exclusivo interno — orden de
  inserción, joins, FKs. Nunca exponer en URLs ni en DTOs públicos.
- **`referenceId`**: `String @unique @default(uuid()) @map("reference_id")`. Id público — el que
  se comparte entre endpoints, frontend, y la futura app móvil.

Patrón ya aplicado en `Users`, `Professionals`, `Roles`, `Category` (ver
`.claude/rules/typescript.md`).

## Corrección (2026-08-08): la "excepción" de abajo ya no existe en el schema real

Esta sección afirmaba que `Services`, `ServiceRequests`, `PaymentMethodEntity`, `Payments`,
`PaymentTransaction` y `Rating` usaban UUID como PK primaria — **desactualizado**: se verificó
`prisma/schema.prisma` línea por línea (2026-08-08) y los 6 modelos YA tienen
`id Int @id @default(autoincrement())` + `referenceId String @unique @default(uuid())`, el mismo
patrón que `Users`/`Professionals`/`Category`. No hay ninguna migración de PK pendiente — el
schema ya está estandarizado. Lo que sí seguía siendo un problema real (y ya se corrigió en esta
misma sesión): `CreatePaymentDto.professionalId` viaja como `referenceId` (UUID) pero
`PaymentApiService.createPayment` lo convertía con `Number(...)` en vez de resolverlo contra la
tabla `professionals` — daba `NaN`. Fix: `PaymentDbService.findProfessionalByReferenceId` +
resolución explícita antes de crear el pago (ver `payments.service.ts`).

Antes de confiar en cualquier afirmación de este archivo sobre el estado de una tabla puntual,
grepear `model <Nombre>` en `schema.prisma` — este documento puede volver a quedar desactualizado
si el schema cambia sin actualizar esta nota.

## Al agregar `referenceId` a una tabla con datos existentes

Usar `@default(uuid())` (client-side, ya es el patrón de este proyecto) solo funciona limpio en
una migración de columna NUEVA si se agrega `NOT NULL` — Prisma migrate genera el `ALTER TABLE ...
ADD COLUMN` correctamente para este caso porque el default se evalúa por fila también en el
`ADD COLUMN`. Si en el futuro se prefiere generar el UUID en la base (`dbgenerated("gen_random_uuid()")`,
más robusto ante inserts fuera de Prisma), verificar el resultado contra `information_schema.columns`
después de aplicar — no confiar solo en `prisma migrate status` (portal-comercios-backend documentó
un caso real de drift: el squash de migraciones asumía un `ALTER COLUMN ... SET DEFAULT` ya
aplicado que en realidad nunca corrió físicamente, causando `P2011` en producción).

## Fuera de alcance de esta convención

Reemplazar `id` numérico por `referenceId` en parámetros de ruta (`GET /:id` → `GET /:referenceId`)
y en los DTOs de respuesta que hoy exponen el id numérico es un entregable separado — no se
modifica el contrato público de la API al aplicar esta convención a una tabla nueva, solo el
modelo de datos.

## Decisión final (2026-08-08): exponer `id` + `referenceId` por separado en TODOS los dominios

Ya no es una excepción pendiente de confirmar — José decidió ejecutarlo. Contrato estándar para
TODA entidad de negocio, en detalle Y en listado:

- `id` (Int secuencial): solo para ordenamiento en la UI — **nunca** se usa como clave de consulta
  ni aparece en una ruta (`GET /:id` sigue resolviendo por `referenceId`, no cambia el parámetro).
- `referenceId` (UUID): la única clave válida para consultar/rutear/deep-link, igual que hoy.

**Implementado 2026-08-28** — ver `openspec/changes/0008-id-referenceid-standardization.md` y
`openspec/decisions.md` ("Fase 0008") para el detalle. Alcance real: 5 dominios, no 6 —
`PaymentTransaction` no existe como entidad propia (es un campo string dentro de `Payments`).
Resultó ser un breaking change real para los clientes (no "aditivo sin breaking change" como
preveía esta nota) — `id` cambia de tipo (de UUID string a Int), así que Mobile/Web deben migrar
toda navegación que leía `entity.id` a `entity.referenceId`. Sin shim de compatibilidad, decisión
explícita dado que el proyecto no tiene usuarios reales todavía.
