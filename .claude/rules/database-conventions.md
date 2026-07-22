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

## Excepción ya existente y aceptada (no migrar sin decidirlo explícitamente)

`Services`, `ServiceRequests`, `PaymentMethodEntity`, `Payments`, `PaymentTransaction`, `Rating`
usan **UUID como PK primaria** (`id String @id @default(uuid())`) en vez del patrón `id`
secuencial + `referenceId` separado — decisión ya tomada, con FKs `String` en cascada sobre varias
tablas (`serviceId`, `paymentId`, `paymentMethodId`, etc.). Comparado contra
`portal-comercios-backend` (que sí sigue el patrón `id` secuencial + `referenceId` en toda su capa
de negocio, incluyendo un caso de refactor real de UUID-como-PK a secuencial en `qr_payments`):
UUID como PK fragmenta el índice B-tree en inserts aleatorios y mezcla el id interno con el
público — pero **migrar esto ahora es un refactor grande** (toca FKs en cascada en múltiples
tablas), no algo para hacer de forma incidental. Si se decide encarar, la ventana más barata es
durante otra migración/squash grande, no aislado.

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
