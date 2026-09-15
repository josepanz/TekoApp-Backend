# Spec: Borrado de cuenta (I-01)

Origen: `openspec/changes/platform-hardening-2026-09/WORKPLAN.md` §5, I-01. **CRÍTICO — bloquea la
publicación de Mobile.** Entregable de esta tarea: **spec, no implementación**.

Marco legal que la motiva: Apple lo exige in-app desde 2022 (Guideline 5.1.1(v) — "Account
Deletion"), Google Play pide equivalente (Data Safety / Account deletion policy), y la Ley
paraguaya 6534/2020 de Protección de Datos Personales concede derecho de supresión.

## Contexto: de qué partimos (verificado 2026-09-06)

**No existe ningún flujo de borrado de cuenta hoy**, ni de autoservicio ni administrativo real:

- `Users.status` (`UserStatus`) ya tiene un valor `DELETED` — y `AuthService.validateUserStatus`
  (`src/modules/auth/services/auth.service.ts:320`) ya rechaza el login con `USER_DELETED` si un
  usuario está en ese estado. **Pero ningún código pone nunca ese valor.** Es un estado
  final ya modelado y ya bloqueado, esperando que algo lo dispare.
- Existe un endpoint que **parece** ser esto pero no lo es: `DELETE /users/reference/:referenceId`
  (`users.controller.ts:103-112`, admin-only vía `PERMISSIONS.USER.DELETE`). Verificado
  end-to-end: `UsersApiService.deleteByReference` → `UsersDbService.inactivateUser` →
  `UsersDbService.inactivate` (`users-db.service.ts:386-396`) — **solo pone `status = INACTIVE`**.
  No toca ningún campo de PII (email, nombre, documento, teléfono), no es `DELETED`, y es una
  acción de **staff sobre un usuario**, no de autoservicio. **Esta spec no reutiliza ni renombra
  ese endpoint** — es una feature distinta (desactivación administrativa, ej. por fraude) que
  sigue teniendo sentido tal cual está. Confundirlos sería un error: "admin deshabilita una
  cuenta problemática" y "un usuario ejerce su derecho de supresión" son dos flujos con dueños,
  disparadores y efectos completamente distintos.
- Infraestructura reusable real (Fase 0006, `openspec/specs/data-and-media-consent.md`):
  `DataRetentionPolicies` (retención configurable por país+tipo de contenido, con
  `allowsUserDeletion`/`requiresLegalHold`) y `UserConsents`/`LegalDocumentVersions` (versionado
  auditable de qué aceptó cada usuario). Esa spec ya adelantó la postura correcta: **"no incluye
  anonimización/derecho al olvido completo... solo el flujo de ocultamiento/soft-delete a nivel de
  aplicación, sujeto a la política de retención configurada"** — esta spec es exactamente esa
  extensión que Fase 0006 dejó pendiente, aplicada a la cuenta completa en vez de a un contenido
  puntual.
- `Mobile` (`profile_screen.dart`) hoy solo expone logout — confirmado también desde el WORKPLAN de
  `TekoApp-Frontend-Mobile`, que tiene su propia tarea I-01 **bloqueada por este endpoint**.

## Objetivo

Un usuario puede pedir la eliminación de su cuenta desde la app, con una ventana de gracia
cancelable, y al vencer esa ventana su información personal identificable se anonimiza —
preservando únicamente lo que la ley/contabilidad exige retener, desvinculado de su identidad real.

## Decisión central: anonimizar en un solo lugar, dejar que el resto herede gratis

**No se toca ninguna tabla que referencie a `Users` por FK** (`Payments`, `Contracts`,
`PaymentDisputes` de I-03, `Rating`, `Services`, etc.). Todas leen el nombre/email de un usuario
haciendo `join`/`include` contra la fila de `Users` — si esa fila se anonimiza en el lugar (mismo
`id`, mismo `referenceId`, campos de PII sobrescritos), **cualquier pantalla que hoy muestra "Juan
Pérez" pasa a mostrar el placeholder anonimizado sin tocar una sola línea de código de esas otras
features**. Esto es intencional y es la única forma de que esta spec no se convierta en "auditar y
tocar 15 tablas" — el costo de mantenimiento de anonimizar en un solo punto de verdad es
enormemente menor.

## Qué se borra vs. qué se anonimiza

**Se anonimiza en el lugar (la fila de `Users` persiste, con el mismo `id`/`referenceId`)**:

| Campo | Valor tras anonimizar |
|---|---|
| `email` | `deleted-user-{id}@deleted.tekoapp.internal` (sigue siendo `@unique`, no puede quedar vacío ni colisionar) |
| `firstName` / `lastName` | `"Usuario"` / `"eliminado"` (o el string que decida el copy de producto — el punto es que deje de ser el nombre real) |
| `documentNumber` | `null` |
| `phoneNumber` | `null` |
| `unverifiedEmail` | `null` |
| `avatarKey` | `null` (y el objeto real en S3 se borra, ver abajo — no tiene sentido legal retener una foto de perfil) |
| `status` | `DELETED` (ya bloquea login, ver "Contexto") |

**Se borra de verdad (no solo se anonimiza)**:

- El objeto de S3 detrás de `avatarKey`, vía `StorageService.deleteFileBatch` (ya existe,
  `storage.service.ts:278`).
- Los objetos de S3 de `ProfessionalDocuments` del usuario (antecedentes, títulos) — son datos
  sensibles reales (antecedentes policiales/judiciales); la fila de `ProfessionalDocuments` puede
  quedar (referencia a que "existió una verificación", útil para el historial de por qué un
  profesional estuvo habilitado) pero el `fileKey` se anula tras borrar el objeto real.
- `PushSubscriptions`/`FcmTokens` del usuario — ya no hay a quién notificar, no hace falta
  retenerlos ni anonimizarlos, se eliminan directo.

**Se preserva sin tocar (retención legal/contable, referencian a `Users` ya anonimizado)**:

- `Payments`/`PaymentTransaction` — obligación contable/impositiva real, no se puede "olvidar"
  cuánto se cobró ni cuándo.
- `Contracts` — es un documento firmado (clickwrap reforzado, hash de contenido), borrar el
  `contentSnapshot` o el `pdfKey` invalidaría la prueba de qué se firmó.
- `PaymentDisputes` (I-03) — mismo motivo que `Payments`, es el expediente de por qué se
  reembolsó o no.
- `Rating` — el historial del OTRO lado del marketplace no debe desaparecer porque una de las
  partes borró su cuenta (ver sección siguiente).
- `UserConsents` — paradójicamente, el registro de que el usuario aceptó los términos (con hash e
  IP) es la prueba de que hubo debido proceso; borrarlo sería peor para una auditoría legal futura
  que conservarlo apuntando a un `Users` ya anonimizado.

**No decidido acá, a resolver con José en la implementación**: si `Professionals` (el perfil
profesional del usuario, si tenía uno) debe anonimizarse también en sus campos de texto libre
(`description`) o si alcanza con sacarlo de circulación (`isAvailable = false`, y excluirlo de
`findNearby`/búsquedas — ver abajo). La `description` la escribió el propio usuario sobre sí
mismo, no es PII de terceros, así que anonimizarla es opcional, no obligatorio.

## Qué pasa con un servicio en curso, un pago pendiente o un contrato sin firmar

**Se bloquea la solicitud de borrado** (no la ventana de gracia — el bloqueo es al momento de
pedirlo, antes de arrancar el conteo). Condiciones verificadas contra el usuario que pide el
borrado, actuando como cliente O como profesional:

| Bloqueante | Condición (verificar con una query real al implementar, esto es la intención) |
|---|---|
| Servicio activo | `Services.status IN (PENDING, ACCEPTED, IN_PROGRESS)` donde el usuario es `userId` (cliente) o dueño del `Professionals` asignado |
| Pago pendiente | `Payments.status IN (PENDING, PROCESSING)` donde el usuario es `userId` |
| Contrato sin firmar | `Contracts.status IN (DRAFT, PENDING_CLIENT_SIGNATURE, PENDING_PROFESSIONAL_SIGNATURE)` donde el usuario es parte |
| Disputa abierta (I-03) | `PaymentDisputes.status IN (OPEN, UNDER_REVIEW)` donde el usuario la abrió o es parte del pago |

La respuesta de bloqueo (`409 DELETION_BLOCKED`) debe listar **cuáles** de estos 4 aplican y
cuántos casos de cada uno — no un mensaje genérico, para que la UI de Mobile/Web pueda mostrar "no
podés borrar tu cuenta: tenés 1 servicio en curso y 1 pago pendiente" con acción de ir a resolverlo.

**No se resuelve automáticamente nada por el usuario** (ej. no se cancela un servicio en curso
para "destrabar" el borrado) — la resolución de esos bloqueantes pasa por los flujos normales de
cada feature (cancelar el servicio, esperar a que se acredite el pago, firmar o cancelar el
contrato), no por un atajo especial de esta spec.

## Ventana de gracia

- **14 días** desde la solicitud hasta la anonimización efectiva — punto de partida a evaluar, no
  una cifra legal obligatoria (ninguna de las 3 referencias legales de arriba exige un número
  específico). Configurable por `core/config` (nunca hardcodeado ni `process.env` directo, regla
  no-negociable del repo), para poder ajustarlo sin deploy de código si en el uso real resulta
  muy corto o muy largo.
- **Durante la ventana**: el usuario sigue pudiendo loguearse normalmente (no se bloquea el login
  por estar en este estado intermedio — sería confuso para alguien que se arrepiente y no puede ni
  entrar a cancelar). El estado se expone en `GET /users/me` (`deletionScheduledAt`) para que
  Mobile/Web muestren un banner persistente ("tu cuenta se eliminará el DD/MM, cancelar").
- **Cancelación**: requiere una acción explícita (`POST /users/me/deletion-request/cancel`), nunca
  implícita por el solo hecho de loguearse o usar la app — mismo criterio que ya usa Mobile en su
  propia spec para el flujo de borrado ("confirmación de dos pasos"): un paso explícito para pedir
  el borrado, y un paso explícito también para cancelarlo, ninguno de los 2 pasos es "accidentable".
- **Vencimiento**: un job programado (Bull, mismo mecanismo que ya usa `NotificationsProcessor` y
  el job de expiración de `ProfessionalDocuments` de `professional-documents.md`) corre
  periódicamente, busca `Users` con `status = PENDING_DELETION` y `deletionScheduledAt <= now()`,
  y ejecuta la anonimización descripta arriba.

## Nuevo estado en `UserStatus`

```prisma
enum UserStatus {
  ACTIVE
  BLOCKED
  DELETED
  INACTIVE
  REFUSED
  PENDING_VERIFICATION
  PENDING_DELETION   // nuevo — ventana de gracia activa, login permitido, cancelable
}
```

Campos nuevos en `Users` (nullable, no rompen ninguna fila existente):

```prisma
model Users {
  // ...existentes...
  deletionRequestedAt DateTime? @map("deletion_requested_at")
  deletionScheduledAt DateTime? @map("deletion_scheduled_at") // requestedAt + ventana de gracia configurada
}
```

## Efecto sobre el otro lado del marketplace

- **Reseñas que el usuario dejó** (`Rating` donde es el autor): se conservan. El profesional
  calificado tiene derecho a que su historial de calificaciones no desaparezca porque el cliente
  que lo calificó borró su cuenta — el promedio/KPI del profesional no debe alterarse
  retroactivamente por un borrado ajeno. El nombre del autor, si se muestra, sale de la fila de
  `Users` ya anonimizada (ver "Decisión central" arriba) — nunca "anónimo" per se, sino
  "Usuario eliminado", que es honesto sobre qué pasó.
- **Historial del profesional con el que trabajó** (si el que borra su cuenta es el cliente): los
  `Services`/`Payments`/`Contracts` completados permanecen intactos para el profesional — su
  ingreso histórico y su prueba de trabajo realizado no dependen de que el cliente siga existiendo
  como cuenta activa.
- **Si el que borra su cuenta es el profesional**: su perfil (`Professionals`) deja de ser
  buscable/visible (excluir de `findNearby` y de cualquier listado público — el filtro real
  `status = 'approved'`/`verification_status = 'verified'` de D-01 ya deja de matchear si además
  se decide poner `Professionals.status = SUSPENDED` al anonimizar, sin necesitar un flag nuevo).
  Los clientes que trabajaron con él conservan su historial de servicio/pago/contrato/calificación
  igual que el caso anterior, simétrico.

## Endpoints (contrato)

`src/api/users/` (extiende el módulo existente, no uno nuevo — es una acción sobre la propia
cuenta, mismo dominio que `GET /users/me`).

| Método | Ruta | Quién | Descripción |
|---|---|---|---|
| POST | `/users/me/deletion-request` | usuario autenticado | Valida bloqueantes; si no hay, pone `PENDING_DELETION` + calcula `deletionScheduledAt`. `409 DELETION_BLOCKED` con el detalle de bloqueantes si corresponde |
| POST | `/users/me/deletion-request/cancel` | usuario autenticado | Solo si `status = PENDING_DELETION` — vuelve a `ACTIVE`, limpia las 2 fechas |
| GET | `/users/me` | usuario autenticado | Ya existe — extender la respuesta con `deletionScheduledAt: string \| null` para que el frontend sepa si mostrar el banner |

**No se expone un endpoint de borrado inmediato/sin ventana de gracia** — ni siquiera para staff.
Si en el futuro se necesita (ej. una orden judicial de supresión inmediata), es una feature
separada explícitamente fuera de esta spec, no una variante de esta.

## Casos de error

- `409 DELETION_BLOCKED` — al solicitar, con el detalle de qué bloqueantes aplican (ver tabla
  arriba).
- `409 DELETION_ALREADY_REQUESTED` — pedir el borrado dos veces (ya está `PENDING_DELETION`).
- `400 DELETION_NOT_REQUESTED` — cancelar sin tener una solicitud activa.
- `401 USER_DELETED` — ya existe hoy (`auth.service.ts:320`), sin cambios: intentar loguearse tras
  la anonimización efectiva sigue rechazado igual que hoy.

## Fuera de alcance de esta spec

- El endpoint/flujo de desactivación administrativa (`DELETE /users/reference/:referenceId`) — se
  mantiene tal cual, sin relación con esto.
- Borrado inmediato sin ventana de gracia (ver arriba).
- Anonimización de `Professionals.description`/`skills`/`certifications` — decisión abierta,
  anotada, no resuelta acá.
- Exportación de datos ("descargá tus datos antes de borrar tu cuenta") — la Ley 6534/2020 y las
  guías de las 2 stores hablan de supresión, no necesariamente de portabilidad; si se pide portar
  datos es una feature aparte.
- UI de ningún frontend (la pantalla de confirmación, el copy legal de qué se borra/conserva, el
  banner de ventana de gracia) — se diseña en los WORKPLAN de Web/Mobile, esta spec entrega el
  contrato que consumen.

## Riesgos / límites explícitos

- **No soy asesor legal.** Esta spec modela el flujo técnico (qué campo se anonimiza, qué se
  retiene y por qué) pero el copy legal real que se le muestra al usuario (qué le decimos que
  pasa con sus datos) lo define José con asesoría — mismo límite que ya declaró Fase 0006 para su
  propio contenido legal.
- **La ventana de 14 días es una propuesta, no un número medido** — no hay datos de cuántos
  usuarios se arrepienten típicamente en este producto todavía (es nuevo). Ajustarla con datos
  reales una vez que el flujo esté en producción.
- **El job de vencimiento corre en Bull** — si el worker de colas está caído el día que vence la
  ventana de un usuario, la anonimización se atrasa hasta que el worker vuelva (no hay SLA de
  "exactamente a los 14 días") — aceptable para este caso de uso, pero anotado.
- **Reversibilidad cero pasado el vencimiento**: una vez que corre la anonimización, no hay forma
  de "deshacer" — el email/nombre real no se guarda en ningún lado tras ese punto. Esto es
  intencional (es lo que la ley exige), pero es una decisión de una sola vía: verificar con José
  antes de implementar que el equipo de soporte entiende que no van a poder "recuperar" una cuenta
  después de la ventana de gracia.

---

## Estado de implementación (2026-09-07)

**Código completo, testeado, migración aplicada contra Supabase por José (2026-09-07,
`prisma migrate status` limpio antes y después). Commiteado — ver hash en la tabla del WORKPLAN
§8.** Detalle completo en `openspec/decisions.md` ("I-01 — borrado de cuenta"). Resumen:

### Hecho

- Schema: `UserStatus.PENDING_DELETION`, `Users.deletionRequestedAt`/`deletionScheduledAt`,
  `ProfessionalDocuments.fileKey` nullable. Migración escrita a mano en
  `prisma/migrations/20260907130000_add_account_deletion/migration.sql`, **aplicada contra
  Supabase** (conexión directa 5432, `prisma migrate status` limpio antes y después).
- Config: `ACCOUNT_DELETION_GRACE_PERIOD_DAYS` (default 14) en `config-loader.ts`/`config-schema.ts`.
- `AuthService.validateUserStatus`: caso `PENDING_DELETION` agregado, permite login (con test).
- Módulo nuevo `src/modules/account-deletion-db/` (`AccountDeletionDbService`): request/cancel
  (updateMany condicional), `findDueForAnonymization`, `anonymizeUser` (transacción única que
  cruza Users+Professionals+ProfessionalDocuments+PushSubscriptions+FcmTokens — deliberadamente
  fuera del patrón "un `-db` module por dominio" porque es una operación atómica única de este
  feature, no una consulta de rutina de otro dominio).
- Módulo nuevo `src/api/account-deletion/` (`AccountDeletionService` + `AccountDeletionController`
  + `AccountDeletionAnonymizationJob`).
- Métodos nuevos reusando infraestructura existente para los bloqueantes: `ServicesDbService.countServices`
  (ya existía, sin cambios), `ContractsDbService.countContracts` (nuevo), `PaymentDbService.countPayments`
  (nuevo) — evita duplicar acceso a Prisma de esas 3 tablas en el módulo nuevo.
- `HttpExceptionFilter` extendido con un campo `details` opcional (junto a `message`/`errorCode`
  que ya existían) — necesario para que `409 DELETION_BLOCKED` pueda devolver la lista real de
  bloqueantes con su conteo, no solo un mensaje genérico. Sin este fix el filtro global lo hubiera
  descartado en silencio. Cubierto con test nuevo.
- `GET /auth/scope` extendido con `deletionScheduledAt` (fresco desde DB — ver desviación abajo).

### Desviaciones respecto a lo que dice la spec arriba (verificadas, no asumidas)

1. **Los endpoints NO viven bajo `users`, viven bajo `auth/me`.** La spec asumía "mismo dominio
   que `GET /users/me`" pero ese endpoint no existe: el self-service real de "mi cuenta" en este
   repo es `GET/PUT /auth/me` (`AuthApiController`), no `users`. `users` es admin/staff sobre
   OTROS usuarios (`USER.READ`/`UPDATE`/`DELETE`, siempre con permiso). Se creó
   `AccountDeletionController` en `src/api/account-deletion/` con `@Controller('auth/me')`
   (Nest no necesita que el controller viva en el módulo `auth` para registrar esa ruta) — rutas
   reales: `POST /auth/me/deletion-request`, `POST /auth/me/deletion-request/cancel`.
2. **`GET /auth/me` (JWT-echo puro, sin DB) NO se tocó** — ahí es donde la spec asumía que iba
   `deletionScheduledAt`, pero ese endpoint no lee la DB (`AuthApiService.me()` solo mapea el
   payload del JWT), y el JWT no se reemite al pedir/cancelar el borrado — el banner quedaría
   desactualizado hasta el próximo login. Se extendió `GET /auth/scope` en su lugar, que YA hace
   `findUserById` fresco (usado hoy por Mobile/Web para el perfil completo) — cero costo extra de
   DB, dato siempre correcto.
3. **El bloqueante de disputa abierta (I-03) NO está implementado.** La tabla de bloqueantes de
   esta spec incluye "Disputa abierta (I-03)", pero `PaymentDisputes` no existe todavía —I-03 es
   la tarea siguiente en el WORKPLAN. Los otros 3 bloqueantes (servicio activo, pago pendiente,
   contrato sin firmar) están completos. **Falta agregar el 4to bloqueante cuando se implemente
   I-03** — anotado también en el archivo de esa spec.
4. **`@Cron`, no Bull**, para el job de vencimiento — mismo criterio y misma corrección que ya se
   aplicó en `professional-documents-expiration.job.ts` (barrido periódico = `@Cron`, Bull es para
   colas reactivas). Corre a las 4am (el de documentos corre a las 3am, para no competir).
5. **Consecuencia de `ProfessionalDocuments.fileKey` nullable**: `ProfessionalDocumentResponseDTO.fileKey`
   pasó de `string` a `string | null` (y su helper de mapeo) — si no, el build rompía. Cambio
   acotado, no se tocó nada más de ese módulo.
6. **`Professionals.description`/`skills`/`certifications`**: sin anonimizar, tal como la spec
   deja explícitamente sin resolver. Solo se setea `status = SUSPENDED, isActive = false` (mismo
   efecto que `suspendProfessional()` ya usa, saca al profesional de `findNearby`/listados sin
   flag nuevo).

### Migración — cómo se aplicó (para referencia futura)

El clasificador de "auto mode" de la sesión bloqueó el comando de migración (toca la base
compartida con credenciales en la línea de comando) pese a la autorización explícita de José en
el chat — no se intentó rodear. José corrió los 3 comandos a mano (conexión directa 5432, sin
pooler):

```bash
DATABASE_URL="<misma URL de .env pero puerto 5432, sin ?pgbouncer=true>" npx prisma migrate status
DATABASE_URL="<...:5432...>" npx prisma migrate deploy
DATABASE_URL="<...:5432...>" npx prisma migrate status   # confirmado limpio
```

Confirmado desde la sesión (el `migrate status` de lectura sí pasó el clasificador):
`Database schema is up to date!`, 20 migraciones aplicadas.

### Sin pendientes técnicos

DoD completa en verde (`format`/`lint`/`test`/`build`, `prisma migrate status` limpio),
commiteado, casilla marcada en §8 del WORKPLAN, registrado en `decisions.md`. Lo único que sigue
abierto es el bloqueante de disputas (punto 3 de "Desviaciones" arriba), a resolver como parte de
I-03, la tarea siguiente.

**Estado de tests**: 127 suites / 1369 tests, build/lint/format en verde, con la migración ya
aplicada.
