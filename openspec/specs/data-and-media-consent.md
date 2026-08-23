# Spec: Protección de datos, imágenes y su uso

Ver también: `TekoApp-Frontend-Mobile/openspec/specs/data-and-media-consent.md` (mobile),
`TekoApp-Frontend-Web/openspec/specs/data-and-media-consent-admin.md` (config/auditoría de staff),
`TekoApp-Frontend-Mobile/openspec/decisions.md` — backlog 2026-08-22 ítem 11, y backlog 2026-08-08
ítem 4 (marco legal/tributario multi-país) — **esta spec es la extensión concreta de la parte de
consentimiento/minimización de datos de ese ítem, no una feature separada e independiente de él.**

**Spec más fundacional de las 6** — `professional-documents.md`, `work-progress-log.md`,
`multi-option-quotes.md` (si en el futuro incluye fotos) y `ai-content-disclosure.md` (sobre
imágenes) suben o marcan contenido personal/sensible que debe enganchar acá, no inventar su propio
flag de consentimiento. Ver `openspec/README.md` para la recomendación de orden de implementación.

## Objetivo

Modelar el flujo técnico de consentimiento explícito y alcance de uso para todo dato/imagen
subida a la app: fotos de avance (`work-progress-log.md`), documentos/antecedentes
(`professional-documents.md`), fotos de perfil, evidencia de trabajos — con versionado auditable de
qué texto legal aceptó cada usuario, cuándo, y con qué alcance de uso.

## Alcance

**Incluye**: catálogo versionado de documentos legales por país (`LegalDocumentVersions`),
registro de aceptación por usuario con auditoría (`UserConsents`), consentimiento de uso granular
por contenido subido (`ContentConsentGrants`), política de retención configurable por
país/tipo de contenido, guard reusable para bloquear una subida si falta consentimiento vigente,
flujo de revocación/baja de un contenido específico por su dueño.

**No incluye**: el texto legal real de ningún país (ver Riesgos). No incluye anonimización/derecho
al olvido completo en el sentido de borrar físicamente de backups/logs — solo el flujo de
ocultamiento/soft-delete a nivel de aplicación, sujeto a la política de retención configurada.

## Modelo de dominio (Prisma)

```prisma
enum LegalDocumentType {
  TERMS_OF_SERVICE
  PRIVACY_POLICY
  DATA_PROCESSING_CONSENT
  IMAGE_USAGE_CONSENT
}

enum ContentUsageScope {
  APP_INTERNAL_ONLY
  PUBLIC_PROFILE_DISPLAY
  MARKETING
}

/// Catálogo versionado, editable sin deploy por staff.
model LegalDocumentVersions {
  id           Int               @id @default(autoincrement())
  referenceId  String            @unique @default(uuid()) @map("reference_id")
  documentType LegalDocumentType
  countryId    Int?              @map("country_id") // null = versión internacional/paraguas (base GDPR-like)
  version      String            @db.VarChar(20)
  contentUrl   String            @db.VarChar(500)
  publishedAt  DateTime          @map("published_at")
  isActive     Boolean           @default(true) @map("is_active")

  country  Country?        @relation(fields: [countryId], references: [id])
  consents UserConsents[]

  createdAt     DateTime  @default(now()) @map("created_at")
  createdBy     String?   @map("created_by")
  lastChangedAt DateTime? @default(now()) @map("last_changed_at")
  lastChangedBy String?   @map("last_changed_by")
  changedReason String?   @map("changed_reason")

  @@map("legal_document_versions")
  @@index([documentType, countryId, isActive])
}

model UserConsents {
  id                    Int      @id @default(autoincrement())
  referenceId           String   @unique @default(uuid()) @map("reference_id")
  userId                Int      @map("user_id")
  legalDocumentVersionId Int     @map("legal_document_version_id")
  acceptedAt            DateTime @default(now()) @map("accepted_at")
  ipAddress             String?  @db.VarChar(45) @map("ip_address")
  userAgent             String?  @db.VarChar(255) @map("user_agent")
  acceptanceHash        String   @db.VarChar(128) @map("acceptance_hash")

  user                 Users                 @relation(fields: [userId], references: [id])
  legalDocumentVersion LegalDocumentVersions @relation(fields: [legalDocumentVersionId], references: [id])

  @@map("user_consents")
  @@unique([userId, legalDocumentVersionId])
}

/// Consentimiento de USO por contenido puntual — más fino que la aceptación general de ToS.
model ContentConsentGrants {
  id                Int                     @id @default(autoincrement())
  referenceId       String                  @unique @default(uuid()) @map("reference_id")
  contentType       AiDisclosureEntityType  // reutiliza el mismo enum de ai-content-disclosure.md
  contentReferenceId String                 @map("content_reference_id")
  uploaderUserId    Int                     @map("uploader_user_id")
  usageScope        ContentUsageScope       @default(APP_INTERNAL_ONLY)
  grantedAt         DateTime                @default(now()) @map("granted_at")
  revokedAt         DateTime?               @map("revoked_at")

  uploader Users @relation(fields: [uploaderUserId], references: [id])

  @@map("content_consent_grants")
  @@index([contentType, contentReferenceId])
}

/// Cuánto tiempo se retiene cada tipo de contenido y si el usuario puede pedir su baja.
model DataRetentionPolicies {
  id                    Int                    @id @default(autoincrement())
  referenceId           String                 @unique @default(uuid()) @map("reference_id")
  countryId             Int?                   @map("country_id")
  contentType           AiDisclosureEntityType
  retentionDays         Int?                   @map("retention_days")
  allowsUserDeletion    Boolean                @default(true) @map("allows_user_deletion")
  requiresLegalHold     Boolean                @default(false) @map("requires_legal_hold")

  country Country? @relation(fields: [countryId], references: [id])

  @@map("data_retention_policies")
  @@unique([countryId, contentType])
}
```

## Qué es parametrizable/configurable

- **Todo el marco legal por país** vive en `LegalDocumentVersions`/`DataRetentionPolicies` —
  agregar un país nuevo (o cambiar una política) es insertar/editar filas vía el backoffice de
  staff, nunca un deploy de código.
- **Alcance de uso por contenido** (`ContentUsageScope`) es elegido por el uploader al subir.
- **Retención y posibilidad de baja** (`DataRetentionPolicies`) son configurables por
  país+tipo de contenido.

## Endpoints (contrato)

`src/api/legal-consents/` + `src/modules/legal-consents-db/`.

| Método | Ruta | Quién | Descripción |
|---|---|---|---|
| GET | `/legal/consents/pending` | usuario autenticado | Documentos activos (por su país) que todavía no aceptó |
| POST | `/legal/consents/:versionReferenceId/accept` | usuario autenticado | Crea `UserConsents` con hash/IP/user-agent server-side |
| GET | `/users/me/data-consents` | usuario autenticado | Historial propio de aceptaciones + grants de contenido |
| DELETE | `/users/me/content/:contentReferenceId/consent` | uploader dueño | Revoca; dispara ocultamiento si `allowsUserDeletion=true`; 409 `LEGAL_HOLD_ACTIVE` si `requiresLegalHold=true` |
| GET/POST/PATCH | `/admin/legal/document-versions` | staff | CRUD del catálogo versionado |
| GET/PATCH | `/admin/legal/retention-policies` | staff | CRUD de políticas de retención |
| GET | `/admin/legal/consents` | staff | Auditoría completa (quién aceptó qué, cuándo, IP) |

**Guard reusable**: `RequiresActiveConsentGuard(documentType)` — se aplica a los controllers de
`professional-documents.md` (subida de documentos), `work-progress-log.md` (subida de fotos de
avance), y a `uploads.controller.ts` (avatar/portafolio) para bloquear la subida con
`403 CONSENT_REQUIRED` si el usuario no tiene un `UserConsents` vigente para el `documentType`
correspondiente a su país. Se aplica como decorator + guard en `common/`, no como chequeo inline
repetido en cada servicio.

## Casos de error

- `403 CONSENT_REQUIRED` — cualquier subida sin consentimiento vigente.
- `409 LEGAL_HOLD_ACTIVE` — intento de revocar consentimiento sobre contenido con retención legal
  obligatoria.

## Relaciones con otras features

Todas las features que suben contenido (`professional-documents.md`, `work-progress-log.md`, y
potencialmente `multi-option-quotes.md`) dependen de esta para el guard de consentimiento. Extiende,
no reemplaza, el ítem 4 del backlog 2026-08-08 (marco legal/tributario) — el protocolo de
IVA/impuestos de ese ítem es una extensión aparte que no comparte tablas con esta (salvo `Country`
como ancla de "por país").

## Riesgos / límites explícitos

- **No soy asesor legal ni impositivo** — esta spec modela el flujo técnico de consentimiento
  (captura, versionado, auditoría, revocación), pero el contenido real de cada
  `LegalDocumentVersions.contentUrl` debe venir de asesoría legal real por país antes de que esta
  feature sea usable en producción.
- La revocación de consentimiento oculta el contenido a nivel de aplicación pero no garantiza
  borrado físico inmediato de backups/réplicas — documentar esta limitación de forma explícita en
  cualquier texto de cara al usuario que prometa "eliminar tus datos".
- Fotos de avance o de servicios pueden incluir a terceros que no son usuarios de la plataforma y
  no pueden dar consentimiento vía este flujo — riesgo legal real no resuelto por este modelo,
  señalar como limitación conocida para la asesoría legal.
