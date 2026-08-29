# Spec: Contratos generados desde el presupuesto aceptado

Ver también: `TekoApp-Frontend-Mobile/openspec/specs/service-contracts.md` (mobile),
`TekoApp-Frontend-Mobile/openspec/decisions.md` — backlog 2026-08-22 ítem 9, y backlog 2026-08-08
ítem 4 (contrato cliente↔profesional con firma digital, ya mencionado ahí en términos generales —
esta spec lo concreta usando el presupuesto de `multi-option-quotes.md` como contenido).

**Depende de `multi-option-quotes.md`** — no tiene sentido implementar esta sin esa primero.

## Objetivo

Al seleccionar una `BudgetOptions`, generar un contrato cliente↔profesional cuyo contenido es el
presupuesto elegido (materiales, precio, alcance), con un mecanismo de aceptación explícita de
ambas partes ("firma digital" en el sentido de consentimiento registrado, no de firma
criptográfica calificada — ver Riesgos).

## Alcance

**Incluye**: snapshot inmutable del contenido del contrato al momento de generarlo, flujo de
aceptación en dos pasos (cliente y profesional firman por separado), PDF generado una vez firmado
por ambos, historial de contratos por usuario.

**No incluye**: una firma digital criptográficamente calificada (FIDO/PKI/eIDAS) — es un
"clickwrap" reforzado (nombre completo tipeado + checkbox + hash del contenido + timestamp). No
incluye texto legal de cláusulas reales — usa el marco de versionado de `data-and-media-consent.md`
/backlog ítem 4, pendiente de contenido real por país.

## Modelo de dominio (Prisma)

```prisma
enum ContractStatus {
  DRAFT
  PENDING_CLIENT_SIGNATURE
  PENDING_PROFESSIONAL_SIGNATURE
  SIGNED
  CANCELLED
}

model Contracts {
  id              Int            @id @default(autoincrement())
  referenceId     String         @unique @default(uuid()) @map("reference_id")
  serviceId       Int            @map("service_id")
  budgetOptionId  Int            @map("budget_option_id")
  clientUserId    Int            @map("client_user_id")
  professionalId  Int            @map("professional_id")
  status          ContractStatus @default(DRAFT)

  /// Snapshot inmutable al momento de generar el contrato — nunca se relee BudgetOptions en vivo
  /// después de creado.
  contentSnapshot Json           @db.JsonB @map("content_snapshot")
  legalTermsVersionId Int?       @map("legal_terms_version_id") // FK a LegalDocumentVersions

  clientSignedAt        DateTime? @map("client_signed_at")
  clientSignatureName   String?   @map("client_signature_name")
  clientSignatureHash   String?   @map("client_signature_hash")
  professionalSignedAt      DateTime? @map("professional_signed_at")
  professionalSignatureName String?   @map("professional_signature_name")
  professionalSignatureHash String?   @map("professional_signature_hash")

  pdfKey String? @map("pdf_key") // generado recién cuando status pasa a SIGNED

  service      Services      @relation(fields: [serviceId], references: [id])
  budgetOption BudgetOptions @relation(fields: [budgetOptionId], references: [id])
  professional Professionals @relation(fields: [professionalId], references: [id])

  createdAt     DateTime  @default(now()) @map("created_at")
  createdBy     String?   @map("created_by")
  lastChangedAt DateTime? @default(now()) @map("last_changed_at")
  lastChangedBy String?   @map("last_changed_by")
  changedReason String?   @map("changed_reason")
  isActive      Boolean   @default(true) @map("is_active")

  @@map("contracts")
  @@index([serviceId])
}
```

`contentSnapshot` guarda, congelado: título/alcance del `Service`, `label`/`description`/
`totalPrice`/`estimatedHours` de la `BudgetOptions`, y el detalle de `BudgetLineItems`.

## Qué es parametrizable/configurable

- **`legalTermsVersionId`**: qué versión de términos/cláusulas aplica, resuelta según el país del
  `Service` al momento de generar el contrato — apunta al catálogo versionado de
  `data-and-media-consent.md`, nunca un texto hardcodeado.
- **Quién debe firmar**: hoy ambas partes son requeridas para `SIGNED` — si algún país/categoría no
  lo exige, se puede agregar un flag `requiresProfessionalSignature` en `Category` (mismo patrón
  que `requiresVerification`/`requiresProgressLog`), no implementado en esta primera versión.

## Endpoints (contrato)

`src/api/contracts/` + `src/modules/contracts-db/`.

| Método | Ruta | Quién | Descripción |
|---|---|---|---|
| POST | `/budget-options/:referenceId/generate-contract` | cliente dueño del servicio | Crea el contrato directo en `PENDING_CLIENT_SIGNATURE` con el snapshot armado server-side. Idempotente: si ya existe uno para esa opción, lo devuelve en vez de fallar |
| GET | `/contracts` | usuario autenticado | Listado propio (contratos donde es cliente o profesional), sin paginar — agregado durante la implementación, no estaba en la spec original (ver `openspec/decisions.md`) |
| GET | `/contracts/:referenceId` | cliente o profesional del contrato | Devuelve `contentSnapshot` + estado de firmas + `viewerRole` (`CLIENT`/`PROFESSIONAL`, agregado durante la implementación para que mobile/web puedan mostrar "pendiente de tu firma" vs. "de la otra parte" sin exponer `clientUserId`/`professionalId`) |
| POST | `/contracts/:referenceId/sign` | cliente o profesional (según a quién le toca) | `SignContractRequestDTO { fullName, accepted: true }` — hash generado server-side |
| GET | `/contracts/:referenceId/pdf` | cliente, profesional, staff | URL presignada al `pdfKey`, solo si `status = SIGNED` |
| GET | `/admin/contracts` | staff (`contracts.audit:read`/`admin:all`) | Listado completo paginado, para soporte/disputas legales |

## Casos de error

- `409` en `sign()` vía `updateMany` condicional (`WHERE status = <estado_esperado>`) — nunca
  `findUnique` + `update` incondicional.
- `403` si el `pdfKey` se pide antes de `status = SIGNED`.

## Fuera de alcance de esta spec

Redacción legal real de cláusulas (ver Riesgos).

## Riesgos / límites explícitos

- **No es una firma digital calificada.** El mecanismo (nombre tipeado + checkbox + hash +
  timestamp del contenido) es un registro de consentimiento fuerte pero no equivale a una firma
  electrónica avanzada/calificada bajo marcos como eIDAS o leyes locales de firma digital —
  confirmar con asesoría legal por país si esto es suficiente para el valor probatorio que se
  necesita.
- El contenido legal real de las cláusulas del contrato requiere redacción legal real por país —
  mismo límite ya declarado para el backlog 2026-08-08 ítem 4.
- Si `BudgetOptions`/`Category` cambian después de firmado un contrato, no afecta el contrato ya
  generado (por el snapshot) — comportamiento esperado, no bug.
