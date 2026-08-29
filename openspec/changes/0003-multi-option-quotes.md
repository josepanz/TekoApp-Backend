# Fase 0003 — Presupuestos multi-opción generados desde la app

## Antes de empezar

Leer `openspec/specs/multi-option-quotes.md` completo. Releer la lógica real de auto-rechazo de
`ServiceRequests` competidoras (`services.service.ts`) antes de replicarla para `select` — no
asumir el comportamiento sin verificarlo contra el código actual.

## Objetivo

Implementar el modelo y los endpoints de `openspec/specs/multi-option-quotes.md`.

## Tareas

- [x] Migración Prisma: `MaterialCatalog`, `BudgetOptions`, `BudgetLineItems`, enums
      `MaterialQualityTier`/`BudgetLineItemType`, campo `Category.maxBudgetOptionsPerRequest`.
      Aplicada contra la DB real (2026-08-28, migración `20260828012202_add_multi_option_quotes`).
      `BudgetOptions` califica para `fn_attach_audit_triggers()` (datos financieros reales, mismo
      criterio que `ServiceRequests`/`Payments`); `MaterialCatalog`/`BudgetLineItems` quedan afuera
      a propósito (catálogo de configuración / detalle inmutable sin `created_by`).
- [x] `src/api/material-catalog/` + `src/modules/material-catalog-db/` — GET filtrable
      (categoryId/countryId/qualityTier/isActive, columnas directas → `PrismaPaginationUtil` las
      mapea automático) + POST/PATCH staff. **Sin DELETE** (desviación de la spec original, que
      decía "POST/PATCH/DELETE"): un hard delete podría romper la FK de `BudgetLineItems.
      catalogItemId` en presupuestos históricos — se usa el mismo patrón que
      `ProfessionalDocumentTypes` (desactivar via `PATCH isActive: false`, nunca borrar).
- [x] `src/api/budgets/` + `src/modules/budgets-db/` — `PUT`/`GET` de opciones,
      `PATCH .../select`. `PUT` reemplaza el set completo SOLO mientras la `ServiceRequests` sigue
      `PENDING` (simplificación sobre la redacción original "borra las anteriores no
      seleccionadas": mientras está PENDING nunca hay una opción ya seleccionada que preservar, así
      que el comportamiento es equivalente pero el código es más simple — borra todas, crea las
      nuevas). Los line items referencian el catálogo por `catalogItemReferenceId` (UUID) en el
      body, nunca el id interno — se resuelve server-side antes de escribir.
- [x] Validación server-side de `totalPrice`/`subtotal` (recalculado siempre desde
      `quantity * unitPrice`, nunca el valor que manda el cliente) y de
      `count <= category.maxBudgetOptionsPerRequest`.
- [x] `select` extiende la transacción existente de aceptación de `ServiceRequests`
      (`BudgetsDbService.selectOptionTransaction` — mismos 3 pasos de
      `acceptRequestTransaction` + marcar la opción elegida, todo en un solo `$transaction`).
- [x] Decidido con José (confirmado explícitamente antes de implementar): `Service.finalAmount`
      gana una rama nueva en `completeService()` — si el servicio no tiene tarifa por hora, se
      alimenta de la `BudgetOptions.totalPrice` seleccionada, mismo campo y mismo momento
      (completar el servicio) que la rama de tarifa por hora. `finalAmount` sigue siendo la única
      fuente de verdad; el flujo de pago (`createPayment`, `dto.amount` provisto por el cliente) no
      se tocó — queda fuera de alcance de esta decisión.
- [x] Tests unitarios: 27 tests nuevos (`material-catalog-db`: 6, `material-catalog` api: 6,
      `budgets-db`: 6, `budgets` api: 9) + 2 tests nuevos en `services.service.spec.ts` para la
      rama de `finalAmount`. Cubren recalculo de totales, límite de opciones excedido, ítem de
      catálogo inexistente, 403/400 de autorización, 409 en selección concurrente.
- [x] `pnpm run build`, `pnpm run lint`, `pnpm run test` en 0 errores/warnings (100 suites, 1188
      tests) + boot real contra la DB confirmando que las 5 rutas nuevas se registran y responden
      `401` sin token a través de todo el pipeline (no solo compilación).

## Checkpoint de salida

- [ ] Un profesional envía 2+ opciones de presupuesto con materiales del catálogo real.
- [ ] El cliente selecciona una; las `ServiceRequests` competidoras quedan auto-rechazadas
      (verificado contra la DB real, no solo el mock de test).
- [ ] El total devuelto por el backend nunca coincide "por casualidad" con un cálculo hecho
      solamente client-side — se verificó que el backend recalcula siempre.
- Los 3 ítems de arriba requieren un profesional/cliente reales armando y aceptando un presupuesto
  end-to-end (Mobile + backend corriendo juntos) — pendiente del mismo tipo que los checkpoints de
  negocio de fases anteriores, a cargo de José.
