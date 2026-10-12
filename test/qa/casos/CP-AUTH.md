# CP-AUTH — M1 Auth y sesión, smoke real (Backend)

Los 6 casos del smoke real. Prefijo de la API: `/tekoapp-backend/api/v1`. Credenciales de fixtures en `test/e2e-real/README.md` (valores de prueba locales).

### CP-BE-AUTH-001 — Verifica Postgres, Mongo y Redis reales en `up` en el healthcheck

| Campo | Contenido |
|---|---|
| ID | CP-BE-AUTH-001 |
| Título | Verifica Postgres, Mongo y Redis reales en `up` en el healthcheck |
| Tipo / Nivel | smoke · e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M0 / M1 del plan maestro (TEKOAPP-E2E-MASTER-PLAN.md §3) |
| Precondiciones | Docker corriendo; `pnpm e2e:up` y `pnpm e2e:seed` ejecutados (o `pnpm qa:e2e`). |
| Pasos | 1. `GET /tekoapp-backend/api/healthcheck` (versión neutra, sin auth).<br>2. Leer `details`. |
| Datos de prueba | — |
| Resultado esperado | Status 200, o 503 si falla SOLO `storage_disk` (umbral de disco del host); `postgres_database`, `mongodb_database` y `redis` con `status: up`. |
| Automatizado en | `test/e2e-real/smoke.e2e-real-spec.ts` — `healthcheck (version-neutral): Postgres, Mongo y Redis reales en up` |

### CP-BE-AUTH-002 — Entrega el PEM público RSA generado para el E2E

| Campo | Contenido |
|---|---|
| ID | CP-BE-AUTH-002 |
| Título | Entrega el PEM público RSA generado para el E2E |
| Tipo / Nivel | smoke · e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M0 / M1 del plan maestro (TEKOAPP-E2E-MASTER-PLAN.md §3) |
| Precondiciones | Docker corriendo; `pnpm e2e:up` y `pnpm e2e:seed` ejecutados (o `pnpm qa:e2e`). |
| Pasos | 1. `GET /auth/public-key` con Basic Auth `tekoapp-web`. |
| Datos de prueba | Basic `tekoapp-web` / `WEB_CLIENT_SECRET` |
| Resultado esperado | 200 y `publicKeyPem` contiene `BEGIN PUBLIC KEY`. |
| Automatizado en | `test/e2e-real/smoke.e2e-real-spec.ts` — `GET /auth/public-key devuelve el PEM publico generado para el E2E` |

### CP-BE-AUTH-003 — Rechaza Basic Auth inválido o ausente con 401

| Campo | Contenido |
|---|---|
| ID | CP-BE-AUTH-003 |
| Título | Rechaza Basic Auth inválido o ausente con 401 |
| Tipo / Nivel | smoke · e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M0 / M1 del plan maestro (TEKOAPP-E2E-MASTER-PLAN.md §3) |
| Precondiciones | Docker corriendo; `pnpm e2e:up` y `pnpm e2e:seed` ejecutados (o `pnpm qa:e2e`). |
| Pasos | 1. `GET /auth/public-key` con `tekoapp-web:nope`.<br>2. `GET /auth/public-key` sin cabecera Authorization. |
| Datos de prueba | `tekoapp-web` / `nope` |
| Resultado esperado | Ambas respuestas 401. |
| Automatizado en | `test/e2e-real/smoke.e2e-real-spec.ts` — `Basic Auth invalido -> 401` |

### CP-BE-AUTH-004 — Autentica al admin con nonce + RSA y accede a /auth/scope

| Campo | Contenido |
|---|---|
| ID | CP-BE-AUTH-004 |
| Título | Autentica al admin con nonce + RSA y accede a /auth/scope |
| Tipo / Nivel | smoke · e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M0 / M1 del plan maestro (TEKOAPP-E2E-MASTER-PLAN.md §3) |
| Precondiciones | Docker corriendo; `pnpm e2e:up` y `pnpm e2e:seed` ejecutados (o `pnpm qa:e2e`). |
| Pasos | 1. `GET /auth/public-key`.<br>2. `POST /auth/nonce`.<br>3. Cifrar `{password, nonce}` con RSA-OAEP sha256 y `POST /auth/login`.<br>4. `GET /auth/scope` con el Bearer devuelto. |
| Datos de prueba | `admin@tekoapp.com.py` / `Tekoapp123!` |
| Resultado esperado | Login 200/201 con `accessToken`; `/auth/scope` 200 y contiene `admin:all`. |
| Automatizado en | `test/e2e-real/smoke.e2e-real-spec.ts` — `nonce + RSA -> login admin -> /auth/scope` |

### CP-BE-AUTH-005 — Rechaza endpoint protegido sin token con 401

| Campo | Contenido |
|---|---|
| ID | CP-BE-AUTH-005 |
| Título | Rechaza endpoint protegido sin token con 401 |
| Tipo / Nivel | smoke · e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M0 / M1 del plan maestro (TEKOAPP-E2E-MASTER-PLAN.md §3) |
| Precondiciones | Docker corriendo; `pnpm e2e:up` y `pnpm e2e:seed` ejecutados (o `pnpm qa:e2e`). |
| Pasos | 1. `GET /auth/scope` sin Authorization. |
| Datos de prueba | — |
| Resultado esperado | 401. |
| Automatizado en | `test/e2e-real/smoke.e2e-real-spec.ts` — `endpoint protegido sin token -> 401` |

### CP-BE-AUTH-006 — Rechaza con 403 a un cliente en un endpoint de staff

| Campo | Contenido |
|---|---|
| ID | CP-BE-AUTH-006 |
| Título | Rechaza con 403 a un cliente en un endpoint de staff |
| Tipo / Nivel | smoke · e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M0 / M1 del plan maestro (TEKOAPP-E2E-MASTER-PLAN.md §3) |
| Precondiciones | Docker corriendo; `pnpm e2e:up` y `pnpm e2e:seed` ejecutados (o `pnpm qa:e2e`). |
| Pasos | 1. Login de `cliente_a`.<br>2. `GET /admin/ai-disclosures` con su Bearer. |
| Datos de prueba | `cliente_a@e2e.tekoapp.local` / `E2e-Passw0rd!` |
| Resultado esperado | 403 (autenticado pero sin permiso). |
| Automatizado en | `test/e2e-real/smoke.e2e-real-spec.ts` — `usuario sin permiso -> 403 en endpoint de staff` |

