# Spec: Presupuestos multi-opción generados desde la app

Ver también: `TekoApp-Frontend-Mobile/openspec/specs/multi-option-quotes.md` (mobile),
`TekoApp-Frontend-Web/openspec/specs/material-catalog.md` (catálogo de materiales),
`TekoApp-Frontend-Mobile/openspec/decisions.md` — backlog 2026-08-22 ítem 8. Depende de
`ServiceRequests` (ya existe, ver `TekoApp-Frontend-Mobile/openspec/decisions.md` — "Aceptación de
servicio").

## Objetivo

Antes de que el cliente elija profesional, cada `ServiceRequests` (propuesta de un profesional
sobre un `Service` `PENDING`) puede tener una o varias **opciones de presupuesto** alternativas
(materiales, calidad, mano de obra, precio) en vez de un único `proposedPrice` fijo como hoy.

## Alcance

**Incluye**: múltiples opciones de presupuesto por propuesta, ítems de línea (materiales/mano de
obra) con catálogo parametrizable por categoría/país, selección de una opción por el cliente
(dispara la misma lógica transaccional de aceptación/auto-rechazo de competidoras ya existente),
límite configurable de opciones por propuesta.

**No incluye**: negociación iterativa de una opción ya enviada (contraoferta). No incluye el
contrato en sí (ver `service-contracts.md`, que consume la opción seleccionada).

## Modelo de dominio (Prisma)

```prisma
enum MaterialQualityTier {
  BASIC
  STANDARD
  PREMIUM
}

enum BudgetLineItemType {
  MATERIAL
  LABOR
  OTHER
}

/// Catálogo parametrizable de materiales/calidades por categoría de servicio y país.
model MaterialCatalog {
  id           Int                 @id @default(autoincrement())
  referenceId  String              @unique @default(uuid()) @map("reference_id")
  categoryId   Int                 @map("category_id")
  countryId    Int?                @map("country_id") // null = aplica a todos los países
  name         String              @db.VarChar(150)
  unit         String              @db.VarChar(30) // "m2", "unidad", "hora", etc.
  qualityTier  MaterialQualityTier
  defaultPrice Decimal             @db.Decimal(10, 2) @map("default_price")
  isActive     Boolean             @default(true) @map("is_active")

  category Category @relation(fields: [categoryId], references: [id])
  country  Country? @relation(fields: [countryId], references: [id])

  createdAt     DateTime  @default(now()) @map("created_at")
  createdBy     String?   @map("created_by")
  lastChangedAt DateTime? @default(now()) @map("last_changed_at")
  lastChangedBy String?   @map("last_changed_by")
  changedReason String?   @map("changed_reason")

  @@map("material_catalog")
}

model BudgetOptions {
  id              Int      @id @default(autoincrement())
  referenceId     String   @unique @default(uuid()) @map("reference_id")
  serviceRequestId Int     @map("service_request_id")
  label           String   @db.VarChar(100) // "Económica" / "Estándar" / "Premium" / libre
  description     String?  @db.Text
  totalPrice      Decimal  @db.Decimal(10, 2) @map("total_price") // suma de line items, recalculada server-side
  estimatedHours  Decimal? @db.Decimal(10, 2) @map("estimated_hours")
  isSelected      Boolean  @default(false) @map("is_selected")

  serviceRequest ServiceRequests    @relation(fields: [serviceRequestId], references: [id], onDelete: Cascade)
  lineItems      BudgetLineItems[]

  createdAt     DateTime  @default(now()) @map("created_at")
  createdBy     String?   @map("created_by")
  lastChangedAt DateTime? @default(now()) @map("last_changed_at")
  lastChangedBy String?   @map("last_changed_by")
  changedReason String?   @map("changed_reason")
  isActive      Boolean   @default(true) @map("is_active")

  @@map("budget_options")
  @@index([serviceRequestId])
}

model BudgetLineItems {
  id              Int                @id @default(autoincrement())
  referenceId     String             @unique @default(uuid()) @map("reference_id")
  budgetOptionId  Int                @map("budget_option_id")
  itemType        BudgetLineItemType
  catalogItemId   Int?               @map("catalog_item_id") // FK a MaterialCatalog, null si es ítem libre
  description     String             @db.VarChar(255)
  quantity        Decimal            @db.Decimal(10, 2)
  unitPrice       Decimal            @db.Decimal(10, 2) @map("unit_price")
  subtotal        Decimal            @db.Decimal(10, 2) // quantity * unitPrice, validado server-side

  budgetOption BudgetOptions    @relation(fields: [budgetOptionId], references: [id], onDelete: Cascade)
  catalogItem  MaterialCatalog? @relation(fields: [catalogItemId], references: [id])

  @@map("budget_line_items")
}
```

`Category` gana un campo de configuración adicional: `maxBudgetOptionsPerRequest Int @default(3)`.

## Qué es parametrizable/configurable

- **`MaterialCatalog`**: catálogo editable sin deploy por staff, scoped por
  `categoryId`+`countryId` (país nulo = catálogo genérico).
- **`Category.maxBudgetOptionsPerRequest`**: cuántas opciones puede armar un profesional por
  propuesta, configurable por categoría.
- **`label`** es texto libre (no un enum cerrado); **`lineItems`** es una lista abierta, cualquier
  combinación de materiales de catálogo + ítems libres (`catalogItemId: null`).

## Endpoints (contrato)

`src/api/budgets/` + `src/modules/budgets-db/`, más `src/api/material-catalog/` +
`src/modules/material-catalog-db/`.

| Método | Ruta | Quién | Descripción |
|---|---|---|---|
| GET | `/material-catalog` | cualquier usuario autenticado | Filtrable por `categoryId`/`countryId`/`qualityTier`/`isActive`, `PrismaPaginationUtil`. Mismo endpoint lo consume el profesional armando un presupuesto y la tabla admin de Web. |
| POST/PATCH | `/admin/material-catalog` | staff | Alta/edición del catálogo. **Sin DELETE** (implementado): un hard delete rompería la FK de `BudgetLineItems.catalogItemId` en presupuestos históricos — se desactiva con `PATCH isActive: false`, mismo patrón que `ProfessionalDocumentTypes`. |
| PUT | `/services/:referenceId/requests/:requestId/budget-options` | profesional autor de la propuesta | Reemplaza el set completo de opciones (array), transacción: borra las anteriores no seleccionadas + crea las nuevas, valida `count <= category.maxBudgetOptionsPerRequest`, recalcula `totalPrice`/`subtotal` server-side |
| GET | `/services/:referenceId/requests/:requestId/budget-options` | cliente, profesional autor | Listado con line items |
| PATCH | `/services/:referenceId/requests/:requestId/budget-options/:optionReferenceId/select` | cliente dueño del `Service` | Transacción: marca `isSelected=true` en la opción elegida, `false` en las demás de la misma propuesta, y reutiliza la lógica existente de auto-rechazo de `ServiceRequests` competidoras |

## Casos de error

- `400` si `count(budgetOptions) > category.maxBudgetOptionsPerRequest`.
- `409` en `select` con `updateMany` condicional (`WHERE isSelected = false`) — nunca `findUnique` +
  `update` plano.

## Fuera de alcance de esta spec

El contrato generado a partir de la opción seleccionada (ver `service-contracts.md`).

## Riesgos / límites explícitos

- El precio final (`Service.finalAmount`) debe pasar a alimentarse de `BudgetOptions.totalPrice`
  de la opción seleccionada cuando esta feature esté activa para un `Service` — coordinar con el
  flujo de pago existente para no duplicar la fuente de verdad del monto.
