# Spec: Bitácora de trabajo ("paso a paso")

Ver también: `TekoApp-Frontend-Mobile/openspec/specs/work-progress-log.md` (mobile),
`TekoApp-Frontend-Mobile/openspec/decisions.md` — backlog 2026-08-22 ítem 7.

## Objetivo

El profesional documenta el avance de un `Service` en curso (fotos + notas) en una línea de tiempo
ordenada, visible para el cliente dueño del servicio — transparencia/trazabilidad del trabajo, no
solo el estado final.

## Alcance

**Incluye**: entradas de bitácora (nota + hasta N fotos) creadas por el profesional asignado
mientras el `Service` está `ACCEPTED`/`IN_PROGRESS`, listado cronológico visible para cliente y
profesional, ventana corta de corrección de una entrada recién creada.

**No incluye**: edición libre sin límite de tiempo, comentarios del cliente sobre una entrada
puntual, geolocalización de cada entrada.

## Modelo de dominio (Prisma)

```prisma
model ServiceProgressEntries {
  id             Int      @id @default(autoincrement())
  referenceId    String   @unique @default(uuid()) @map("reference_id")
  serviceId      Int      @map("service_id")
  professionalId Int      @map("professional_id")
  note           String?  @db.Text
  images         String[] @default([]) // S3 keys, mismo patrón que Services.images
  entryOrder     Int      @map("entry_order") // secuencia dentro del service, para ordenar sin depender solo de createdAt

  service      Services      @relation(fields: [serviceId], references: [id], onDelete: Cascade)
  professional Professionals @relation(fields: [professionalId], references: [id], onDelete: Cascade)

  createdAt     DateTime  @default(now()) @map("created_at")
  createdBy     String?   @map("created_by")
  lastChangedAt DateTime? @default(now()) @map("last_changed_at")
  lastChangedBy String?   @map("last_changed_by")
  changedReason String?   @map("changed_reason")
  isActive      Boolean   @default(true) @map("is_active") // "borrado" = isActive:false dentro de la ventana de corrección

  @@map("service_progress_entries")
  @@index([serviceId, entryOrder])
}
```

Extensión de `Category` (ya tiene `requiresVerification Boolean` — mismo espíritu):

```prisma
model Category {
  // ...campos existentes...
  requiresProgressLog Boolean @default(false) @map("requires_progress_log")
}
```

## Qué es parametrizable/configurable

- **`Category.requiresProgressLog`**: algunas categorías de servicio (ej. remodelaciones largas)
  pueden exigir al menos una entrada antes de poder marcar `completeService`; otras (servicios
  cortos) la dejan opcional.
- **Máximo de imágenes por entrada** y **ventana de corrección** (minutos): en `core/config`
  (JOI-validado, `APP_CONFIG.progressLog.maxImagesPerEntry` / `.editWindowMinutes`), no
  hardcodeados en el servicio.
- **Si una entrada requiere nota, solo fotos, o cualquiera**: config global simple por ahora
  (`requireNoteOrImage: boolean`) — no se parametriza por categoría en esta primera versión.

## Endpoints (contrato)

`src/api/service-progress/` + `src/modules/service-progress-db/`.

| Método | Ruta | Quién | Descripción |
|---|---|---|---|
| POST | `/services/:id/progress` | profesional asignado | JSON (no multipart — corregido tras implementar, ver nota abajo), `CreateServiceProgressEntryRequestDTO { note?, images?: string[] }` — 409 si el `Service` no está `ACCEPTED`/`IN_PROGRESS`, 403 si el profesional no es el asignado |
| GET | `/services/:id/progress` | cliente dueño, profesional asignado, o staff con permiso `service-progress.audit:read`/`admin:all` | Listado ordenado por `entryOrder` |
| DELETE | `/services/:id/progress/:entryId` | profesional autor | Soft-delete (`isActive:false`) solo dentro de `editWindowMinutes` desde `createdAt` |

**Corrección tras implementar (2026-08-27)**: la spec original decía "multipart" para el POST — se
verificó contra el código real (`uploads.controller.ts`) y el patrón ya establecido en este backend
para CUALQUIER dominio con imágenes (`Services.images`, etc.) es: las fotos se suben antes, una por
una, vía `POST /uploads/image` (ya existente, devuelve la key de S3), y el endpoint de dominio solo
recibe el array de keys ya subidas en el body JSON — nunca multipart directo en el endpoint de
creación de la entidad de negocio. Se implementó así, no como decía la spec original.

**Consentimiento de imagen — condicional, no un guard estático**: `RequiresActiveConsentGuard` (el
guard reusable) es un decorator estático por ruta, sin acceso al body — no puede distinguir "esta
llamada trae fotos" de "esta llamada es solo texto". Como el endpoint acepta `note` sin `images`,
aplicar el guard a TODA la ruta bloquearía también las entradas solo-texto. Se implementó el mismo
chequeo (`LegalConsentsDbService.hasActiveConsent(userId, IMAGE_USAGE_CONSENT)`, mismo 403
`CONSENT_REQUIRED`) inline en `ServiceProgressService.createEntry`, condicionado a
`images.length > 0` — no como guard.

`completeService` (ya existente en `services.service.ts`) se extiende: si
`category.requiresProgressLog` y no existe ninguna `ServiceProgressEntries` activa para el
`serviceId`, rechazar con `BadRequestException(PROGRESS_LOG_REQUIRED)` antes del `updateMany`
condicional de estado.

## Casos de error

- `409 EDIT_WINDOW_EXPIRED` — al intentar borrar pasada la ventana de corrección.
- `400 PROGRESS_LOG_REQUIRED` — al intentar completar un servicio de categoría que lo exige sin
  ninguna entrada activa.
- `403 CONSENT_REQUIRED` — mismo guard de `data-and-media-consent.md` para las fotos subidas.

## Fuera de alcance de esta spec

Reusar una foto de bitácora como evidencia de portafolio (`professional-documents.md`) requeriría
opt-in explícito del profesional — no implementado acá.

## Riesgos / límites explícitos

- Pasada la ventana de corrección, una entrada es inmutable — es intencional (integridad de
  registro, potencial evidencia ante disputas).
- **Decisión de alcance — confirmada con José (2026-08-27)**: sí, el staff de `TekoApp-Frontend-Web`
  puede ver la bitácora de un servicio (para resolver disputas, mismo criterio de "admins ven
  todo" ya aplicado a calificaciones, backlog 2026-08-08 ítem 3). El `GET
  /services/:referenceId/progress` de arriba debe autorizar tanto a los 2 participantes (cliente
  dueño, profesional asignado) COMO al rol admin/staff — no queda restringido a los participantes.
  Se resuelve agregando una pestaña a la vista de detalle de servicio que ya existe en
  `TekoApp-Frontend-Web` (`src/app/admin/services`), reusando este mismo GET — no hace falta una
  spec de Web dedicada para esto.
