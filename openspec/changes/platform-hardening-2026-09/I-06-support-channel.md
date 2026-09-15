# Spec: Canal de soporte in-app (I-06)

Origen: pedido explícito de José (tarea 10 de la tanda 2026-09-14 de `platform-hardening-2026-09`),
que retoma y responde `TekoApp-Frontend-Mobile/openspec/specs/support-channel.md` — esa spec de
Mobile ya tiene la parte cliente diseñada (pantalla, formulario, accesos contextuales) y quedó
explícitamente bloqueada esperando esta definición del lado `TekoApp-Backend`: *"Backend necesita
(dependencia de esta spec)... Migración Prisma: tabla `support_requests`... `POST
/support/contact`... Nueva entrada en `EmailTypeEnum` + template"*. Entregable de esta tarea:
**spec, no implementación** — cero cambios en `src/` acompañan este archivo.

## Contexto: de qué partimos

Hoy un usuario con un problema real (pago fallido, profesional que no apareció) no tiene ningún
canal dentro de la app para pedir ayuda — la spec de Mobile lo documenta como *"el hueco más
grande de los tres de este workflow"* (I-03/I-04/I-05, numeración del WORKPLAN de Mobile — no
confundir con los IDs de este WORKPLAN de Backend). Del lado de `TekoApp-Backend` no existe:

- Ninguna tabla ni modelo para un "pedido de soporte".
- Ningún endpoint `support/*`.
- Ninguna entrada en `EmailTypeEnum` para avisar a staff (el catálogo actual, extendido en la
  tarea 6 de esta misma tanda, es `VERIFICATION`, `FORGOT_PASSWORD`, `CREATE_PASSWORD`,
  `PAYMENT_RECEIPT`, `LOGIN`, `PASSWORD_CHANGED`, `PASSWORD_RESET`, `PAYMENT_METHOD_CREATED` —
  ninguno es "alguien pidió ayuda").

Lo que sí existe y esta spec reutiliza, sin modificarlo:

- `src/modules/email/` (`EmailService.sendEmailByType`, nodemailer ya configurado) — el mecanismo
  de aviso a staff, ver "Decisión: reusar `EmailModule`" más abajo.
- `src/modules/storage/` (S3) — para adjuntar evidencia opcional, mismo patrón que
  `professional-documents`/`I-03-dispute-records.md` (`evidenceKeys: String[]`, keys de S3, sin
  OCR ni validación de contenido).
- Los 5 limitadores de `RateLimitConfig` (`general`, `auth`, `upload`, `payment`, `search`) — ver
  "Rate limit" más abajo, no hace falta un sexto.
- El patrón de auditoría automática (`fn_attach_audit_triggers()` + `GET /admin/audit-logs` de
  `W-01`) — una tabla nueva con `id`/`created_by`/`change_signature` queda visible ahí sin
  trabajo adicional.

## Objetivo

Modelar un **pedido de soporte** como entidad propia — quién lo hizo, qué preguntó, desde qué
contexto (un pago o servicio puntual, si vino de un acceso contextual) — y que el aviso a staff
(email) sea una consecuencia registrada de esa creación, no el único rastro. Mismo criterio que
`I-03-dispute-records.md` ya estableció para las disputas: *"un email que se pierde en una bandeja
de entrada sin registro es tan malo como no tener canal"*.

## Alcance

**Incluye**: creación de un pedido de soporte por cualquier usuario autenticado, con asunto,
mensaje, contexto opcional (tipo + referenceId del pago/servicio que lo disparó) y evidencia
opcional (keys de S3); aviso por email a una casilla de staff; listado de "mis pedidos de soporte"
para que el propio usuario vea el historial de lo que mandó; una cola mínima de staff
(`GET /admin/support-requests`) para no depender únicamente de leer la bandeja de email — mismo
espíritu que `I-03` ofreció `GET /admin/disputes` desde el día uno, antes de que existiera ningún
panel visual para consumirlo.

**No incluye** (mismo recorte que ya fijó la spec de Mobile, del lado backend): responder al
usuario desde la app (el ciclo de respuesta sigue siendo por fuera — email/teléfono directo del
staff al usuario, no hay un hilo de conversación ida y vuelta), estados/SLA/asignación de un
pedido a un miembro de staff en particular, categorías de motivo más allá de "pago" / "servicio" /
"general", IA/bot de primera respuesta, panel de administración visual en Web (el endpoint de cola
sí se especifica acá — la UI que lo consuma es una spec aparte de `TekoApp-Frontend-Web`, mismo
patrón que dejó `I-03` para el panel de disputas).

## Decisión: reusar `EmailModule`, no un canal externo (WhatsApp/Intercom/Zendesk)

Mismo razonamiento que ya cerró la spec de Mobile: `src/modules/email/` ya funciona (nodemailer +
`EmailTypeEnum` con templates, usado en `auth-api.service.ts` y, desde la tarea 6 de esta tanda,
también en `payments.service.ts`). Agregar un proveedor de soporte de terceros es una decisión de
producto posterior si el volumen lo justifica — no un bloqueante para resolver el hueco actual
(cero canales).

**Cambio necesario en `EmailTypeEnum`** (no implementado en esta tarea, guía para cuando se
implemente): un valor nuevo, ej. `SUPPORT_REQUEST_RECEIVED`, con una plantilla que reuse
`EmailHelper.createGenericNotificationTemplate` (mismo criterio que la tarea 6 usó para
`LOGIN`/`PASSWORD_CHANGED`/`PASSWORD_RESET`/`PAYMENT_METHOD_CREATED`: no lleva un link de acción
con token, así que no necesita una plantilla bespoke) — el destinatario es la casilla de soporte
configurada (`SUPPORT_INBOX_EMAIL` o el nombre de env var que se defina), no el usuario que
escribió, así que el `user` que recibe `sendEmailByType` es un valor sintético de esa casilla, no
un `Users` real — **el `user?: Users` de la firma actual asume implícitamente que el destinatario
es un usuario del sistema; esto es la primera vez que no lo es, y `sendEmailByType` puede necesitar
un ajuste de firma o un `case` que no dependa de `user.email` sino de un email fijo de config**.
Anotado para que la implementación no lo descubra a mitad de camino.

## Decisión: sí persistir en una tabla propia, con auditoría automática

Sigue el patrón estándar del repo (ver `.claude/rules/database-conventions.md`): `id Int
@id @default(autoincrement())` + `referenceId String @unique @default(uuid())` + columnas de
auditoría completas, migración terminada con `SELECT fn_attach_audit_triggers();`. Al calificar
para el trigger genérico (tiene `id` + `created_by` + `change_signature`), la tabla queda visible
automáticamente en `GET /admin/audit-logs` (`W-01`, `TekoApp-Frontend-Web`) sin trabajo adicional
— quien audite cambios no depende de un endpoint a medida para eso, solo la LECTURA con contexto
legible (asunto/mensaje) necesita el endpoint de cola dedicado.

## Modelo de dominio (Prisma) — propuesta

```prisma
enum SupportRequestContextType {
  PAYMENT
  SERVICE
}
// Mobile solo define 2 accesos contextuales hoy (payment_detail_screen, service_detail_screen) —
// ver "Contexto disparador" de la spec de Mobile. Un acceso genérico sin contexto (desde
// profile_screen) simplemente no setea `contextType`/`contextReferenceId` (ambos null).

/// `userId` es quien escribe el pedido — siempre un usuario autenticado (`JwtAuthGuard`), nunca
/// anónimo. `contextReferenceId` es el UUID público (referenceId) del pago o servicio que lo
/// disparó, NUNCA la PK interna — mismo criterio de "solo referenceId cruza el límite HTTP" que
/// el resto del repo. Sin FK real hacia `Payments`/`Services` a propósito: el contexto es
/// polimórfico (puede apuntar a cualquiera de las 2 tablas) y Prisma no modela FKs polimórficas
/// de forma nativa — resolverlo a mano en el service si se necesita validar que el
/// `contextReferenceId` realmente existe y pertenece al usuario (recomendado, no bloqueante para
/// el modelo: un pedido de soporte con un contexto inválido sigue siendo un pedido de soporte
/// válido, el contexto es informativo para quien lo atiende).
model SupportRequests {
  id                 Int                         @id @default(autoincrement())
  referenceId        String                      @unique @default(uuid()) @map("reference_id")
  userId             Int                         @map("user_id")
  subject            String                      @db.VarChar(200)
  message            String                      @db.Text
  contextType        SupportRequestContextType?  @map("context_type")
  contextReferenceId String?                     @map("context_reference_id")
  evidenceKeys       String[]                    @default([]) @map("evidence_keys")
  emailSentAt        DateTime?                   @map("email_sent_at")
  // Cuándo se avisó a staff por email — separado de `createdAt` porque el envío es
  // fire-and-forget (mismo patrón que la tarea 6 de esta tanda estableció para los avisos de
  // seguridad): si el SMTP falla, el pedido queda igual persistido y auditable, `emailSentAt`
  // simplemente queda null y algo (staff revisando la cola, o un job de reintento futuro) puede
  // detectar el pedido sin aviso.

  user Users @relation(fields: [userId], references: [id])

  createdAt       DateTime  @default(now()) @map("created_at")
  createdBy       String?   @map("created_by")
  lastChangedAt   DateTime? @default(now()) @map("last_changed_at")
  lastChangedBy   String?   @map("last_changed_by")
  changedReason   String?   @map("changed_reason")
  checksum        String?   @map("checksum")
  changeSignature String?   @map("change_signature")

  @@index([userId])
  @@index([contextType, contextReferenceId])
  @@map("support_requests")
}
```

**Por qué no hay `status`/`assignedTo`**: la spec de Mobile excluyó explícitamente un "sistema de
tickets con estados/SLA" de su alcance — este modelo no lo fuerza tampoco. Si en el futuro se
decide agregar un flujo de atención con estados, es una migración aditiva (`ALTER TABLE ... ADD
COLUMN status ...`), no un rediseño de lo que ya existe acá.

## Reglas de negocio

1. **Quién puede crear un pedido**: cualquier usuario autenticado (`JwtAuthGuard`), sin permiso
   especial — es un canal de ayuda, no una acción administrativa.
2. **El contexto es opcional pero, si viene, debe ser coherente**: si `contextType`/
   `contextReferenceId` vienen seteados, el service debería validar (recomendado, no bloqueante —
   ver comentario del modelo) que el recurso referenciado existe y pertenece al usuario que crea
   el pedido — mismo criterio de "no confiar en lo que manda el cliente" que ya aplica en otros
   DTOs del repo (ver `budgets.service.ts`, que recalcula `subtotal`/`totalPrice` server-side en
   vez de confiar en lo que llega). Si la validación falla, la decisión de rechazar (400) o
   aceptar igual y descartar el contexto es de implementación — esta spec no la fuerza.
3. **El aviso a staff es best-effort, no debe bloquear la creación**: mismo patrón fire-and-forget
   que estableció la tarea 6 de esta tanda (`AuthApiService.sendSecurityEmail`,
   `PaymentApiService.createPaymentMethod`) — un fallo de SMTP nunca debe convertir en 500 la
   respuesta de `POST /support/contact`. `emailSentAt` queda `null` si falla; el pedido ya está
   persistido de todas formas.
4. **Rate limit**: la spec de Mobile deja esto como riesgo explícito ("confirmar el límite
   concreto con backend al implementar, no dejarlo sin límite 'para después'"). Recomendación
   concreta de esta spec: sumar `support/contact` a las rutas que ya usa el limitador `upload`
   (`RateLimitConfig`, 10 requests/hora por usuario autenticado — ver `middleware.config.ts`/
   `AppModule.configure()`, cableado en D-02 de este mismo WORKPLAN) en vez de crear un sexto
   limitador. El presupuesto de "10 acciones deliberadas por hora" ya está pensado para acciones
   de usuario poco frecuentes y cuesta cero infraestructura nueva — un pedido de soporte encaja en
   esa misma categoría. Si en la práctica 10/hora resulta muy laxo o muy estricto para este caso
   puntual, ajustarlo es un cambio de una línea, no un rediseño.
5. **Evidencia opcional**: mismo nivel de rigor que `professional-documents`/`PaymentDisputes` —
   `evidenceKeys: String[]` de keys de S3, sin tamaño máximo ni tipos de archivo específicos más
   allá de lo que ya impone `modules/uploads` (`ALLOWED_MIME_TYPES`/`MAX_FILE_SIZE`,
   `src/api/uploads/const/uploads.const.ts`) para cualquier subida al bucket.

## Endpoints (contrato propuesto)

| Método | Ruta | Quién | Descripción |
|---|---|---|---|
| POST | `/support/contact` | cualquier usuario autenticado | Crea el pedido — `CreateSupportRequestDTO { subject, message, contextType?, contextReferenceId?, evidenceKeys? }` |
| GET | `/support/me` | el propio usuario | Historial paginado de "mis pedidos de soporte" — mismo patrón de paginación que `ContractsService.listMine` |
| GET | `/admin/support-requests` | staff con `SUPPORT.AUDIT_VIEW` | Cola paginada, filtrable por `contextType` — mismo patrón que `ContractsService.listAudit`/`GET /admin/disputes` de `I-03` |

**Nuevo permiso** (agregar a `src/common/enum/permissions.enum.ts`, sembrarlo en el catálogo que
ya siembra T-04 del WORKPLAN original):

```typescript
SUPPORT: {
  AUDIT_VIEW: 'support.audit:read',
},
```

Mismo criterio de nombrado que `PAYMENTS.AUDIT_VIEW`/`CONTRACTS.AUDIT_VIEW`/`RATINGS.AUDIT_VIEW`
ya establecidos.

## Casos de error

- `400` si `subject`/`message` vienen vacíos, o si `contextType` viene sin `contextReferenceId`
  (o viceversa) — deben ir juntos o ninguno, nunca uno solo.
- `429` si se excede el rate limit (`support/contact`) — mismo formato de respuesta que ya usan
  los otros 4 limitadores cableados en D-02.
- Sin `404` propio: un `contextReferenceId` que no resuelve a un recurso real no debería romper la
  creación del pedido (ver regla de negocio 2) — a lo sumo se descarta el contexto, nunca se
  rechaza el pedido completo por esto.

## Efecto sobre otras partes del dominio

- **Borrado de cuenta (I-01 de este WORKPLAN)**: `SupportRequests.userId` es una referencia a
  `Users`, igual que `PaymentDisputes.openedByUserId` — mismo criterio de I-01 aplica: sobrevive
  como registro (anonimizado el usuario, la fila de soporte queda) en vez de borrarse en cascada.
  No se agrega como bloqueante de borrado (a diferencia de una disputa `OPEN`): un pedido de
  soporte ya resuelto (por fuera del sistema, vía email) no representa un caso pendiente que deba
  impedir el borrado — a diferencia de una disputa, que si sigue abierta es un compromiso
  económico sin resolver. Si se agrega un `status` en el futuro (ver "por qué no hay status"
  arriba), esta decisión podría revisarse para bloquear el borrado mientras un pedido siga "sin
  atender".
- **Auditoría (`W-01` de Web)**: la tabla queda visible en `GET /admin/audit-logs` automáticamente
  al calificar para `fn_attach_audit_triggers()` — no requiere trabajo adicional del lado del
  visor de auditoría ya implementado.
- **Notificaciones in-app (I-05 de este WORKPLAN)**: fuera de alcance de esta spec avisar también
  por notificación in-app cuando el pedido se registra (el email ya cumple ese rol para el
  usuario, que sabe que lo mandó porque él mismo lo escribió) — no hay un evento de "cambio de
  estado" que notificar todavía porque no hay estados (ver arriba). Si se agrega un flujo de
  respuesta desde el backend en el futuro, ahí sí correspondería un `NotificationType` nuevo
  (`SUPPORT_REQUEST_ANSWERED` o similar), análogo a los 18 disparos que implementó la tarea 5 de
  esta misma tanda — no antes de que exista el evento real que lo dispare.

## Fuera de alcance de esta spec

- La UI de Web para `GET /admin/support-requests` (candidato natural para una spec propia de
  `TekoApp-Frontend-Web`, mismo patrón que dejó `I-03` para el panel de disputas).
- Un flujo de respuesta desde el backend hacia el usuario dentro de la app (el ciclo de respuesta
  sigue siendo manual, por fuera — email o teléfono directo).
- Estados/SLA/asignación de un pedido a un miembro de staff en particular.
- Integración con una herramienta de soporte de terceros (Zendesk/Intercom/WhatsApp Business) —
  decisión de producto posterior si el volumen lo justifica, no bloqueante para resolver el hueco
  actual (cero canales).
- Validación estricta (bloqueante) de que `contextReferenceId` exista y pertenezca al usuario —
  se deja como recomendación de implementación, no como regla forzada por el modelo.

## Riesgos / límites explícitos

- **Sin flujo de respuesta**: hasta que se implemente uno (fuera de alcance), la única forma de
  que el usuario reciba una respuesta es que staff lo contacte por fuera de la app (mismo límite
  que ya anotó la spec de Mobile) — el canal resuelve "cómo pedir ayuda", no "cómo recibirla
  dentro de la app".
- **`sendEmailByType` asume un `Users` real como destinatario** — el ajuste de firma/caso
  necesario para un destinatario de config (la casilla de soporte) no está resuelto acá, solo
  anotado para que la implementación no lo descubra a mitad de camino (ver "Decisión: reusar
  `EmailModule`").
- **Contexto no validado por default**: un `contextReferenceId` inventado o de otro usuario no se
  rechaza por diseño (ver regla de negocio 2 y "Casos de error") — el costo es bajo (el contexto
  es informativo, no autoritativo) pero es una decisión consciente, no un descuido.
- **Rate limit compartido con `upload`**: si en producción los patrones de uso de ambas rutas
  resultan muy distintos (ej. `uploads/*` se usa en ráfagas cortas, `support/contact` debería ser
  más esporádico todavía), separarlos en limitadores propios es un cambio de configuración menor,
  no un rediseño — anotado para no asumir que la recomendación de la regla de negocio 4 es
  definitiva sin medir uso real.
