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

## Conexión a Postgres detrás de un pooler (Supabase) — dos URLs, no una

Supabase expone el mismo Postgres por dos puertos, y **cada uno sirve para algo distinto**:

| Puerto | Modo | Para qué | Requisito |
|---|---|---|---|
| `6543` | transacción (pooler) | la app en runtime | **obligatorio** `?pgbouncer=true` |
| `5432` | sesión | `prisma migrate`, psql, scripts sueltos | sin parámetros extra |

- **`?pgbouncer=true` no es opcional en el puerto 6543.** Le dice a Prisma que no use prepared
  statements. Sin él, el pooler reasigna la conexión entre requests y Postgres tira
  `26000: prepared statement "sN" does not exist` de forma **intermitente** — o sea, funciona un
  rato y después empieza a fallar (típicamente después de que el pooler recicla conexiones, ej.
  tras suspender la máquina o un rato de inactividad). Bug real encontrado el 2026-09-06 probando
  la app Flutter en un dispositivo físico: `/auth/public-key` empezó a devolver 403 sin que nadie
  tocara código. **Afecta cualquier ambiente que apunte al pooler, producción incluida** — si se
  agrega el parámetro en `.env` local, hay que agregarlo también en las env vars del deploy.
- `prisma migrate` **no funciona** contra el puerto 6543 (ver `WORKPLAN` de
  `platform-hardening-2026-09`, §1.2): migrar siempre pasando la URL de sesión (5432) solo para
  ese comando, nunca cambiando el `DATABASE_URL` de la app.
- **`CREATE INDEX CONCURRENTLY` no se puede aplicar con `prisma migrate deploy`** (envuelve cada
  migración en una transacción, y Postgres lo prohíbe ahí: error `25001`). Verificado el
  2026-09-05: la migración queda registrada como fallida con `applied_steps_count=0` sin haber
  tocado la tabla. Opciones: índice tradicional (lo que se eligió para
  `professionals_nearby_idx`, aceptando el lock breve durante el build), o aplicar el SQL a mano
  fuera de Prisma y reconciliar con `prisma migrate resolve --applied`.

## `PaymentMethodEntity.details` — nunca dato de tarjeta (alcance PCI-DSS)

`payment_methods.details` es `Json @db.JsonB` sin contrato de forma, así que el schema **no**
impide escribir ahí lo que no debe ir. Regla, decidida el 2026-09-07:

- **Prohibido almacenar PAN completo, CVV/CVC o datos de banda/chip.** Ni cifrados, ni "solo un
  rato", ni en `metadata`. Un PAN persistido mete al backend entero en alcance PCI-DSS (auditoría
  anual, segmentación de red, escaneos trimestrales) — costo desproporcionado y evitable.
- El dato de tarjeta viaja del cliente **directo al proveedor** (checkout/SDK). Lo único que se
  persiste es el token que devuelve, en `externalId`.
- En `details` van solo datos no sensibles de presentación: marca, últimos 4 dígitos, mes/año de
  vencimiento, y el nombre que el usuario le puso al método. Marca + últimos 4 no son PAN y son
  el estándar de la industria para mostrar "Visa ···· 4242".
- **Datos bancarios de payout son otra cosa**: una cuenta destino no es dato de tarjeta y no cae
  bajo PCI-DSS, así que sí se puede almacenar (con cifrado en reposo y acceso restringido). Hoy
  no existe ningún modelo de datos bancarios en el schema — ver
  `openspec/changes/platform-hardening-2026-09/I-02-payout-open-questions.md`, y no modelarlo
  antes de elegir el proveedor de pagos salientes, porque su API define el formato de cuenta.
