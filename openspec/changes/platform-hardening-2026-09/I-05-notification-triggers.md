# Spec: Disparo de notificaciones de dominio (I-05)

Origen: hallazgo verificado el 2026-09-07 y reconfirmado el 2026-09-14, **fuera del inventario
original de este WORKPLAN** (no tiene fila en §2 ni sección propia en el archivo previo a esta
tarea) — se agrega como `I-05` por continuidad de numeración dentro de la carpeta
`platform-hardening-2026-09/`. Lo trajo Mobile: especificó su bandeja in-app
(`TekoApp-Frontend-Mobile/openspec/specs/notification-preferences-and-inbox.md`) y dejó anotado
ahí mismo (línea 30-35 de ese archivo) que el inbox **se ve vacío en producción** porque nada del
lado backend alimenta la cola de notificaciones — "es un gap del lado `TekoApp-Backend`... para
que se levante como hallazgo en el WORKPLAN de `TekoApp-Backend`". Esta spec es esa respuesta.
Entregable de esta tarea: **spec, no implementación**.

## Verificación previa

Comando corrido contra `audit/2026-09-04` el 2026-09-14:

```bash
grep -rn "NotificationsService" src/ --include=*.ts | grep -v "^src/modules/notifications/"
```

**Corrección al enunciado del hallazgo**: el módulo vive en `src/api/notifications/` (servicio,
controller, processor, SSE) + `src/modules/notifications-db/` (Mongo) — no en
`src/modules/notifications/` como decía el hallazgo original. Mismo patrón `api/X` +
`modules/X-db` que el resto del repo.

**El grep NO devuelve cero resultados.** Hay una única llamada real fuera del propio módulo:

`src/api/professional-documents/jobs/professional-documents-expiration.job.ts:48` —
`ProfessionalDocumentsExpirationJob.run()`, un `@Cron(CronExpression.EVERY_DAY_AT_3AM)`, llama
`notificationsService.create(...)` con `NotificationType.DOCUMENT_EXPIRED` después de confirmar
con `updateStatusConditional(...) → count > 0` que el documento efectivamente venció (ver el
`Camino sin disputa`-style comentario en el archivo, líneas 10-17, y `openspec/decisions.md` línea
~222-225).

**Esto no invalida el hallazgo, lo confirma con matices:**

1. Es un barrido programado (`@Cron`), no una reacción a una transición disparada por un endpoint
   de la API — ningún controller/service de dominio (servicios, presupuestos, contratos, pagos,
   calificaciones, disputas, portafolio, borrado de cuenta, profesionales) llama
   `NotificationsService` hoy. El gap real — "las transiciones de estado que un humano dispara con
   una acción no notifican a nadie" — sigue completo.
2. Es, de hecho, el **único ejemplo real en el repo** del patrón correcto que esta spec pide
   replicar: `updateStatusConditional(..., [ESTADO_VIEJO], {...}) → if (count === 0) continue` y
   **recién después** `notificationsService.create(...)`. Se cita como referencia en la tabla de
   abajo en vez de inventarlo de cero.
3. `NotificationType` (`src/modules/notifications-db/enums/notification-type.enum.ts`) ya declara
   `SERVICE_REQUEST`, `SERVICE_ACCEPTED`, `SERVICE_REJECTED`, `SERVICE_COMPLETED`,
   `PAYMENT_RECEIVED`, `RATING_RECEIVED`, `PROMOTION`, `SYSTEM`, además de `DOCUMENT_EXPIRED` (el
   único que se usa). Alguien ya diseñó el catálogo de eventos pensando en dispararlos desde los
   dominios — nunca se conectó. Confirma que el diseño de esta spec no es especulativo: completa
   un contrato que ya existe a medias.

No paramos: el hallazgo original ("ningún dominio dispara notificaciones") se confirma para todo
disparo vivo desde un endpoint de usuario; la única excepción es un cron de mantenimiento que
sirve como prueba de patrón, no como cobertura real.

**Hallazgos colaterales, anotados y NO corregidos** (fuera de alcance, ver reglas de la tarea):

- `NotificationsProcessor.sendNotificationByChannel` (`src/api/notifications/processors/notifications.processor.ts:100-108`)
  trata los canales `email` y `sms` como **stubs**: solo hacen `this.logger.log(...)`, ningún
  envío real. `modules/email` (`EmailService`) existe y se usa en `auth-api.service.ts`,
  `onboarding.service.ts`, `users-db.service.ts` — pero el canal `'email'` del propio
  `CreateNotificationRequestDTO` (que hasta trae `['in_app', 'push', 'email']` como ejemplo en su
  Swagger doc, línea 52 del DTO) no lo invoca. Pedir `channels: ['email']` hoy no manda nada, solo
  loguea. Relevante para la pregunta de diseño §5 de abajo.
- `PaymentStatus.COMPLETED` **no tiene ningún escritor en el código hoy.** El webhook de Stripe
  que marcaba pagos como completados se removió por seguridad (`A-01`, hallazgo descartado — ver
  §2 del WORKPLAN) y la integración real (Dinelco, `0014`) sigue bloqueada por decisión de
  producto (`I-02`, fila `[ ]` en §7). Consecuencia directa para esta spec: **`PAYMENT_RECEIVED`
  no se puede enganchar todavía** — no porque falte notificarlo, sino porque la transición que
  debería dispararlo no existe en el código. No se inventa acá; se deja anotado como dependencia
  cruzada de `I-02`/`0014` en la tabla de abajo.
- `src/api/professionals/services/professionals.service.ts` (`verifyProfessional`,
  `suspendProfessional`) usa `professionalsDb.update(id, {...})` **sin** el patrón
  `updateMany`+condicional+`count===0` que sí usan `services`/`payments`/`professional-documents`/
  `professional-portfolio`/`payment-disputes`. No es un bug que esta spec deba resolver (son
  acciones de staff, de baja frecuencia, sin dos admins compitiendo por el mismo profesional en la
  práctica) pero cambia cómo se engancha la notificación ahí: no hay `count` que chequear, el gate
  es simplemente que el `await` haya resuelto sin excepción. Anotado en la fila correspondiente.

## Objetivo

Listar, priorizar y ubicar con precisión de archivo:método **cada disparo de notificación que
falta** para que la bandeja in-app que Mobile ya especificó deje de estar vacía, y para que Web
tenga de dónde alimentar un centro de notificaciones equivalente si lo necesita. No se diseña un
mecanismo nuevo — `NotificationsService.create()`/`.createBulk()` y la cola `notifications` (Bull)
ya existen y funcionan (lo prueba el único caso real, `DOCUMENT_EXPIRED`). Se especifica **dónde
llamarlos**, no cómo construirlos.

## Alcance

**Incluye**: inventario completo de transiciones de dominio que ya existen en el código y le
importan a un humano del otro lado; priorización imprescindible/deseable; punto de enganche
(archivo + método) para cada una, respetando el orden "transición confirmada → notificación";
preguntas de diseño abiertas para José.

**No incluye** (ver "Qué NO incluye esta spec" al final): implementación de ningún disparo,
extensión del enum `NotificationType`, wiring real de los canales `email`/`sms`, diseño del modelo
de preferencias de notificación, ni el desbloqueo de `PAYMENT_RECEIVED` (depende de `I-02`/`0014`).

## Inventario de eventos y priorización

Convención de prioridad: **IMPRESCINDIBLE** = sin el aviso, una de las partes queda operando a
ciegas sobre algo que ya cambió y que solo puede saber por la app si vuelve a consultarla activamente
(riesgo real de que el flujo se estanque o el usuario pierda dinero/tiempo/una oportunidad).
**DESEABLE** = mejora la experiencia y la velocidad de respuesta del marketplace, pero ninguna
parte queda bloqueada si no llega (puede enterarse por otra vía: volver a abrir el detalle,
coordinación fuera de la app, etc.).

| # | Dominio | Evento (transición ya existente) | Notifica a | Prioridad | Por qué |
|---|---|---|---|---|---|
| 1 | Servicios | Profesional envía una solicitud a un servicio `PENDING` — `ServicesService.createServiceRequest` (`src/api/services/services/services.service.ts:341-369`), alta en `db.createServiceRequest` | Cliente (`service.userId`) | DESEABLE | El cliente puede seguir mirando el detalle del servicio, pero sin aviso no sabe que ya tiene interesados y demora la respuesta — no bloquea el flujo, sí lo enlentece |
| 2 | Servicios | Cliente acepta una solicitud — `ServicesService.respondToServiceRequest` con `dto.status=ACCEPTED` (líneas 379-417) → `ServicesDbService.acceptRequestTransaction` (`src/modules/services-db/services/services-db.service.ts:211-240`) | Profesional cuya solicitud fue aceptada (resolver `professionalId → userId`) | **IMPRESCINDIBLE** | Caso textual del hallazgo: un profesional que no se entera de que le asignaron el servicio no puede empezar a trabajar — producto roto |
| 3 | Servicios | Mismo evento que #2: la transacción rechaza en cascada las demás solicitudes `PENDING` del mismo servicio (`acceptRequestTransaction`, líneas 229-236) | Los demás profesionales cuya solicitud quedó `REJECTED` | DESEABLE | Sin aviso, quedan esperando una respuesta que ya no va a llegar — no bloquea nada suyo, pero desperdicia su tiempo |
| 4 | Servicios | Cliente rechaza una solicitud puntual (misma función, rama `else`, línea 413-416, sin transacción) | Profesional cuya solicitud fue rechazada | DESEABLE | Mismo motivo que #3, evento distinto en el código |
| 5 | Servicios | Profesional acepta un servicio `PENDING` directo, sin pasar por `ServiceRequests` — `ServicesService.acceptService` (líneas 227-251), `db.updateServiceConditional` | Cliente (`service.userId`) | **IMPRESCINDIBLE** | Mismo peso que #2: el cliente no sabe que ya tiene un profesional asignado a menos que vuelva a abrir la app |
| 6 | Servicios | Profesional inicia el trabajo — `ServicesService.startService` (líneas 253-277), `IN_PROGRESS` | Cliente | DESEABLE | Confirmación de que arrancó; en general ya coordinado fuera de la app (visita en persona) |
| 7 | Servicios | Profesional completa el trabajo — `ServicesService.completeService` (líneas 279-339), `COMPLETED` | Cliente | **IMPRESCINDIBLE** | Cierra el loop: el cliente necesita saber que terminó para pagar y calificar — sin aviso, el pago y la calificación quedan huérfanos de disparador |
| 8 | Servicios | Cancelación por cualquiera de las 2 partes — `ServicesService.cancelService` (líneas 191-225), `CANCELLED` | La contraparte de quien canceló | **IMPRESCINDIBLE** | Si cancela el profesional, el cliente sigue esperando a alguien que no viene; si cancela el cliente, el profesional puede estar yendo a un trabajo que ya no existe |
| 9 | Presupuestos | Profesional envía/reemplaza opciones de presupuesto — `BudgetsService.replaceOptions` (`src/api/budgets/services/budgets.service.ts:52-130`), `budgetsDb.replaceOptionsTransaction` | Cliente | **IMPRESCINDIBLE** | Es el entregable que el cliente pidió al abrir la solicitud; sin aviso no sabe que ya puede revisar y elegir — el flujo entero de presupuestos queda esperando una acción que nadie sabe que está pendiente |
| 10 | Presupuestos | Cliente selecciona una opción — `BudgetsService.selectOption` (líneas 154-189) → `BudgetsDbService.selectOptionTransaction` (`src/modules/budgets-db/services/budgets-db.service.ts:147-182`), asigna el servicio al profesional autor de esa opción | Profesional autor de la opción seleccionada | **IMPRESCINDIBLE** | Es la ruta de asignación equivalente a #2 cuando el servicio pasó por presupuestos multi-opción — mismo caso textual del hallazgo |
| 11 | Presupuestos | Mismo evento que #10: rechaza en cascada las demás `ServiceRequests` `PENDING` (líneas 166-173 de `selectOptionTransaction`) | Los demás profesionales con solicitud auto-rechazada | DESEABLE | Igual que #3 |
| 12 | Contratos | Cliente genera el contrato desde la opción seleccionada — `ContractsService.generateContract` (`src/api/contracts/services/contracts.service.ts:45-119`), `contractsDb.create` | Profesional (`professional.userId`) | **IMPRESCINDIBLE** | El contrato no avanza sin las 2 firmas; si el profesional no sabe que existe, nunca firma y el trato se estanca sin que nadie note por qué |
| 13 | Contratos | Una de las partes firma pero el contrato aún no queda `SIGNED` (falta la otra firma) — `ContractsService.signContract` (líneas 141-197), `signAsClientTransaction`/`signAsProfessionalTransaction` | La contraparte que todavía no firmó | **IMPRESCINDIBLE** | Es literalmente "te toca firmar" — sin aviso, la única señal de que es su turno es que alguien vuelva a abrir la app por las dudas |
| 14 | Contratos | Ambas firmas completas, `status` pasa a `SIGNED` y se genera el PDF — mismo método, líneas 191-193 (`generateAndStorePdf`) | Ambas partes (cliente y profesional) | **IMPRESCINDIBLE** | Confirmación legal de que el contrato es efectivo y el PDF ya está disponible — dispara además la expectativa de inicio del servicio |
| 15 | Pagos | `PaymentStatus.PENDING → COMPLETED` (pago confirmado) | Cliente (recibo) y profesional (cobro) | **IMPRESCINDIBLE, pero BLOQUEADO** | `NotificationType.PAYMENT_RECEIVED` ya existe en el enum, pero **ningún método del código transiciona un pago a `COMPLETED` hoy** (webhook de Stripe removido por `A-01`, Dinelco pendiente de `I-02`/`0014`). No hay dónde enganchar el disparo todavía — dependencia cruzada, no evento disponible |
| 16 | Pagos | Reembolso ejecutado — `PaymentApiService.refundPayment` (`src/api/payments/services/payments.service.ts:228-242`) → `PaymentDbService.executeRefund` (`src/modules/payments-db/services/payment-db.service.ts:256`, ya TOCTOU-safe con `SELECT...FOR UPDATE`) | Cliente | **IMPRESCINDIBLE** | Movimiento de dinero; el cliente necesita confirmación de que el reembolso se ejecutó y por cuánto |
| 17 | Pagos | Mismo evento que #16 | Profesional, si el reembolso afecta lo que iba a cobrar | DESEABLE | Le conviene saber que el monto neto cambió, pero no es información que bloquee una acción suya inmediata |
| 18 | Pagos | Cliente cancela un pago `PENDING` — `PaymentApiService.cancelPayment` (líneas 202-226), `updatePaymentConditional` | Profesional asociado (`payment.professionalId`) | DESEABLE | Evita que el profesional cuente con un cobro que ya no va a llegar |
| 19 | Calificaciones | Cliente califica al profesional — `RatingsService.create` (`src/api/ratings/services/ratings.service.ts:94-142`) | Profesional | DESEABLE | Refuerza el uso del historial de reputación, no bloquea ninguna transacción en curso |
| 20 | Calificaciones | Profesional califica al cliente — `RatingsService.createProfessionalToClientRating` (líneas 148-190) | Cliente | DESEABLE | Simétrico a #19 |
| 21 | Calificaciones | Se reporta una calificación para moderación — `RatingsService.reportRating` (líneas 325-338), `db.report` | Staff con acceso a la cola de moderación | DESEABLE | Ya existe `GET` de auditoría para que staff la vea por su cuenta; el aviso solo acelera la respuesta |
| 22 | Documentos profesionales | Documento aprobado — `ProfessionalDocumentsService.review` con `status=APPROVED` (`src/api/professional-documents/services/professional-documents.service.ts:164-210`), `documentsDb.updateStatusConditional` | Profesional | **IMPRESCINDIBLE** | Gatea `requiredDocumentsVerified` (`ProfessionalVerificationHelper.recompute`, llamado en la misma función) — sin saber que se aprobó, el profesional no sabe que ya puede operar |
| 23 | Documentos profesionales | Documento rechazado — mismo método, `status=REJECTED`, con `rejectionReason` | Profesional | **IMPRESCINDIBLE** | Sin el aviso (y el motivo), el profesional queda bloqueado sin saber que tiene que volver a subir algo, ni qué corregir |
| 24 | Documentos profesionales | Documento vencido — `ProfessionalDocumentsExpirationJob.run` (cron 3am) | Profesional | Ya implementado | Único disparo real que existe hoy — se incluye en la tabla solo como referencia, no como pendiente |
| 25 | Portafolio | Ítem de portafolio aprobado/rechazado — `ProfessionalPortfolioService.review` (`src/api/professional-portfolio/services/professional-portfolio.service.ts:128-156`), `portfolioDb.updateStatusConditional` | Profesional | DESEABLE | Es contenido de marketing/galería, no gatea la capacidad de operar (a diferencia de #22/#23) |
| 26 | Disputas | Se abre una disputa sobre un pago — `PaymentDisputesService.openDispute` (`src/api/payment-disputes/services/payment-disputes.service.ts:71-102`), `disputesDb.create` | La contraparte del pago que NO la abrió (cliente o profesional, el que no inició el reclamo) | **IMPRESCINDIBLE** | Debido proceso mínimo: quien es objeto de un reclamo tiene que saber que existe, no enterarse cuando ya está resuelto |
| 27 | Disputas | Staff toma una disputa — `PaymentDisputesService.claim` (líneas 130-144), `disputesDb.claim` | Ambas partes (opcional, ver §5) | DESEABLE | "Alguien ya está mirando tu caso" reduce ansiedad pero no desbloquea nada por sí solo |
| 28 | Disputas | Disputa resuelta — `PaymentDisputesService.resolve` (líneas 146-173), `disputesDb.resolve` (dispara `executeRefund` si corresponde, dentro de la misma transacción según `I-03-dispute-records.md` regla #6) | Ambas partes | **IMPRESCINDIBLE** | Es el desenlace económico del reclamo — ninguna parte debería enterarse solo si vuelve a mirar la app por costumbre |
| 29 | Disputas | Disputa retirada por quien la abrió — `PaymentDisputesService.withdraw` (líneas 175-207) | — (nadie más la había tomado; `withdraw` solo es posible en `OPEN`) | N/A | No hay una segunda parte informada todavía en ese estado — no aplica notificación |
| 30 | Borrado de cuenta | Se solicita el borrado, arranca la ventana de gracia — `AccountDeletionService.requestDeletion` (`src/api/account-deletion/services/account-deletion.service.ts:117-152`), `accountDeletionDb.requestDeletion` | El propio usuario | **IMPRESCINDIBLE** | Requisito de claridad legal (misma base que motivó `I-01`): el usuario necesita confirmación de que se registró el pedido, la fecha efectiva, y cómo cancelarlo |
| 31 | Borrado de cuenta | Se cancela el borrado dentro de la ventana — `AccountDeletionService.cancelDeletion` (líneas 154-163) | El propio usuario | **IMPRESCINDIBLE** | Confirmación de que la cuenta sigue activa — mismo nivel de necesidad que #30 |
| 32 | Borrado de cuenta | Anonimización efectiva — `AccountDeletionAnonymizationJob.run` (cron 4am, `src/api/account-deletion/jobs/account-deletion-anonymization.job.ts`) | — | N/A | Para cuando este job corre, `Users` ya se anonimizó — no hay a quién notificar ni con qué identidad. Ver nota de diseño en §5 |
| 33 | Profesionales *(hallazgo adicional, adyacente a "documentos profesionales")* | Staff aprueba/rechaza el alta del profesional — `ProfessionalsService.verifyProfessional` (`src/api/professionals/services/professionals.service.ts:267-282`) | Profesional | **IMPRESCINDIBLE** | Caso textual del hallazgo, versión más literal aún que #22: sin este aviso, el profesional no sabe que ya puede (o no puede) operar en la plataforma |
| 34 | Profesionales *(idem)* | Staff suspende a un profesional — `ProfessionalsService.suspendProfessional` (líneas 284-297) | Profesional | **IMPRESCINDIBLE** | Necesita saber por qué dejó de poder operar, para poder responder o apelar |

**Total: 34 filas de inventario** (32 corresponden a transiciones sin disparo hoy + 1 fila de
referencia ya implementada, #24, + 1 fila sin aplicar, #29/#32 cuentan como "N/A" explícito, no
como pendiente). De las 32 accionables: **16 IMPRESCINDIBLE, 15 DESEABLE, 1 IMPRESCINDIBLE pero
bloqueada por dependencia externa** (#15, `PAYMENT_RECEIVED`).

## Dónde engancha cada disparo — regla general

Ya está anotada por fila en la tabla, pero la regla que las gobierna a todas (la "trampa" que
pidió la tarea que no se pierda): **el disparo va después de confirmar que la transición ocurrió,
nunca antes ni en paralelo.**

- Donde el service usa `updateMany` condicional + `count === 0` (todas las de `services`,
  `budgets`(vía transacción), `payments`, `professional-documents`, `professional-portfolio`,
  `payment-disputes`) — la notificación va **después** del `if (updatedCount === 0) throw ...`,
  nunca antes del chequeo. Ejemplo ya en el código a seguir:
  `ProfessionalDocumentsExpirationJob.run` (línea 40-56): actualiza, chequea `updatedCount === 0 →
  continue`, y **recién ahí** llama `notificationsService.create(...)`.
- Donde el service usa `update()` incondicional sin `updateMany` (`verifyProfessional`,
  `suspendProfessional` en `professionals.service.ts`) no hay `count` que chequear — el gate es
  que el `await` haya resuelto sin lanzar. Mismo principio, mecanismo más simple porque no hay
  condición de carrera que ese código module hoy.
- Donde la transición vive dentro de un `$transaction` de Prisma (`acceptRequestTransaction`,
  `selectOptionTransaction`, `signAsClientTransaction`/`signAsProfessionalTransaction`,
  `disputesDb.resolve` si dispara `executeRefund`) — `NotificationsService.create()` escribe en
  Mongo + encola en Bull (Redis), **no puede participar de la transacción de Postgres** (son
  motores de datos distintos). El disparo tiene que ir después de que el `$transaction` de Prisma
  ya resolvió (commiteó), nunca dentro del callback de `tx`. Esto es una limitación real de la
  infraestructura actual, no una preferencia de estilo — ver pregunta de diseño §5.

## Preguntas de diseño abiertas para José

1. **¿Reintento o pérdida si falla el envío?** `NotificationsProcessor.handleSendNotification`
   hoy, si el envío por algún canal lanza, marca el documento Mongo como `FAILED` y relanza el
   error (`throw error`, líneas 68-73 del processor) — pero no hay ningún `@Process` con reintentos
   configurados (`Bull` los soporta con `attempts`/`backoff`, no está seteado en
   `@InjectQueue('notifications')`). ¿Se acepta perder notificaciones que fallan (el usuario igual
   puede ver el estado real vía `GET /services/:id` etc.), o hace falta configurar reintentos con
   backoff? Esto pesa más para las filas IMPRESCINDIBLE (asignación de servicio, contrato, pago,
   disputa) que para las DESEABLE.
2. **¿El disparo va dentro de la transacción de negocio, o fuera?** Ya anotado arriba: como
   `NotificationsService.create()` escribe en Mongo/Redis, no puede ser parte atómica de un
   `$transaction` de Prisma. Eso significa que, en el escenario donde el `$transaction` de Postgres
   commitea pero el proceso muere (o Mongo/Redis están caídos) antes de la llamada a
   `NotificationsService.create()` que sigue, **la transición de negocio queda aplicada sin que
   nadie se entere** — ej. un servicio queda `ACCEPTED` pero el profesional nunca recibe el aviso.
   ¿Se acepta ese riesgo (la fuente de verdad sigue siendo consultar el recurso, la notificación es
   "mejor esfuerzo"), o hace falta un outbox/reintento a nivel de aplicación para no depender de
   que el proceso no se caiga en esa ventana exacta?
3. **¿Cuáles de estos eventos además deberían mandar email?** `modules/email` (`EmailService`) ya
   existe y se usa para otros flujos (auth, onboarding). El canal `'email'` del propio
   `CreateNotificationRequestDTO` está declarado pero es un stub sin implementar (ver "Hallazgos
   colaterales"). Casos donde el in-app/push claramente no alcanza: `#30`/`#31` (borrado de
   cuenta — el usuario puede no abrir la app durante la ventana de gracia, y un email es la única
   vía con rastro fuera de la sesión activa) y `#22`/`#23`/`#33`/`#34` (documentos/verificación de
   profesional — decisiones que afectan si puede seguir operando, vale la pena que quede en su
   bandeja de entrada real). ¿Se resuelve wireando el canal `email` del processor a `EmailService`
   como parte de esta implementación, o queda como una fase aparte y estos eventos salen solo por
   `in_app`/`push` por ahora?
4. **Cómo se cruza esto con las preferencias de notificación que Mobile especificó.**
   `TekoApp-Frontend-Mobile/openspec/specs/notification-preferences-and-inbox.md` (líneas 76-87 de
   ese archivo) deja anotado que **hoy no existe dónde persistir preferencias por tipo** — ni un
   campo en Postgres, ni una colección en Mongo — y que la decisión Postgres-vs-Mongo le
   corresponde al backend. Dos preguntas concretas: (a) ¿esta spec de disparo de eventos debería
   esperar a que exista el modelo de preferencias (para no mandar de más y tener que pedir perdón
   después), o conviene implementar los disparos primero, sin respetar preferencias todavía
   (`channels` fijo por tipo de evento, como ya hace `ProfessionalDocumentsExpirationJob` con
   `['in_app', 'push']` hardcodeado), y las preferencias llegan como filtro encima después? (b) si
   se elige "preferencias después", ¿dónde vive ese modelo — tabla Postgres nueva o colección
   Mongo junto al resto de `notifications-db`? La spec de Mobile deja las dos opciones abiertas sin
   inclinarse por ninguna.
5. **Notificar en `claim` de disputas (#27) y en aceptación/rechazo (#3, #4, #11) — ¿vale la pena
   el volumen?** Son las filas DESEABLE con más ruido potencial (cada solicitud auto-rechazada
   genera una notificación). ¿Se implementan igual, o se agrupan (ej. "recibiste 3 rechazos hoy")
   — que es justo el tipo de agrupación que la propia spec de Mobile deja fuera de su alcance
   (línea 108, "notificaciones agrupadas/resumidas... fuera de esta fase")?

## Qué NO incluye esta spec

- **Ninguna implementación.** Ni una línea de `src/` cambia con esta tarea.
- **Extender `NotificationType`** con los ~15 valores nuevos que este inventario necesita (hoy
  solo cubre `SERVICE_*`, `PAYMENT_RECEIVED`, `RATING_RECEIVED`, `PROMOTION`, `SYSTEM`,
  `DOCUMENT_EXPIRED` — faltan, como mínimo, valores para presupuestos, contratos, disputas,
  borrado de cuenta y verificación/suspensión de profesional). Se deja para la implementación,
  guiada por los nombres usados en la columna "Evento" de la tabla.
- **Wireado real de los canales `email`/`sms`** del `NotificationsProcessor` — solo se deja
  anotado como hallazgo y como pregunta de diseño §5.3.
- **`PAYMENT_RECEIVED` (#15)** — bloqueado por `I-02`/`0014`, no por esta spec.
- **El modelo de preferencias de notificación** que Mobile especificó y dejó pendiente del lado
  backend — pregunta de diseño §5.4, no resuelta acá.
- **Consumo del stream SSE** ni ninguna pantalla de Mobile o Web — eso es responsabilidad de cada
  frontend sobre una API que ya existe.
- **Agrupación/resumen de notificaciones** (ej. "3 solicitudes rechazadas hoy") — Mobile ya lo dejó
  fuera de su propio alcance; esta spec tampoco lo diseña.
