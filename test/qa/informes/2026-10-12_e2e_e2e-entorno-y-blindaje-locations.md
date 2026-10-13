# Informe de ejecución QA — E2E real (smoke) — feat/e2e-entorno-y-blindaje-locations

| Campo | Valor |
|---|---|
| Fecha y hora | 2026-10-12 20:48 |
| Repo | TekoApp-Backend |
| Rama | `feat/e2e-entorno-y-blindaje-locations` |
| Commit | `5239119` (árbol con cambios sin commitear) |
| Entorno | compose e2e (docker-compose.e2e.yml, .env.e2e), Node v22.16.0, Docker 29.6.2, build dfc4efb |
| Comando | `pnpm qa:e2e` |
| Ejecutor | agente Claude Code (modelo claude-sonnet-5-5) |

## 1. Resumen

| Suites | Casos | Pasaron | Fallaron | Omitidos | Duración |
|---|---|---|---|---|---|
| 1 (0 con fallo) | 6 | 6 | 0 | 0 | 7 min 45 s |

## 2. Resultados por caso

| Caso CP | Suite | Caso (it) | Estado |
|---|---|---|---|
| CP-BE-AUTH-001 | `test/e2e-real/smoke.e2e-real-spec.ts` | Smoke E2E real healthcheck (version-neutral): Postgres, Mongo y Redis reales en up | passed |
| CP-BE-AUTH-002 | `test/e2e-real/smoke.e2e-real-spec.ts` | Smoke E2E real GET /auth/public-key devuelve el PEM publico generado para el E2E | passed |
| CP-BE-AUTH-003 | `test/e2e-real/smoke.e2e-real-spec.ts` | Smoke E2E real Basic Auth invalido -> 401 | passed |
| CP-BE-AUTH-004 | `test/e2e-real/smoke.e2e-real-spec.ts` | Smoke E2E real nonce + RSA -> login admin -> /auth/scope | passed |
| CP-BE-AUTH-005 | `test/e2e-real/smoke.e2e-real-spec.ts` | Smoke E2E real endpoint protegido sin token -> 401 | passed |
| CP-BE-AUTH-006 | `test/e2e-real/smoke.e2e-real-spec.ts` | Smoke E2E real usuario sin permiso -> 403 en endpoint de staff | passed |

### Casos fallidos u omitidos

Ninguno.

## 3. Defectos encontrados

Ninguno. Los 6 casos CP-BE-AUTH-001..006 pasaron contra el stack real.

## 4. Desvíos y observaciones

- Entorno: stack `tekoapp-e2e` levantado con `e2e up` + `e2e seed`; `e2e down` ejecutado al final (contenedores y volúmenes eliminados, verificado con `docker ps`).
- Duración alta (465 s de Jest): el arranque de `AppModule` completo y los logins con RSA en la primera corrida son lentos; ningún test excedió el timeout de 60 s. Sin flakies en 1 corrida.
- `healthcheck` respondió con Postgres, Mongo y Redis `up` (el smoke tolera 503 solo por `storage_disk`).
- Casos de CP-ENV y CP-SEED marcados "manual" no se ejecutaron en este informe; el seed se ejecutó una vez (sin re-ejecución para verificar idempotencia, brecha CP-BE-ENV-002).
- El guard `assertSafeEnv` actuó en `beforeAll` y no abortó (entorno local correcto).

## 5. Evidencia

- Salida JSON de jest en `coverage/jest-e2e.json` (ignorado por git).

## 6. Veredicto

**APROBADO.** Criterio (PLAN-DE-PRUEBAS §5): 6/6 casos pasaron, 0 defectos, stack bajado. Alcance limitado a smoke de auth (M0/M1).
