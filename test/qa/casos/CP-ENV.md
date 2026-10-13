# CP-ENV — M0 Entorno E2E (Backend)

Especificación según `C:\workspace\QA-DOC-STANDARD.md` §2. Prioridad P0 (bloquea el resto de las oleadas).

### CP-BE-ENV-001 — Aborta el E2E si alguna conexión apunta a Supabase, a un host no local o al puerto 5432

| Campo | Contenido |
|---|---|
| ID | CP-BE-ENV-001 |
| Título | Aborta el E2E si alguna conexión apunta a Supabase, a un host no local o al puerto 5432 |
| Tipo / Nivel | integración · guard `assertSafeEnv` (scripts/e2e/env.ts) |
| Prioridad | P0 |
| Trazabilidad | M0 / M1 del plan maestro (TEKOAPP-E2E-MASTER-PLAN.md §3): "No apuntar nunca a Supabase" |
| Precondiciones | Repo con `.env.e2e` (o `.env.e2e.example`); la verificación manual no requiere Docker. |
| Pasos | 1. Poner en `.env.e2e` `DATABASE_URL=postgresql://u:p@aws-0-x.pooler.supabase.com:6543/postgres` y ejecutar `pnpm e2e:seed`.<br>2. Repetir con `DATABASE_URL=postgresql://u:p@localhost:5432/db` (puerto del Postgres nativo).<br>3. Repetir con `MONGODB_URI=mongodb://db.ejemplo.com:27017/x` (host no local).<br>4. Restaurar `.env.e2e` correcto y ejecutar `pnpm e2e:seed`. |
| Datos de prueba | `DATABASE_URL` con `supabase`/`pooler`; `DATABASE_URL` con `:5432`; `MONGODB_URI` con host remoto. Valores ficticios, sin secretos. |
| Resultado esperado | Pasos 1-3: el proceso termina con `[e2e] ABORTADO: ...` (nombra la clave y el motivo) antes de abrir cualquier conexión; nada se escribe en ninguna DB. Paso 4: continúa normalmente. |
| Automatizado en | `test/e2e-real/smoke.e2e-real-spec.ts` — `beforeAll` invoca `assertSafeEnv(process.env)` (defensa en profundidad; no es un `it`). **Brecha**: no existe un `it` ni spec unitario del guard; pendiente (propuesta: `scripts/e2e/env.spec.ts`). |

### CP-BE-ENV-002 — Siembra idempotente: correr el seed dos veces no duplica ni falla

| Campo | Contenido |
|---|---|
| ID | CP-BE-ENV-002 |
| Título | Siembra idempotente: correr el seed dos veces no duplica ni falla |
| Tipo / Nivel | funcional · manual (CLI) |
| Prioridad | P0 |
| Trazabilidad | M0 / M1 del plan maestro (TEKOAPP-E2E-MASTER-PLAN.md §3): "`e2e:up && e2e:seed` idempotente" |
| Precondiciones | Stack arriba (`pnpm e2e:up`), migraciones aplicadas. |
| Pasos | 1. Ejecutar `pnpm e2e:seed`.<br>2. Contar filas: `SELECT count(*) FROM users; SELECT count(*) FROM roles;` en `localhost:55432`.<br>3. Ejecutar `pnpm e2e:seed` por segunda vez.<br>4. Volver a contar. |
| Datos de prueba | Fixtures: admin, cliente_a, cliente_b, pro_aprobado, pro_pendiente, compliance (ver `test/e2e-real/README.md`). |
| Resultado esperado | Ambas corridas terminan con código 0 y los conteos del paso 4 son idénticos a los del paso 2 (todo es upsert). |
| Automatizado en | No automatizado (verificación manual del CLI `scripts/e2e/cli.ts seed`, que `pnpm qa:e2e` ejecuta). Brecha: falta un test que lo corra dos veces. |

### CP-BE-ENV-003 — Ignora RATE_LIMIT_MULTIPLIER cuando NODE_ENV=production

| Campo | Contenido |
|---|---|
| ID | CP-BE-ENV-003 |
| Título | Ignora RATE_LIMIT_MULTIPLIER cuando NODE_ENV=production |
| Tipo / Nivel | unitaria |
| Prioridad | P0 |
| Trazabilidad | M0 / M1 del plan maestro (TEKOAPP-E2E-MASTER-PLAN.md §3): "Rate-limit relajado vía env solo en e2e" |
| Precondiciones | Jest con `express-rate-limit` y el store de Redis mockeados. |
| Pasos | 1. Crear los limitadores con `NODE_ENV=production` y `RATE_LIMIT_MULTIPLIER=1000`.<br>2. Leer el `max` de cada limitador.<br>3. Repetir con `NODE_ENV=develop` y multiplicador 10, y sin la variable. |
| Datos de prueba | production + 1000 → [100, 5, 10, 20, 30]; develop + 10 → [1000, 50, 100, 200, 300]; sin variable → base. |
| Resultado esperado | En production los `max` quedan en los valores base aunque exista el multiplicador; fuera de production se escalan; los valores inválidos (`abc`, `0`, `-3`, `0.5`, `Infinity`, vacío) se ignoran (usan 1). |
| Automatizado en | `src/core/config/rate-limit.config.spec.ts` — `IGNORA el multiplicador si NODE_ENV=production`; también `escala todos los max cuando NODE_ENV no es production`, `sin la variable, los max quedan en los valores base`, `acepta el multiplicador numérico`. |

