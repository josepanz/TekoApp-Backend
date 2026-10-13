# Plan de pruebas — TekoApp Backend

Referencias: `C:\workspace\QA-DOC-STANDARD.md`, `C:\workspace\TEKOAPP-E2E-MASTER-PLAN.md` (§3, módulos M0..M11).

## 1. Alcance

Backend NestJS (API REST versionada `/tekoapp-backend/api/v1`, WebSocket de ubicación, jobs y seeds). Cubierto por esta
rama (`feat/e2e-entorno-y-blindaje-locations`): entorno E2E aislado (M0), smoke de autenticación (M1) y blindaje de
`/locations` (JWT, ofuscación, coordenada exacta restringida, WS). Fuera de alcance por ahora: M2-M11 en e2e real
(oleadas W1-W5 del plan maestro), carga/performance (k6) y accesibilidad (aplican a Web/Mobile).

## 2. Niveles de prueba

| Nivel | Qué es | Dónde | Comando | Datos / dependencias |
|---|---|---|---|---|
| Unitario | ~138 suites Jest con mocks de Prisma, Redis, Mongo y servicios | `src/**/*.spec.ts` | `pnpm test`, `pnpm qa:unit` | Ninguna infraestructura |
| Smoke / e2e real | App completa (`AppModule` + `MiddlewareConfig`) en el proceso de Jest contra Postgres, Mongo, Redis, MinIO y MailHog reales | `test/e2e-real/*.e2e-real-spec.ts`, `test/jest-e2e-real.json` | `pnpm e2e:up`, `pnpm e2e:seed`, `pnpm test:e2e:real`, `pnpm e2e:down`, o `pnpm qa:e2e` | `docker-compose.e2e.yml`, `.env.e2e`, fixtures del seed |
| E2E legacy | App con módulos mockeados y healthcheck mockeado; solo valida el arranque HTTP | `test/app.e2e-spec.ts`, `test/jest-e2e.json` | `pnpm test:e2e` | Ninguna infraestructura |

Cada caso funcional se especifica en `casos/CP-*.md` y apunta al `it` que lo automatiza; lo que no está automatizado
se declara como "No automatizado / Brecha".

## 3. Entornos

| Entorno | Uso | Notas |
|---|---|---|
| Local (unit) | Jest en la máquina del desarrollador/agente | Node 22; sin red |
| Compose e2e (`tekoapp-e2e`) | Smoke real | Puertos propios: Postgres 55432, Mongo 57017, Redis 56379, MinIO 59000, MailHog 51025/58025. Volúmenes descartables (`down -v`). Claves RSA/VAPID generadas por corrida. Stripe `sk_test_*` stub, FCM/Twilio stub, email a MailHog. `RATE_LIMIT_MULTIPLIER=1000` solo en `.env.e2e` |
| CI (GitHub Actions, `pipeline.yml`) | lint, `pnpm test --coverage=false`, build, scan, deploy | El e2e real NO corre en CI (nightly previsto en la oleada W7) |

Prohibido: ejecutar pruebas contra Supabase o cualquier base compartida; el `.env` del repo la apunta y ningún script e2e lo lee.

## 4. Criterios de entrada

- Rama sin cambios sin commitear que afecten lo probado; `pnpm install` al día; `pnpm check:types` sin errores.
- Para e2e: Docker corriendo (`docker info` responde) y puertos 55432/57017/56379/59000/51025/58025/58025 libres; `.env.e2e` presente (se crea desde `.env.e2e.example`).
- Para e2e: `assertSafeEnv` sin abortar (ninguna conexión a Supabase/pooler, host local, puerto distinto de 5432).

## 5. Criterios de salida

| Veredicto | Criterio |
|---|---|
| APROBADO | 0 casos fallidos; 0 defectos P0/P1 abiertos; cobertura global cumple el umbral de `jest.config.ts` (70 branches / 80 functions / 80 lines / 80 statements) |
| APROBADO CON OBSERVACIONES | 0 casos fallidos y 0 defectos P0/P1; hay desvíos documentados (p. ej. umbral de cobertura incumplido de forma preexistente, omitidos con motivo) |
| RECHAZADO | Cualquier caso fallido sin explicación de entorno, o defecto P0/P1 abierto |

Regla de corte del plan maestro: no se abre una oleada nueva con fallos P0/P1 abiertos de la anterior. Los defectos de
producto se registran como `DEF-BE-NNN` en el informe y no se corrigen dentro de la ejecución de pruebas.

## 6. Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Umbral de cobertura ya incumplido en `develop` (branches 66.75 % vs 70, functions 75.72 % vs 80) | `pnpm test:cov` sale con código distinto de 0 aunque todos los tests pasen | No se modifica el umbral; se informa en cada informe unit como desvío y se corrige subiendo cobertura, no bajando el umbral |
| Conexión accidental a Supabase (datos reales) | Corrupción de datos compartidos | Guard `assertSafeEnv` en CLI y en el `beforeAll` del smoke; solo se lee `.env.e2e` |
| Colisión con el Postgres nativo de Windows (5432) | Pruebas contra la DB equivocada | Puerto 55432 y rechazo explícito de `:5432` |
| `healthcheck` 503 por `storage_disk` del host | Falso negativo | El smoke exige solo Postgres, Mongo y Redis `up` |
| Tests e2e dependientes del estado del seed | Flakiness | Seed idempotente (upserts); stack descartable por corrida |
| Mocks que divergen del comportamiento real (unit) | Falsos verdes | Smoke real y casos manuales documentados como brecha (ENV-001/002, SEED) |
| Cobertura de e2e real limitada a auth | Sin garantía de M2-M11 | Oleadas W1-W5 del plan maestro |
| Rate-limit relajado en e2e | Diferencia con producción | El multiplicador se ignora en `NODE_ENV=production` (CP-BE-ENV-003) |

## 7. Trazabilidad e informes

Casos: `casos/`. Cada ejecución real genera un informe en `informes/` con `pnpm qa:unit` o `pnpm qa:e2e`; los
resultados salen del JSON de Jest y el veredicto se redacta a mano según el §5.
