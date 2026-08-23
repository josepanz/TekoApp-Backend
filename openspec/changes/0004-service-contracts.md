# Fase 0004 — Contratos generados desde el presupuesto aceptado

**Depende de la Fase 0003 (`multi-option-quotes`)** — no arrancar esta sin esa implementada.

## Antes de empezar

Leer `openspec/specs/service-contracts.md` completo, en particular "Riesgos / límites explícitos"
(no es firma digital calificada) — coordinar con José el copy exacto que mobile/web van a mostrar
antes de cerrar esta fase, no asumir la redacción de la spec como texto final de cara al usuario.

## Objetivo

Implementar el modelo y los endpoints de `openspec/specs/service-contracts.md`.

## Tareas

- [ ] Migración Prisma: `Contracts`, enum `ContractStatus`.
- [ ] `src/api/contracts/` + `src/modules/contracts-db/` — generar, obtener, firmar, PDF, listado
      admin.
- [ ] Armado del `contentSnapshot` server-side a partir de `BudgetOptions`+`BudgetLineItems`
      seleccionadas (nunca releer esas tablas después de creado el contrato).
- [ ] Resolución de `legalTermsVersionId` según el país del `Service` (depende de que
      `data-and-media-consent` tenga al menos `LegalDocumentVersions` migrado — coordinar orden).
- [ ] Generación de PDF al completar ambas firmas (evaluar librería, documentar en
      `openspec/decisions.md`).
- [ ] Transiciones de estado vía `updateMany` condicional (TOCTOU-safe).
- [ ] Tests unitarios (firma en orden correcto, 409 firma duplicada/fuera de turno, generación de
      PDF solo tras `SIGNED`).
- [ ] `pnpm run format` + `pnpm run lint --fix` en 0 warnings.

## Checkpoint de salida

- [ ] Flujo completo: seleccionar presupuesto → generar contrato → cliente firma → profesional
      firma → PDF disponible para ambos vía URL presignada.
- [ ] Firmar dos veces o fuera de turno devuelve el `409` esperado, no un error genérico.
