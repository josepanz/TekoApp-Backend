# Fase 0003 — Presupuestos multi-opción generados desde la app

## Antes de empezar

Leer `openspec/specs/multi-option-quotes.md` completo. Releer la lógica real de auto-rechazo de
`ServiceRequests` competidoras (`services.service.ts`) antes de replicarla para `select` — no
asumir el comportamiento sin verificarlo contra el código actual.

## Objetivo

Implementar el modelo y los endpoints de `openspec/specs/multi-option-quotes.md`.

## Tareas

- [ ] Migración Prisma: `MaterialCatalog`, `BudgetOptions`, `BudgetLineItems`, enums
      `MaterialQualityTier`/`BudgetLineItemType`, campo `Category.maxBudgetOptionsPerRequest`.
- [ ] `src/api/material-catalog/` + `src/modules/material-catalog-db/` — CRUD staff + GET
      filtrable con `PrismaPaginationUtil`.
- [ ] `src/api/budgets/` + `src/modules/budgets-db/` — `PUT`/`GET` de opciones, `PATCH .../select`.
- [ ] Validación server-side de `totalPrice`/`subtotal` (nunca confiar en lo que manda el cliente)
      y de `count <= category.maxBudgetOptionsPerRequest`.
- [ ] `select` reutiliza/extiende la transacción existente de aceptación de `ServiceRequests`.
- [ ] Decidir y documentar en `openspec/decisions.md` cómo `Service.finalAmount` se relaciona con
      `BudgetOptions.totalPrice` de la opción seleccionada (ver riesgo señalado en la spec) antes
      de tocar el flujo de pago existente.
- [ ] Tests unitarios (recalculo de totales, límite de opciones, 409 en selección concurrente).
- [ ] `pnpm run format` + `pnpm run lint --fix` en 0 warnings.

## Checkpoint de salida

- [ ] Un profesional envía 2+ opciones de presupuesto con materiales del catálogo real.
- [ ] El cliente selecciona una; las `ServiceRequests` competidoras quedan auto-rechazadas
      (verificado contra la DB real, no solo el mock de test).
- [ ] El total devuelto por el backend nunca coincide "por casualidad" con un cálculo hecho
      solamente client-side — se verificó que el backend recalcula siempre.
