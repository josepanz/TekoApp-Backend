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
| POST | `/services/:referenceId/progress` | profesional asignado | multipart, `CreateServiceProgressEntryRequestDTO { note?, images[] }` — 409 si el `Service` no está `ACCEPTED`/`IN_PROGRESS` o si el profesional no es el asignado |
| GET | `/services/:referenceId/progress` | cliente dueño, profesional asignado | Listado ordenado por `entryOrder` |
| DELETE | `/services/:referenceId/progress/:entryReferenceId` | profesional autor | Soft-delete (`isActive:false`) solo dentro de `editWindowMinutes` desde `createdAt` |

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
- **Decisión de alcance abierta para José**: si el staff de `TekoApp-Frontend-Web` debe poder ver
  la bitácora de un servicio para resolver disputas (mismo criterio de "admins ven todo" ya
  aplicado a calificaciones, backlog 2026-08-08 ítem 3). Se puede resolver más barato agregando una
  pestaña a la vista de detalle de servicio que ya existe en `TekoApp-Frontend-Web`
  (`src/app/admin/services`) reusando el mismo GET, sin necesitar una spec de Web nueva. Por eso
  esta feature no tiene una spec dedicada de Web en `TekoApp-Frontend-Web/openspec/specs/` —
  confirmar con José si eso alcanza antes de implementar.
