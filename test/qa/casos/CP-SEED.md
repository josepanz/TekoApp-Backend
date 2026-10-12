# CP-SEED — Rol COMPLIANCE en el seed (Backend)

El rol lo siembra `prisma/seed.ts`; `prisma/seed-e2e.ts` lo reutiliza (commit 7b9ce8f) y crea el usuario fixture.

### CP-BE-SEED-001 — Siembra el rol COMPLIANCE con sus permisos de auditoría legal

| Campo | Contenido |
|---|---|
| ID | CP-BE-SEED-001 |
| Título | Siembra el rol COMPLIANCE con sus permisos de auditoría legal |
| Tipo / Nivel | funcional · manual (consulta SQL) |
| Prioridad | P1 |
| Trazabilidad | M0 del plan maestro: "Seed con roles incluido compliance"; M9 Cumplimiento |
| Precondiciones | Stack arriba y sembrado (`pnpm e2e:up`). |
| Pasos | 1. `SELECT name FROM roles WHERE name='COMPLIANCE';`<br>2. Listar los permisos del rol (join de roles y permisos). |
| Datos de prueba | Rol `COMPLIANCE` |
| Resultado esperado | Una fila de rol y los permisos `legal.config:manage` y `legal.consent-audit:read` asociados. |
| Automatizado en | No automatizado (verificación manual). Código: `prisma/seed.ts` (upsert de COMPLIANCE) y `prisma/seed-e2e.ts` (`findUniqueOrThrow` del rol). |

### CP-BE-SEED-002 — Asigna el rol COMPLIANCE al usuario fixture compliance de forma idempotente

| Campo | Contenido |
|---|---|
| ID | CP-BE-SEED-002 |
| Título | Asigna el rol COMPLIANCE al usuario fixture compliance de forma idempotente |
| Tipo / Nivel | funcional · manual (CLI + SQL) |
| Prioridad | P1 |
| Trazabilidad | M0 / M9 del plan maestro |
| Precondiciones | Stack arriba y sembrado. |
| Pasos | 1. Verificar que `compliance@e2e.tekoapp.local` tiene el rol COMPLIANCE.<br>2. Ejecutar `pnpm e2e:seed` de nuevo.<br>3. Re-verificar. |
| Datos de prueba | `compliance@e2e.tekoapp.local` / `E2e-Passw0rd!` |
| Resultado esperado | Un único vínculo usuario-rol antes y después de la segunda corrida; el usuario puede loguearse con el flujo de CP-BE-AUTH-004. |
| Automatizado en | No automatizado (verificación manual). Código: `prisma/seed-e2e.ts`. Brecha: ampliar el smoke con el login de `compliance`. |

