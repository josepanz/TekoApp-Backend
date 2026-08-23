# Spec: Disclosure de contenido generado por IA

Ver también: `TekoApp-Frontend-Mobile/openspec/specs/ai-content-disclosure.md` (mobile),
`TekoApp-Frontend-Web/openspec/specs/ai-content-disclosure-admin.md` (auditoría de staff),
`TekoApp-Frontend-Mobile/openspec/decisions.md` — backlog 2026-08-22 ítem 10.

## Objetivo

Establecer, de forma genérica y escalable a nuevos tipos de contenido, el mecanismo para marcar
explícitamente texto/imágenes/presupuestos como asistidos por IA — tanto los que en el futuro
genere la propia plataforma como los que un usuario declare voluntariamente como asistidos por IA.

**Importante — esto NO introduce generación de IA real.** Hoy la plataforma no integra ningún
proveedor de IA generativa en ningún flujo de producto. Esta spec construye el esqueleto de
disclosure para que, el día que se agregue una feature de IA generativa (de plataforma) o que un
usuario declare contenido asistido, el disclosure exista desde el día uno.

## Alcance

**Incluye**: tabla genérica de disclosure aplicable a cualquier tipo de contenido existente o
futuro (polimórfica por `entityType` + `entityReferenceId`), endpoint de auto-declaración para
contenido subido por un usuario, helper de backend para que cualquier feature futura de IA de
plataforma registre su propio disclosure al generar contenido, exposición del flag en los DTOs de
respuesta relevantes.

**No incluye**: ninguna integración con un proveedor de IA. No incluye detección automática de
contenido generado por IA — el disclosure siempre es una declaración explícita, nunca inferida.

## Modelo de dominio (Prisma)

```prisma
enum AiDisclosureEntityType {
  SERVICE_DESCRIPTION
  BUDGET_OPTION
  PROGRESS_NOTE
  PROFESSIONAL_DESCRIPTION
  IMAGE
  OTHER // catch-all extensible sin migración para tipos de contenido que todavía no existen
}

enum AiDisclosureSource {
  PLATFORM_AI      // generado por una feature de IA de la propia plataforma
  USER_DECLARED_AI // el usuario marcó voluntariamente su contenido como asistido por IA
}

/// Tabla polimórfica deliberada — entityReferenceId no es una FK real de Postgres (apunta al
/// referenceId de cualquier tabla futura), para no requerir una migración por cada tipo de
/// contenido nuevo que empiece a soportar disclosure. Ver `openspec/decisions.md`.
model AiContentDisclosures {
  id               Int                     @id @default(autoincrement())
  referenceId      String                  @unique @default(uuid()) @map("reference_id")
  entityType       AiDisclosureEntityType
  entityReferenceId String                 @map("entity_reference_id")
  source           AiDisclosureSource
  aiProvider       String?                 @db.VarChar(60) @map("ai_provider")
  declaredByUserId Int?                    @map("declared_by_user_id")
  note             String?                 @db.Text

  createdAt DateTime @default(now()) @map("created_at")
  createdBy String?  @map("created_by")

  @@map("ai_content_disclosures")
  @@unique([entityType, entityReferenceId])
}
```

## Qué es parametrizable/configurable

- **`AiDisclosureEntityType`** es un enum abierto con un valor `OTHER` explícito — agregar un tipo
  de contenido nuevo requiere un `ALTER TYPE ... ADD VALUE`, no una tabla nueva.
- **Textos de disclosure visibles** viven en el catálogo `i18n` (`nestjs-i18n`), parametrizable por
  idioma sin tocar código de negocio.
- **Qué tipos de contenido permiten auto-declaración de usuario**: lista en `core/config`
  (`APP_CONFIG.aiDisclosure.userDeclarableTypes`) — agregar un tipo nuevo a la lista es config, no
  código.

## Endpoints (contrato)

`src/api/ai-disclosures/` + `src/modules/ai-disclosures-db/`.

| Método | Ruta | Quién | Descripción |
|---|---|---|---|
| PUT | `/ai-disclosures` | usuario dueño del contenido | `DeclareAiDisclosureRequestDTO { entityType, entityReferenceId, note? }` |
| DELETE | `/ai-disclosures/:entityType/:entityReferenceId` | usuario dueño | Retira su propia auto-declaración |
| GET | `/ai-disclosures/:entityType/:entityReferenceId` | cualquiera con acceso al contenido | Devuelve el disclosure si existe, `null` si no |
| GET | `/admin/ai-disclosures` | staff | Listado agregado paginado, para el panel de auditoría de Web |

Helper de backend (`AiDisclosureHelper.registerPlatformDisclosure(entityType, entityReferenceId,
aiProvider)`) para que una feature de IA de plataforma futura llame esto al generar contenido, en
la misma transacción de creación de la entidad.

## Casos de error

- `403` si el usuario no es dueño de la entidad referenciada al declarar/retirar.
- `400` si `entityType` no está en `userDeclarableTypes` para auto-declaración.

## Fuera de alcance de esta spec

Cualquier feature de IA generativa real de plataforma.

## Riesgos / límites explícitos

- El disclosure depende de la buena fe de la declaración del usuario — no hay verificación técnica
  de que un contenido "no declarado" sea realmente humano.
- Si en el futuro se agrega una feature real de IA de plataforma, esta spec no decide todavía qué
  proveedor usar ni bajo qué condiciones.
