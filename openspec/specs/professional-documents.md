# Spec: Documentos y antecedentes del profesional

Ver también: `TekoApp-Frontend-Mobile/openspec/specs/professional-documents.md` (mobile),
`TekoApp-Frontend-Web/openspec/specs/professional-documents.md` (backoffice de verificación),
`TekoApp-Frontend-Mobile/openspec/decisions.md` — backlog 2026-08-22 ítem 6 y backlog 2026-08-08
ítem 4 (marco legal/consentimiento).

## Objetivo

Modelar dos categorías de documento del profesional, ambas parametrizables por país y por
categoría de servicio:

1. **Antecedentes policiales/judiciales** — verificación activable/desactivable según el país y la
   categoría del profesional, con vigencia y comportamiento ante vencimiento.
2. **Documentos de habilitación** — títulos, certificados y evidencia de trabajos previos
   (portafolio), visibles para el cliente al elegir profesional.

## Alcance

**Incluye**: catálogo parametrizable de tipos de documento (qué se pide, obligatorio/opcional, por
país/categoría, vigencia), carga del documento por el profesional, cola de revisión por staff
(aprobar/rechazar con motivo), expiración automática, exposición pública acotada (solo lo aprobado
y solo lo que corresponde ver a un cliente) y exposición completa para staff.

**No incluye**: verificación automática/integrada contra un organismo oficial (ej. Policía
Nacional, Poder Judicial) — la revisión es manual por staff en esta fase. No incluye OCR ni
validación automática de autenticidad del documento. No incluye pagos por la verificación.

## Modelo de dominio (Prisma)

Todas las tablas nuevas siguen el patrón estándar del proyecto: `id Int @id @default(autoincrement())`
+ `referenceId String @unique @default(uuid()) @map("reference_id")`, columnas de auditoría
(`createdAt`/`createdBy`/`lastChangedAt`/`lastChangedBy`/`changedReason`/`isActive`/`checksum`/
`changeSignature`) para calificar para `fn_attach_audit_triggers()` (ver
`.claude/rules/database-conventions.md`).

```prisma
enum DocumentCategory {
  BACKGROUND_CHECK   // antecedentes policiales/judiciales
  QUALIFICATION       // títulos, certificados
  PORTFOLIO           // evidencia de trabajos previos
}

enum DocumentReviewStatus {
  PENDING
  APPROVED
  REJECTED
  EXPIRED
}

/// Catálogo parametrizable — qué documento se pide, a quién, y con qué reglas.
/// countryId/professionalCategoryId NULL = aplica globalmente (sin scoping).
model DocumentTypes {
  id                     Int              @id @default(autoincrement())
  referenceId            String           @unique @default(uuid()) @map("reference_id")
  code                   String           @unique @db.VarChar(60) // ej. "BG_CHECK_CRIMINAL_PY"
  name                   String           @db.VarChar(150)
  description            String?          @db.Text
  category               DocumentCategory
  countryId              Int?             @map("country_id")
  professionalCategoryId Int?             @map("professional_category_id") // FK a Category
  isRequired             Boolean          @default(false) @map("is_required")
  validityDays           Int?             @map("validity_days") // null = no vence
  requiresStaffReview    Boolean          @default(true) @map("requires_staff_review")
  isVisibleToClient      Boolean          @default(false) @map("is_visible_to_client") // ej. antecedentes NUNCA visibles en crudo
  sortOrder              Int              @default(0) @map("sort_order")
  isActive               Boolean          @default(true) @map("is_active")

  country              Country?      @relation(fields: [countryId], references: [id])
  professionalCategory Category?     @relation(fields: [professionalCategoryId], references: [id])
  documents            ProfessionalDocuments[]

  createdAt     DateTime  @default(now()) @map("created_at")
  createdBy     String?   @map("created_by")
  lastChangedAt DateTime? @default(now()) @map("last_changed_at")
  lastChangedBy String?   @map("last_changed_by")
  changedReason String?   @map("changed_reason")

  @@map("document_types")
}

model ProfessionalDocuments {
  id             Int                   @id @default(autoincrement())
  referenceId    String                @unique @default(uuid()) @map("reference_id")
  professionalId Int                   @map("professional_id")
  documentTypeId Int                   @map("document_type_id")
  fileKey        String                @map("file_key") // S3 key, mismo patrón que Users.avatarKey
  status         DocumentReviewStatus  @default(PENDING)
  issuedAt       DateTime?             @map("issued_at")   // fecha de emisión declarada
  expiresAt      DateTime?             @map("expires_at")  // calculada: issuedAt + validityDays, o null
  reviewedAt     DateTime?             @map("reviewed_at")
  reviewedBy     String?               @map("reviewed_by") // referenceId del usuario staff
  rejectionReason String?              @db.Text @map("rejection_reason")
  metadata       Json?                 @db.JsonB // campos libres por tipo (ej. nro. de matrícula)

  professional Professionals @relation(fields: [professionalId], references: [id], onDelete: Cascade)
  documentType DocumentTypes @relation(fields: [documentTypeId], references: [id])

  createdAt     DateTime  @default(now()) @map("created_at")
  createdBy     String?   @map("created_by")
  lastChangedAt DateTime? @default(now()) @map("last_changed_at")
  lastChangedBy String?   @map("last_changed_by")
  changedReason String?   @map("changed_reason")
  isActive      Boolean   @default(true) @map("is_active")
  checksum      String?   @map("checksum")
  changeSignature String? @map("change_signature")

  @@map("professional_documents")
  @@index([professionalId, status])
}
```

`Professionals.verificationStatus` (ya existe, `String @default("unverified")`) se mantiene como
campo agregado/derivado, no se elimina: pasa a `"verified"` cuando todos los `DocumentTypes` con
`isRequired=true` que aplican al país+categoría del profesional tienen un `ProfessionalDocuments`
en estado `APPROVED` y sin vencer. Se recalcula en cada `review`/expiración, vía un helper
`ProfessionalVerificationHelper.recompute(professionalId)`.

## Qué es parametrizable/configurable

- **Catálogo completo de `DocumentTypes` editable sin deploy** — vía CRUD de staff (ver spec de
  Web). Agregar un país o categoría nuevos con sus propios requisitos es insertar filas, no código.
- **Obligatorio/opcional** por combinación país+categoría (`isRequired`, con `countryId`/
  `professionalCategoryId` nulos como comodín "aplica a todos").
- **Vigencia** (`validityDays`, null = sin vencimiento) — determina `expiresAt` al aprobar.
- **Si requiere revisión de staff o se auto-aprueba** (`requiresStaffReview`) — deja la puerta
  abierta a automatizar tipos de documento de bajo riesgo en el futuro sin cambiar el modelo.
- **Visibilidad al cliente** (`isVisibleToClient`) — por defecto los antecedentes NUNCA son
  visibles en crudo para un cliente (solo un booleano derivado "verificado"), pero el flag es por
  tipo de documento, no hardcodeado por categoría.

## Endpoints (contrato)

Estructura de carpetas según `.claude/rules/typescript.md`: `src/api/professional-documents/` +
`src/modules/professional-documents-db/`, más `src/api/document-types/` (catálogo, CRUD staff) +
`src/modules/document-types-db/`.

| Método | Ruta | Quién | Descripción |
|---|---|---|---|
| GET | `/document-types` | público/autenticado | Catálogo filtrable por `countryId`/`professionalCategoryId`, `GetDocumentTypesListQueryDTO` |
| POST | `/admin/document-types` | staff (permiso dedicado) | `CreateDocumentTypeRequestDTO` |
| PATCH | `/admin/document-types/:referenceId` | staff | `UpdateDocumentTypeRequestDTO` |
| POST | `/professionals/me/documents` | profesional | multipart, `CreateProfessionalDocumentRequestDTO { documentTypeId, issuedAt? }` — reutiliza `modules/storage` igual que `uploads.service.ts` |
| GET | `/professionals/me/documents` | profesional | Estado propio de cada tipo requerido + cargado |
| GET | `/professionals/:referenceId/documents/public` | cualquiera autenticado | Solo `APPROVED` + `isVisibleToClient=true` de `DocumentTypes` |
| GET | `/admin/professionals/:referenceId/documents` | staff | Todo, incluidos `PENDING`/`REJECTED`/`EXPIRED` |
| PATCH | `/admin/professional-documents/:referenceId/review` | staff | `ReviewProfessionalDocumentRequestDTO { status: APPROVED|REJECTED, rejectionReason? }` |

Job programado (Bull, mismo mecanismo que ya usa `NotificationsProcessor`): recorre
`ProfessionalDocuments` con `expiresAt < now()` y `status = APPROVED`, las pasa a `EXPIRED` y
dispara notificación al profesional + recomputa `verificationStatus`.

## Casos de error

- `403 CONSENT_REQUIRED` — falta consentimiento vigente (ver `data-and-media-consent.md`), bloquea
  la subida antes de llegar a crear el registro.
- `404` en `POST /professionals/me/documents` si `documentTypeId` no existe o no aplica al
  país/categoría del profesional (nunca crear un `ProfessionalDocuments` de un tipo que no le
  corresponde).
- `409` en `review` si el documento ya no está `PENDING` (revisado por otro admin en simultáneo) —
  `updateMany` condicional, mismo patrón TOCTOU-safe del resto del proyecto.

## Fuera de alcance de esta spec

Verificación automática contra organismos oficiales, contenido legal real de qué exige cada país
(ver `data-and-media-consent.md` para el límite explícito completo).

## Riesgos / límites explícitos

- Los datos de antecedentes policiales/judiciales son datos sensibles — el `fileKey` nunca se
  expone directo al cliente ni a otro profesional; solo staff con permiso dedicado y el propio
  profesional dueño del documento pueden pedir su URL presignada.
- Esta feature comparte el marco de consentimiento de `data-and-media-consent.md` — subir un
  documento debe pasar por el guard de consentimiento activo descrito ahí, no un checkbox propio.
- Qué exige cada país realmente (qué antecedente, con qué vigencia) es una decisión de negocio real
  por país, no una inferencia de esta spec.
