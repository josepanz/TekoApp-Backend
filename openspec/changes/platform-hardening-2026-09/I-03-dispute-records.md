# Spec: Registro y adjudicación de disputas de pago (I-03)

Origen: `openspec/changes/platform-hardening-2026-09/WORKPLAN.md` §5, I-03. Entregable de esta
tarea: **spec, no implementación**.

## Contexto: de qué partimos

Los reembolsos ya existen y son sólidos técnicamente — verificado en `PaymentDbService.executeRefund`
(`src/modules/payments-db/services/payment-db.service.ts:256`): `SELECT ... FOR UPDATE` dentro de
una transacción, acumula reembolsos parciales, valida contra `PaymentStatus`. **No se toca ese
mecanismo** — esta spec lo envuelve, no lo reemplaza.

Lo que falta es todo lo que rodea la decisión de reembolsar:

- `RefundPaymentDto` (`src/api/payments/dtos/request/refund-payment.dto.ts`) ya tiene un enum
  `RefundReason` (7 valores: `CUSTOMER_REQUEST`, `DUPLICATE_PAYMENT`, `FRAUD`,
  `SERVICE_NOT_PROVIDED`, `POOR_SERVICE_QUALITY`, `TECHNICAL_ISSUE`, `OTHER`) y una `description`
  libre — pero es un enum de **TypeScript**, no de Prisma: vive solo en el DTO, no en una tabla, y
  se guarda sin estructura dentro de `Payments.refundDetails` (`Json?`). No hay forma de listar
  "todas las disputas abiertas", ni de saber quién decidió qué sin abrir el JSON a mano.
- **Quien pide el reembolso y quien lo ejecuta son la misma llamada**: `POST /payments/:id/refund`
  dispara `executeRefund` directo, no existe un paso previo de "se abrió un caso" separado de "se
  resolvió". No hay estado intermedio, no hay cola de revisión, no hay forma de que el CLIENTE o
  el PROFESIONAL inicien un reclamo sin que alguien con acceso al endpoint ya haya decidido
  reembolsar.
- **Hallazgo relacionado, fuera de alcance de esta spec pero relevante para diseñarla**: verificado
  el 2026-09-06, `PaymentController.refund` (`src/api/payments/controllers/payments.controller.ts:159-167`)
  **no tiene `@UseGuards(PermissionsGuard)` ni `@Permissions(...)`** — a diferencia de los otros 3
  endpoints de auditoría del mismo controller, que sí exigen `PAYMENTS.AUDIT_VIEW`. Cualquier
  usuario con sesión válida (`JwtAuthGuard` del controller, ninguna verificación de que sea parte
  del pago) puede hoy reembolsar cualquier `Payments.id`. Esto no es un hallazgo nuevo del WORKPLAN
  y esta spec no lo corrige — pero el diseño de abajo asume que la vía de adjudicación real
  **reemplaza** ese endpoint sin gate, y lo anota explícitamente para que no se pierda.

## Objetivo

Modelar un **caso de disputa** como entidad propia: quién la abrió, por qué, con qué evidencia,
quién la adjudicó, con qué resultado — y que el reembolso (si corresponde) sea una consecuencia
registrada de esa adjudicación, no un hecho suelto.

## Alcance

**Incluye**: apertura de disputa por cliente o profesional sobre un pago concreto, cola de
revisión para staff, adjudicación con resultado estructurado, ejecución del reembolso (si el
resultado lo exige) atada a la disputa que lo justifica, evidencia adjunta opcional (reusa
`modules/storage`).

**No incluye**: mediación automática, integración con un organismo externo de resolución de
disputas, disputas sobre algo que no sea un pago (ej. una reseña injusta — eso ya tiene su propio
mecanismo de reporte si existiera, fuera del alcance de pagos).

## Modelo de dominio (Prisma) — propuesta

Sigue el patrón estándar del repo: `id Int @id @default(autoincrement())` + `referenceId String
@unique @default(uuid())` + columnas de auditoría, migración terminada con
`SELECT fn_attach_audit_triggers();`.

```prisma
enum DisputeStatus {
  OPEN            // recién abierta, en cola sin asignar
  UNDER_REVIEW     // un staff la tomó (adjudicatedByUserId seteado, todavía sin resolución)
  RESOLVED         // adjudicada, con resolution + resolvedAt
  REJECTED         // adjudicada como improcedente (variante de RESOLVED con resolution=NO_REFUND,
                    // separada para que un filtro simple "¿quedan pendientes?" no tenga que mirar
                    // el campo resolution)
  WITHDRAWN        // quien la abrió la retiró antes de que staff la resuelva
}

enum DisputeReason {
  SERVICE_NOT_PROVIDED
  POOR_SERVICE_QUALITY
  OVERCHARGE
  DUPLICATE_PAYMENT
  FRAUD
  OTHER
}
// Reemplaza al `RefundReason` de TypeScript-only que hoy vive en refund-payment.dto.ts — ver
// "Migración del RefundReason existente" abajo. `TECHNICAL_ISSUE`/`CUSTOMER_REQUEST` del enum
// viejo no tienen sentido como MOTIVO DE DISPUTA (no son un reclamo entre las partes, son razones
// administrativas) — se preservan solo para el reembolso directo de staff sin disputa (ver
// "Camino sin disputa" abajo).

enum DisputeResolution {
  FULL_REFUND
  PARTIAL_REFUND
  NO_REFUND
  OTHER_REMEDY     // ej. descuento en un servicio futuro — no mueve plata en este pago, se registra
                    // igual para dejar rastro de que la disputa SÍ tuvo una resolución
}

/// Quién puede abrir: el cliente o el profesional del pago (`openedByUserId` debe ser uno de los
/// dos — validado en el service, no a nivel de FK). Quién adjudica: staff con
/// `PERMISSIONS.DISPUTES.ADJUDICATE`.
model PaymentDisputes {
  id                  Int               @id @default(autoincrement())
  referenceId         String            @unique @default(uuid()) @map("reference_id")
  paymentId           Int               @map("payment_id")
  openedByUserId      Int               @map("opened_by_user_id")
  reason              DisputeReason
  description         String            @db.Text
  evidenceKeys        String[]          @default([]) @map("evidence_keys") // S3 keys, mismo patrón que professional-documents
  status              DisputeStatus     @default(OPEN)
  adjudicatedByUserId Int?              @map("adjudicated_by_user_id")
  resolution          DisputeResolution?
  resolutionNotes     String?           @db.Text @map("resolution_notes")
  refundAmount        Decimal?          @db.Decimal(10, 2) @map("refund_amount") // solo si resolution es FULL_REFUND/PARTIAL_REFUND
  resolvedAt          DateTime?         @map("resolved_at")

  payment           Payments @relation(fields: [paymentId], references: [id])
  openedBy          Users    @relation("DisputeOpenedBy", fields: [openedByUserId], references: [id])
  adjudicatedBy     Users?   @relation("DisputeAdjudicatedBy", fields: [adjudicatedByUserId], references: [id])

  createdAt       DateTime  @default(now()) @map("created_at")
  createdBy       String?   @map("created_by")
  lastChangedAt   DateTime? @default(now()) @map("last_changed_at")
  lastChangedBy   String?   @map("last_changed_by")
  changedReason   String?   @map("changed_reason")
  checksum        String?   @map("checksum")
  changeSignature String?   @map("change_signature")

  @@index([paymentId])
  @@index([status])
  @@map("payment_disputes")
}
```

**Por qué `paymentId` sin `@@unique`**: un mismo pago puede tener más de una disputa a lo largo
del tiempo (una `REJECTED` no impide que surja un reclamo distinto después) — pero el service debe
impedir 2 disputas simultáneamente `OPEN`/`UNDER_REVIEW` sobre el mismo pago (ver "Reglas de
negocio" abajo), no a nivel de constraint de DB sino de lógica (la regla depende del estado, no es
expresable como `@@unique` simple).

## Reglas de negocio

1. **Quién puede abrir una disputa**: solo el cliente (`Payments.userId`) o el profesional
   (`Payments.professionalId` → `Professionals.userId`) del pago — mismo patrón de "es parte del
   recurso" que ya usa `ContractsService.getContract` (`isClient`/`isProfessional`, 403 si
   ninguno).
2. **Un pago no puede tener 2 disputas activas a la vez**: si ya existe una `OPEN`/`UNDER_REVIEW`
   para ese `paymentId`, rechazar la apertura de una nueva con 409 (mismo espíritu que el patrón
   `updateMany` + `ConflictException` del resto del repo, aplicado acá como un chequeo previo por
   ser una tabla nueva sin fila que "transicionar").
3. **Solo un pago `COMPLETED`/`PARTIAL_REFUNDED` puede disputarse** — mismo universo de estados que
   ya exige `executeRefund` (`payment-db.service.ts:275-278`); no tiene sentido disputar un pago
   `PENDING`/`FAILED`.
4. **Transición `OPEN` → `UNDER_REVIEW`**: staff con `DISPUTES.ADJUDICATE` la toma
   (`adjudicatedByUserId` = staff), vía `updateMany({ where: { id, status: 'OPEN' } })` +
   `count === 0` → 409 (dos admins no pueden tomar la misma disputa a la vez).
5. **Transición a `RESOLVED`/`REJECTED`/`WITHDRAWN`**: análoga, `updateMany` condicional desde
   `UNDER_REVIEW` (o desde `OPEN` directo, si se decide permitir resolver sin el paso intermedio —
   **a definir en la implementación**, esta spec no fuerza el paso por `UNDER_REVIEW`).
6. **Si `resolution` es `FULL_REFUND`/`PARTIAL_REFUND`**: la misma operación que marca la disputa
   `RESOLVED` dispara `PaymentDbService.executeRefund(paymentId, refundAmount, reason)` **dentro de
   la misma transacción** (mismo patrón que `ContractsService.signContract` dispara
   `generateAndStorePdf` al llegar a `SIGNED` — un evento de dominio consecuencia de una
   transición de estado, no un paso manual aparte). El `refundDetails` JSON que ya escribe
   `executeRefund` debe incluir `disputeReferenceId` para que el reembolso sea trazable hacia la
   disputa que lo justificó (recorrido inverso: desde `PaymentDisputes` ya se llega al pago por
   `paymentId`, así que no hace falta una FK nueva en `Payments`).
7. **`WITHDRAWN`**: solo quien la abrió puede retirarla, y solo mientras esté `OPEN` (no
   `UNDER_REVIEW` — si un staff ya la tomó, que la resuelva como `REJECTED` con nota, no
   desaparece el caso).

## Camino sin disputa (reembolso directo de staff)

No todo reembolso nace de un reclamo de una de las partes — un staff puede detectar un error de
cobro interno (ej. `DUPLICATE_PAYMENT`) sin que el cliente haya reclamado nada. **Esta spec
propone mantener ese camino**, pero:

- Requiere el mismo permiso `DISPUTES.ADJUDICATE` (cierra el gap de acceso anotado en "Contexto" —
  hoy `refund` no pide ningún permiso) o, alternativamente, un permiso separado
  `PAYMENTS.REFUND.MANAGE` si se quiere distinguir "reembolso administrativo directo" de "adjudicar
  un reclamo de un usuario" — **decisión de producto a tomar en la implementación**, no bloqueante
  para el resto de la spec.
- Sigue sin exigir abrir una `PaymentDisputes` — sería forzar ceremonia donde no hay una disputa
  real entre 2 partes. Pero si se quiere trazabilidad total, la alternativa es crear igual una
  `PaymentDisputes` con `openedByUserId` = el propio staff y saltar directo a `RESOLVED` — más
  consistente pero más pesado. **Se deja como decisión abierta**, no forzada por esta spec.

## Migración del `RefundReason` existente

`RefundReason` (TypeScript, en `refund-payment.dto.ts`) tiene 7 valores; `DisputeReason` (Prisma,
propuesto arriba) tiene 5 — le saqué `CUSTOMER_REQUEST` y `TECHNICAL_ISSUE` porque no son motivos
de **disputa entre 2 partes**, son categorías de reembolso administrativo. Al implementar:

- El endpoint de disputa (`POST /payments/:id/disputes`) usa `DisputeReason` (5 valores).
- El camino sin disputa (arriba) puede seguir aceptando las 7 categorías del `RefundReason`
  original, o colapsarse a un motivo libre + nota — a decidir junto con la decisión de permiso de
  la sección anterior.

## Endpoints (contrato propuesto)

| Método | Ruta | Quién | Descripción |
|---|---|---|---|
| POST | `/payments/:id/disputes` | cliente o profesional del pago | Abre una disputa — `CreateDisputeRequestDTO { reason, description, evidenceKeys? }` |
| GET | `/payments/:id/disputes` | cliente, profesional, o staff con `PAYMENTS.AUDIT_VIEW` | Historial de disputas de ese pago |
| GET | `/admin/disputes` | staff con `DISPUTES.ADJUDICATE` | Cola filtrable por `status`, paginada (mismo patrón que `ContractsService.listAudit`) |
| PATCH | `/admin/disputes/:referenceId/claim` | staff con `DISPUTES.ADJUDICATE` | `OPEN` → `UNDER_REVIEW`, setea `adjudicatedByUserId` |
| PATCH | `/admin/disputes/:referenceId/resolve` | staff con `DISPUTES.ADJUDICATE` | `ResolveDisputeRequestDTO { resolution, resolutionNotes, refundAmount? }` — dispara el reembolso si corresponde |
| POST | `/payments/:id/disputes/:referenceId/withdraw` | quien la abrió | Solo si `status = OPEN` |

**Nuevo permiso** (agregar a `src/common/enum/permissions.enum.ts`, sembrarlo en el catálogo que
ya siembra T-04 de este mismo WORKPLAN):

```typescript
DISPUTES: {
  ADJUDICATE: 'disputes.adjudication:manage',
},
```

## Casos de error

- `404` si `paymentId` no existe, o si `referenceId` de la disputa no existe.
- `403` al abrir si quien llama no es cliente ni profesional del pago (mismo patrón que
  `ContractsService`).
- `409` al abrir si ya hay una disputa `OPEN`/`UNDER_REVIEW` sobre el mismo pago.
- `409` al reclamar (`claim`) si otro staff ya la tomó, o al resolver si ya estaba resuelta —
  `updateMany` condicional, nunca `findUnique` + validar + `update`.
- `400` al resolver con `FULL_REFUND`/`PARTIAL_REFUND` sin `refundAmount`, o con un monto que
  `executeRefund` rechace por exceder el disponible (el error real lo sigue lanzando
  `executeRefund`, esta capa no reimplementa esa validación).

## Efecto sobre otras partes del dominio (a decidir en la implementación, no en esta spec)

- **Contratos** (`Contracts`): si el pago disputado está atado a un contrato firmado, ¿debería
  reflejarse algo en el contrato mismo? Esta spec no lo resuelve — el contrato y el pago son
  entidades independientes hoy (`Contracts` no referencia `Payments` directo), así que una
  disputa de pago no bloquea nada de contratos por default.
- **Calificaciones** (`Ratings`): ¿un servicio con una disputa abierta debería bloquear que se dé
  o se muestre una calificación? No se resuelve acá — es una decisión de producto sobre UX, no de
  modelo de datos.
- **Retención de datos / borrado de cuenta (I-01)**: `PaymentDisputes.openedByUserId` y
  `adjudicatedByUserId` son referencias a `Users` — igual que `Payments`, tienen que sobrevivir
  como registro contable/legal si el usuario borra su cuenta (ver I-01 de este mismo WORKPLAN,
  sección "qué se anonimiza"). Anotado ahí como dependencia cruzada.

## Fuera de alcance de esta spec

- El fix del gap de permiso en `POST /payments/:id/refund` (anotado en "Contexto", no
  implementado acá).
- Mediación externa o integración con una pasarela de disputas de terceros.
- UI de ninguno de los 2 frontends (Web necesita una cola de staff, Mobile necesita la pantalla de
  "reclamar por este pago" — ninguna se diseña acá).

## Riesgos / límites explícitos

- El "camino sin disputa" (staff reembolsa directo) sigue siendo posible por diseño — si no se le
  exige ningún permiso nuevo en la implementación real, el gap de acceso actual **sigue abierto**
  aunque exista todo el modelo de disputas de arriba. La spec no alcanza sin ese fix acompañándola.
- `evidenceKeys` como `String[]` de keys de S3 es el mínimo viable; no incluye ni tamaño máximo, ni
  tipos de archivo permitidos, ni revisión de contenido — mismo nivel de rigor que
  `professional-documents` hoy (revisión manual, sin OCR ni validación automática).
