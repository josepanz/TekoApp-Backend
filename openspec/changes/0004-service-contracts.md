# Fase 0004 — Contratos generados desde el presupuesto aceptado

**Implementada 2026-08-28** — ver `openspec/decisions.md`, "Fase 0004", para las decisiones
tomadas al implementar (copy legal placeholder+TODO, `pdfmake` vía `ReportModule` en vez de
Chromium, limitación de país heredada en `legalTermsVersionId`, endpoint `GET /contracts` agregado
que no estaba en la spec original).

**Depende de la Fase 0003 (`multi-option-quotes`)** — implementada.

## Objetivo

Implementar el modelo y los endpoints de `openspec/specs/service-contracts.md`.

## Tareas

- [x] Migración Prisma: `Contracts`, enum `ContractStatus`.
- [x] `src/api/contracts/` + `src/modules/contracts-db/` — generar, obtener, firmar, PDF, listado
      propio, listado admin.
- [x] Armado del `contentSnapshot` server-side a partir de `BudgetOptions`+`BudgetLineItems`
      seleccionadas (nunca releer esas tablas después de creado el contrato).
- [x] Resolución de `legalTermsVersionId` — ver limitación de país heredada en `decisions.md`
      (siempre `countryId: null`, mismo criterio que `data-and-media-consent`).
- [x] Generación de PDF al completar ambas firmas — `pdfmake` vía `ReportModule` (ver
      `openspec/decisions.md`).
- [x] Transiciones de estado vía `updateMany` condicional (TOCTOU-safe).
- [x] Tests unitarios (firma en orden correcto, 409 firma duplicada/fuera de turno, generación de
      PDF solo tras `SIGNED`) — 21 tests nuevos.
- [x] `pnpm run format` + `pnpm run lint --fix` en 0 warnings.

## Checkpoint de salida

- [x] Flujo completo cubierto por tests unitarios/mocks: seleccionar presupuesto → generar
      contrato → cliente firma → profesional firma → PDF disponible para ambos vía URL
      presignada. Sin verificación manual contra el backend real corriendo con datos reales.
- [x] Firmar dos veces o fuera de turno devuelve el `409` esperado, no un error genérico.
- [ ] Checkpoint de negocio real (profesional/cliente reales firmando un contrato end-to-end) — a
      cargo de José, mismo criterio que checkpoints de fases anteriores.
