# CP-AUTH — M1 Auth y sesión (Backend)

CP-BE-AUTH-001..006: smoke real. CP-BE-AUTH-007..038 y CP-BE-ERR-001..009: ola W1 (registro, login, scope, refresh, Basic Auth pre-login, guards, rate-limit, rol COMPLIANCE y contrato de error). Los casos marcados `[DEF ...]` están automatizados como `it.failing`: el test pasa mientras el defecto exista y se pone en rojo al corregirlo (entonces hay que quitar `.failing`). Prefijo de la API: `/tekoapp-backend/api/v1`. Credenciales de fixtures en `test/e2e-real/README.md` (valores de prueba locales).

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


## Ola W1 — registro, login, scope, refresh, Basic Auth, guards y COMPLIANCE

Matriz de cobertura de la ola (extracto del plan): sin endpoint de logout (DEF-BE-006); la invalidación posterior al logout queda como caso `it.failing`.

### CP-BE-AUTH-007 — Registra un usuario nuevo por POST /onboarding

| Campo | Contenido |
|---|---|
| ID | CP-BE-AUTH-007 |
| Título | Registra un usuario nuevo por POST /onboarding |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M1 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 1 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. |
| Pasos | 1. Obtener la clave pública (`GET /auth/public-key`).<br>2. Cifrar la password con RSA-OAEP sha256.<br>3. `POST /onboarding` con Basic web. |
| Datos de prueba | email `reg_<hex>@e2e.tekoapp.local` (único por corrida), password `E2e-Passw0rd!` |
| Resultado esperado | 201; `status` PENDING_VERIFICATION; devuelve `referenceId` y `email`. |
| Automatizado en | `test/e2e-real/auth.e2e-real-spec.ts` — `Registro POST /onboarding › registra un usuario nuevo (201, PENDING_VERIFICATION)` |

### CP-BE-AUTH-008 — Rechaza registro con email duplicado (USER_ALREADY_EXISTS)

| Campo | Contenido |
|---|---|
| ID | CP-BE-AUTH-008 |
| Título | Rechaza registro con email duplicado (USER_ALREADY_EXISTS) |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M1 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 1 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. |
| Pasos | 1. Registrar un email nuevo (201).<br>2. Repetir el mismo `POST /onboarding`. |
| Datos de prueba | email único por corrida |
| Resultado esperado | 409 con envelope de error y mensaje "Usuario ya existe.". |
| Automatizado en | `test/e2e-real/auth.e2e-real-spec.ts` — `Registro POST /onboarding › rechaza email duplicado con 409 (USER_ALREADY_EXISTS)` |

### CP-BE-AUTH-009 — Rechaza registro con passwords que no coinciden

| Campo | Contenido |
|---|---|
| ID | CP-BE-AUTH-009 |
| Título | Rechaza registro con passwords que no coinciden |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M1 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 1 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. |
| Pasos | 1. `POST /onboarding` con `password` y `confirmPassword` cifradas con valores distintos. |
| Datos de prueba | E2e-Passw0rd! vs Otra-Passw0rd!1 |
| Resultado esperado | 400 con mensaje "Las contraseñas no coinciden.". |
| Automatizado en | `test/e2e-real/auth.e2e-real-spec.ts` — `Registro POST /onboarding › rechaza passwords que no coinciden con 400` |

### CP-BE-AUTH-010 — Rechaza body de registro inválido con 400/422

| Campo | Contenido |
|---|---|
| ID | CP-BE-AUTH-010 |
| Título | Rechaza body de registro inválido con 400/422 [DEF DEF-BE-001: caso `it.failing`, hoy el sistema NO cumple el esperado] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M1 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 1; DEF-BE-001 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. |
| Pasos | 1. `POST /onboarding` con body `{ "email": "nope" }`. |
| Datos de prueba | body incompleto |
| Resultado esperado | 400 o 422 con el envelope de error estándar. Hoy: 500 `{statusCode,message}` (el `exceptionFactory` del ValidationPipe devuelve un objeto plano, no una HttpException). |
| Automatizado en | `test/e2e-real/auth.e2e-real-spec.ts` — `Registro POST /onboarding › DEF-BE-001: body inválido debe responder 400/422 (hoy 500)` |

### CP-BE-AUTH-011 — Un usuario recién registrado inicia sesión en estado PENDING_VERIFICATION sin acceso admin

| Campo | Contenido |
|---|---|
| ID | CP-BE-AUTH-011 |
| Título | Un usuario recién registrado inicia sesión en estado PENDING_VERIFICATION sin acceso admin |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M1 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 1 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. |
| Pasos | 1. Registrar usuario.<br>2. Login RSA+nonce.<br>3. Decodificar el accessToken.<br>4. `GET /admin/ai-disclosures` con ese token. |
| Datos de prueba | usuario único por corrida |
| Resultado esperado | Login 200/201 con accessToken cuyo `userStatus` es PENDING_VERIFICATION (comportamiento actual por diseño); el admin responde 403. |
| Automatizado en | `test/e2e-real/auth.e2e-real-spec.ts` — `Registro POST /onboarding › un usuario recién registrado inicia sesión...` |

### CP-BE-AUTH-012 — Rechaza login con password incorrecta

| Campo | Contenido |
|---|---|
| ID | CP-BE-AUTH-012 |
| Título | Rechaza login con password incorrecta |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M1 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 1 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. |
| Pasos | 1. Login RSA+nonce de cliente_b con password errónea. |
| Datos de prueba | cliente_b / `Mala-Passw0rd!` |
| Resultado esperado | 401 sin accessToken (un login exitoso posterior resetea el contador de intentos). |
| Automatizado en | `test/e2e-real/auth.e2e-real-spec.ts` — `Login › password incorrecta -> 401` |

### CP-BE-AUTH-013 — Rechaza login con email inexistente con 401 (igual que password incorrecta)

| Campo | Contenido |
|---|---|
| ID | CP-BE-AUTH-013 |
| Título | Rechaza login con email inexistente con 401 (igual que password incorrecta) [DEF DEF-BE-003: caso `it.failing`, hoy el sistema NO cumple el esperado] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M1 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 1; DEF-BE-003 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. |
| Pasos | 1. Login RSA+nonce con un email que no existe. |
| Datos de prueba | email aleatorio |
| Resultado esperado | 401, igual que la password incorrecta (sin enumeración de usuarios). Hoy: 200 `{login:false}`. |
| Automatizado en | `test/e2e-real/auth.e2e-real-spec.ts` — `Login › DEF-BE-003: email inexistente debe dar 401...` |

### CP-BE-AUTH-014 — Rechaza login con body vacío con 400/422

| Campo | Contenido |
|---|---|
| ID | CP-BE-AUTH-014 |
| Título | Rechaza login con body vacío con 400/422 [DEF DEF-BE-001: caso `it.failing`, hoy el sistema NO cumple el esperado] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M1 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 1; DEF-BE-001 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. |
| Pasos | 1. `POST /auth/login` con Basic válido y `{}`. |
| Datos de prueba | {} |
| Resultado esperado | 400/422. Hoy: 500 `{statusCode,message}`. |
| Automatizado en | `test/e2e-real/auth.e2e-real-spec.ts` — `Login › DEF-BE-001: login con body vacío debe dar 400/422 (hoy 500)` |

### CP-BE-AUTH-015 — Un nonce reutilizado no permite un segundo login

| Campo | Contenido |
|---|---|
| ID | CP-BE-AUTH-015 |
| Título | Un nonce reutilizado no permite un segundo login |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M1 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 1 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. |
| Pasos | 1. Obtener un nonce.<br>2. Login con ese nonce (OK).<br>3. Repetir el mismo body. |
| Datos de prueba | cliente_b |
| Resultado esperado | El segundo intento no devuelve accessToken y responde >= 400. |
| Automatizado en | `test/e2e-real/auth.e2e-real-spec.ts` — `Login › reutilizar un nonce no permite un segundo login` |

### CP-BE-AUTH-016 — El login emite cookies httpOnly accessToken y refreshToken

| Campo | Contenido |
|---|---|
| ID | CP-BE-AUTH-016 |
| Título | El login emite cookies httpOnly accessToken y refreshToken |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M1 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 1 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. |
| Pasos | 1. Login válido.<br>2. Inspeccionar `Set-Cookie`. |
| Datos de prueba | cliente_b |
| Resultado esperado | Ambas cookies presentes con el atributo `HttpOnly` (el JWT no es legible desde JS). |
| Automatizado en | `test/e2e-real/auth.e2e-real-spec.ts` — `Login › el login emite cookies httpOnly accessToken y refreshToken` |

### CP-BE-AUTH-017 — El cliente Basic mobile también puede autenticar

| Campo | Contenido |
|---|---|
| ID | CP-BE-AUTH-017 |
| Título | El cliente Basic mobile también puede autenticar |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M1 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 1 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. |
| Pasos | 1. Nonce y login con Basic `tekoapp-mobile`. |
| Datos de prueba | tekoapp-mobile / `MOBILE_CLIENT_SECRET` |
| Resultado esperado | 200/201 con accessToken. |
| Automatizado en | `test/e2e-real/auth.e2e-real-spec.ts` — `Login › el cliente Basic mobile también puede autenticar` |

### CP-BE-AUTH-018 — /auth/scope del admin refleja ADMIN y admin:all

| Campo | Contenido |
|---|---|
| ID | CP-BE-AUTH-018 |
| Título | /auth/scope del admin refleja ADMIN y admin:all |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M1 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 1 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. |
| Pasos | 1. Login admin.<br>2. `GET /auth/scope`. |
| Datos de prueba | admin@tekoapp.com.py |
| Resultado esperado | roles contiene ADMIN; permissions contiene `admin:all`. |
| Automatizado en | `test/e2e-real/auth.e2e-real-spec.ts` — `/auth/scope refleja permisos reales por fixture › admin: rol ADMIN y admin:all` |

### CP-BE-AUTH-019 — /auth/scope del cliente no tiene permisos administrativos

| Campo | Contenido |
|---|---|
| ID | CP-BE-AUTH-019 |
| Título | /auth/scope del cliente no tiene permisos administrativos |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M1 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 1 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. |
| Pasos | 1. Login cliente_a.<br>2. `GET /auth/scope`. |
| Datos de prueba | cliente_a |
| Resultado esperado | email correcto; sin `admin:all` ni rol ADMIN. |
| Automatizado en | `test/e2e-real/auth.e2e-real-spec.ts` — `/auth/scope refleja permisos reales por fixture › cliente_a: ...` |

### CP-BE-AUTH-020 — /auth/scope de compliance refleja COMPLIANCE con permisos legales

| Campo | Contenido |
|---|---|
| ID | CP-BE-AUTH-020 |
| Título | /auth/scope de compliance refleja COMPLIANCE con permisos legales |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M1 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 1 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. |
| Pasos | 1. Login compliance.<br>2. `GET /auth/scope`. |
| Datos de prueba | compliance |
| Resultado esperado | rol COMPLIANCE; permisos `legal.config:manage` y `legal.consent-audit:read`; sin `admin:all`. |
| Automatizado en | `test/e2e-real/auth.e2e-real-spec.ts` — `/auth/scope refleja permisos reales por fixture › compliance: ...` |

### CP-BE-AUTH-021 — Refresh token válido devuelve un accessToken utilizable

| Campo | Contenido |
|---|---|
| ID | CP-BE-AUTH-021 |
| Título | Refresh token válido devuelve un accessToken utilizable |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M1 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 1 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. |
| Pasos | 1. Login y capturar la cookie `refreshToken`.<br>2. `POST /auth/refresh-token` con la cookie y Basic web.<br>3. Usar el nuevo accessToken en `/auth/scope`. |
| Datos de prueba | cliente_b |
| Resultado esperado | 200/201 con accessToken nuevo; `/auth/scope` 200. |
| Automatizado en | `test/e2e-real/auth.e2e-real-spec.ts` — `Refresh token › refresh válido devuelve un accessToken utilizable` |

### CP-BE-AUTH-022 — Refresh con cookie basura responde 401

| Campo | Contenido |
|---|---|
| ID | CP-BE-AUTH-022 |
| Título | Refresh con cookie basura responde 401 |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M1 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 1 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. |
| Pasos | 1. `POST /auth/refresh-token` con `refreshToken=no-es-un-jwt`. |
| Datos de prueba | cookie inválida |
| Resultado esperado | 401. |
| Automatizado en | `test/e2e-real/auth.e2e-real-spec.ts` — `Refresh token › refresh con cookie basura -> 401` |

### CP-BE-AUTH-023 — Refresh sin cookie responde 401

| Campo | Contenido |
|---|---|
| ID | CP-BE-AUTH-023 |
| Título | Refresh sin cookie responde 401 |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M1 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 1 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. |
| Pasos | 1. `POST /auth/refresh-token` con Basic y sin cookie. |
| Datos de prueba | — |
| Resultado esperado | 401. |
| Automatizado en | `test/e2e-real/auth.e2e-real-spec.ts` — `Refresh token › refresh sin cookie -> 401` |

### CP-BE-AUTH-024 — Refresh expirado responde 401

| Campo | Contenido |
|---|---|
| ID | CP-BE-AUTH-024 |
| Título | Refresh expirado responde 401 |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M1 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 1 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. |
| Pasos | 1. Firmar con la clave privada del entorno un JWT `{email, tokenType}` con `expiresIn: -60`.<br>2. Enviarlo como cookie a `/auth/refresh-token`. |
| Datos de prueba | JWT RS256 vencido |
| Resultado esperado | 401. |
| Automatizado en | `test/e2e-real/auth.e2e-real-spec.ts` — `Refresh token › refresh expirado (firmado con la clave real) -> 401` |

### CP-BE-AUTH-025 — Refresh firmado con otra clave responde 401

| Campo | Contenido |
|---|---|
| ID | CP-BE-AUTH-025 |
| Título | Refresh firmado con otra clave responde 401 |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M1 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 1 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. |
| Pasos | 1. Firmar un refresh con un par RSA ajeno.<br>2. Enviarlo a `/auth/refresh-token`. |
| Datos de prueba | JWT forjado |
| Resultado esperado | 401. |
| Automatizado en | `test/e2e-real/auth.e2e-real-spec.ts` — `Refresh token › refresh firmado con otra clave -> 401` |

### CP-BE-AUTH-026 — El 401 de refresh nombra el error como Unauthorized

| Campo | Contenido |
|---|---|
| ID | CP-BE-AUTH-026 |
| Título | El 401 de refresh nombra el error como Unauthorized [DEF DEF-BE-004: caso `it.failing`, hoy el sistema NO cumple el esperado] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P2 |
| Trazabilidad | M1 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 1; DEF-BE-004 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. |
| Pasos | 1. `POST /auth/refresh-token` sin cookie.<br>2. Leer `error.error`. |
| Datos de prueba | — |
| Resultado esperado | `error.error` = "Unauthorized". Hoy: "Internal Server Error" con `message` "Unauthorized" (sin localizar). |
| Automatizado en | `test/e2e-real/auth.e2e-real-spec.ts` — `Refresh token › DEF-BE-004: el 401 de refresh debe llamarse "Unauthorized"...` |

### CP-BE-AUTH-027 — Existe logout que invalida la sesión

| Campo | Contenido |
|---|---|
| ID | CP-BE-AUTH-027 |
| Título | Existe logout que invalida la sesión [DEF DEF-BE-006: caso `it.failing`, hoy el sistema NO cumple el esperado] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M1 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 1; DEF-BE-006 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. |
| Pasos | 1. Login.<br>2. `POST /auth/logout` con Bearer. |
| Datos de prueba | cliente_b |
| Resultado esperado | 200/204 e invalidación del refresh token. Hoy: 404 (el endpoint no existe; no hay forma server-side de revocar sesiones). |
| Automatizado en | `test/e2e-real/auth.e2e-real-spec.ts` — `Refresh token › DEF-BE-006: existe logout que invalide la sesión` |

### CP-BE-AUTH-028 — Endpoints pre-login sin Authorization responden 401

| Campo | Contenido |
|---|---|
| ID | CP-BE-AUTH-028 |
| Título | Endpoints pre-login sin Authorization responden 401 |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M1 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 1 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. |
| Pasos | 1. Para cada endpoint: `GET /auth/public-key`, `POST /auth/nonce`, `POST /auth/login`, `POST /onboarding`, `POST /auth/refresh-token`, `PUT /auth/forgot-password`, `POST /auth/create-password`, `PUT /auth/change-expired-password`: llamar sin cabecera Authorization. |
| Datos de prueba | 8 endpoints |
| Resultado esperado | 401 en todos. |
| Automatizado en | `test/e2e-real/auth.e2e-real-spec.ts` — `Basic Auth inválido o ausente... › <endpoint> sin Authorization -> 401` (it.each) |

### CP-BE-AUTH-029 — Endpoints pre-login con secret incorrecto responden 401

| Campo | Contenido |
|---|---|
| ID | CP-BE-AUTH-029 |
| Título | Endpoints pre-login con secret incorrecto responden 401 |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M1 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 1 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. |
| Pasos | 1. Mismos 8 endpoints con Basic `tekoapp-web:secreto-incorrecto`. |
| Datos de prueba | 8 endpoints |
| Resultado esperado | 401 en todos. |
| Automatizado en | `test/e2e-real/auth.e2e-real-spec.ts` — `Basic Auth inválido o ausente... › <endpoint> con secret incorrecto -> 401` (it.each) |

### CP-BE-AUTH-030 — Endpoints pre-login con clientId inexistente responden 401

| Campo | Contenido |
|---|---|
| ID | CP-BE-AUTH-030 |
| Título | Endpoints pre-login con clientId inexistente responden 401 |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M1 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 1 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. |
| Pasos | 1. Mismos 8 endpoints con Basic `cliente-fantasma:<secret web>`. |
| Datos de prueba | 8 endpoints |
| Resultado esperado | 401 en todos. |
| Automatizado en | `test/e2e-real/auth.e2e-real-spec.ts` — `Basic Auth inválido o ausente... › <endpoint> con clientId inexistente -> 401` (it.each) |

### CP-BE-AUTH-031 — Un Bearer en un endpoint con Basic Auth responde 401

| Campo | Contenido |
|---|---|
| ID | CP-BE-AUTH-031 |
| Título | Un Bearer en un endpoint con Basic Auth responde 401 |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M1 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 1 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. |
| Pasos | 1. Login.<br>2. `POST /auth/nonce` con `Authorization: Bearer <token>`. |
| Datos de prueba | cliente_b |
| Resultado esperado | 401. |
| Automatizado en | `test/e2e-real/auth.e2e-real-spec.ts` — `Basic Auth inválido o ausente... › Authorization con formato Bearer en un endpoint Basic -> 401` |

### CP-BE-AUTH-032 — Un cliente recibe 403 en endpoints administrativos

| Campo | Contenido |
|---|---|
| ID | CP-BE-AUTH-032 |
| Título | Un cliente recibe 403 en endpoints administrativos |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M1 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 1 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. |
| Pasos | 1. Login cliente_a.<br>2. Llamar `GET /admin/ai-disclosures`, `GET /admin/audit-logs`, `GET /users`, `GET /admin/legal/document-versions`, `POST /professionals/1/verify`, `POST /professionals/1/suspend`. |
| Datos de prueba | cliente_a |
| Resultado esperado | 403 en los 6. |
| Automatizado en | `test/e2e-real/auth.e2e-real-spec.ts` — `Guards de autorización › cliente_a: <método> <ruta> -> 403` (it.each) |

### CP-BE-AUTH-033 — pro_aprobado y compliance no pueden verify/suspend de professionals

| Campo | Contenido |
|---|---|
| ID | CP-BE-AUTH-033 |
| Título | pro_aprobado y compliance no pueden verify/suspend de professionals |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M1 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 1 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. |
| Pasos | 1. Login del usuario.<br>2. `POST /professionals/1/verify` y `/suspend` con `{reason}`. |
| Datos de prueba | pro_aprobado, compliance |
| Resultado esperado | 403. |
| Automatizado en | `test/e2e-real/auth.e2e-real-spec.ts` — `Guards de autorización › <fixture> sin permiso no puede verify/suspend de professionals (403)` (it.each) |

### CP-BE-AUTH-034 — Token ausente, malformado o forjado responde 401

| Campo | Contenido |
|---|---|
| ID | CP-BE-AUTH-034 |
| Título | Token ausente, malformado o forjado responde 401 |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M1 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 1 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. |
| Pasos | 1. `GET /auth/scope` sin token, con un JWT malformado y con un JWT HS256 forjado. |
| Datos de prueba | — |
| Resultado esperado | 401 en los tres. |
| Automatizado en | `test/e2e-real/auth.e2e-real-spec.ts` — `Guards de autorización › token ausente, malformado o de otra clave -> 401 en endpoint protegido` |

### CP-BE-AUTH-035 — El 6º intento de login tras 5 fallidos responde 429

| Campo | Contenido |
|---|---|
| ID | CP-BE-AUTH-035 |
| Título | El 6º intento de login tras 5 fallidos responde 429 |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M1 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 1 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. El spec fuerza el multiplicador y limpia las claves `rl:*` de Redis antes y después (sin hackear código de producto). |
| Pasos | 1. Con `RATE_LIMIT_MULTIPLIER=1` y Redis limpio: 5 `POST /auth/login` con Basic inválido (401).<br>2. 6º `POST /auth/login` con Basic válido.<br>3. `POST /auth/nonce`. |
| Datos de prueba | Basic web válido / inválido |
| Resultado esperado | 5 respuestas 401, 6º login 429 y nonce 429 (limiter `auth` por IP, 5 / 15 min, solo cuenta fallos). |
| Automatizado en | `test/e2e-real/auth-rate-limit.e2e-real-spec.ts` — `M1 Auth - rate limit (multiplicador = 1) › el 6º intento de login tras 5 fallidos -> 429` |

### CP-BE-AUTH-036 — COMPLIANCE accede a consent-audit y versiones legales

| Campo | Contenido |
|---|---|
| ID | CP-BE-AUTH-036 |
| Título | COMPLIANCE accede a consent-audit y versiones legales |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M1 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 1 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. |
| Pasos | 1. Login compliance.<br>2. `GET /admin/legal/consents`, `/content-consents`, `/document-versions`, `/retention-policies`. |
| Datos de prueba | compliance |
| Resultado esperado | 200 en los 4. |
| Automatizado en | `test/e2e-real/auth.e2e-real-spec.ts` — `Rol COMPLIANCE › compliance accede a GET <ruta> (200)` (it.each) |

### CP-BE-AUTH-037 — COMPLIANCE recibe 403 en endpoints admin ajenos

| Campo | Contenido |
|---|---|
| ID | CP-BE-AUTH-037 |
| Título | COMPLIANCE recibe 403 en endpoints admin ajenos |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M1 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 1 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. |
| Pasos | 1. Login compliance.<br>2. `GET /users`, `/admin/audit-logs`, `/admin/ai-disclosures`. |
| Datos de prueba | compliance |
| Resultado esperado | 403 en los 3. |
| Automatizado en | `test/e2e-real/auth.e2e-real-spec.ts` — `Rol COMPLIANCE › compliance recibe 403 en endpoint admin ajeno GET <ruta>` (it.each) |

### CP-BE-AUTH-038 — Un cliente no accede a la auditoría de consentimientos

| Campo | Contenido |
|---|---|
| ID | CP-BE-AUTH-038 |
| Título | Un cliente no accede a la auditoría de consentimientos |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M1 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 1 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. |
| Pasos | 1. Login cliente_a.<br>2. `GET /admin/legal/consents`. |
| Datos de prueba | cliente_a |
| Resultado esperado | 403. |
| Automatizado en | `test/e2e-real/auth.e2e-real-spec.ts` — `Rol COMPLIANCE › cliente_a no accede a la auditoría de consentimientos (403)` |


## Contrato de error (transversal)

Forma esperada: `{success:false, error:{code, message, error, timestamp, path}}` para 4xx.

### CP-BE-ERR-001 — Las respuestas 400/401/403/404/409 comparten el envelope de error

| Campo | Contenido |
|---|---|
| ID | CP-BE-ERR-001 |
| Título | Las respuestas 400/401/403/404/409 comparten el envelope de error |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | Contrato de error transversal; M1/M2 del plan maestro |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. |
| Pasos | 1. Provocar cada status: 400 (onboarding con passwords distintas), 401 (`/auth/scope` sin token), 403 (cliente en `/admin/ai-disclosures`), 404 (`/categories/999999`), 409 (onboarding con email existente).<br>2. Verificar `success:false`, `error.code`, `error.message`, `error.timestamp` y `error.path`. |
| Datos de prueba | 5 disparadores |
| Resultado esperado | Todas con `{success:false, error:{code,message,timestamp,path}}` y `code` = status HTTP. |
| Automatizado en | `test/e2e-real/error-contract.e2e-real-spec.ts` — `Contrato de error uniforme › <status> (<caso>): envelope ...` (it.each, CP-BE-ERR-001..005 = un caso por status) |

### CP-BE-ERR-006 — El 429 usa el envelope de error estándar

| Campo | Contenido |
|---|---|
| ID | CP-BE-ERR-006 |
| Título | El 429 usa el envelope de error estándar [DEF DEF-BE-005: caso `it.failing`, hoy el sistema NO cumple el esperado] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P2 |
| Trazabilidad | Contrato de error transversal; M1/M2 del plan maestro; DEF-BE-005 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. |
| Pasos | 1. Con el limiter `auth` saturado, `POST /auth/nonce`. |
| Datos de prueba | ver CP-BE-AUTH-035 |
| Resultado esperado | `{success:false, error:{code:429,...}}`. Hoy: `{error, retryAfter}` sin envelope. |
| Automatizado en | `test/e2e-real/auth-rate-limit.e2e-real-spec.ts` — `M1 Auth - rate limit (multiplicador = 1) › DEF-BE-005: el 429 debe usar el envelope...` |

### CP-BE-ERR-007 — 401/403/404/409 incluyen el nombre HTTP en error.error

| Campo | Contenido |
|---|---|
| ID | CP-BE-ERR-007 |
| Título | 401/403/404/409 incluyen el nombre HTTP en error.error |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P2 |
| Trazabilidad | Contrato de error transversal; M1/M2 del plan maestro |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. |
| Pasos | 1. Mismos disparadores salvo 400.<br>2. Leer `error.error`. |
| Datos de prueba | 4 disparadores |
| Resultado esperado | "Unauthorized", "Forbidden", "Not Found", "Conflict". |
| Automatizado en | `test/e2e-real/error-contract.e2e-real-spec.ts` — `Contrato de error uniforme › <status> (<caso>): error.error con el nombre HTTP` (it.each) |

### CP-BE-ERR-008 — El 400 incluye error.error "Bad Request"

| Campo | Contenido |
|---|---|
| ID | CP-BE-ERR-008 |
| Título | El 400 incluye error.error "Bad Request" [DEF DEF-BE-007: caso `it.failing`, hoy el sistema NO cumple el esperado] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P3 |
| Trazabilidad | Contrato de error transversal; M1/M2 del plan maestro; DEF-BE-007 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. |
| Pasos | 1. Provocar el 400 de onboarding.<br>2. Leer `error.error`. |
| Datos de prueba | passwords distintas |
| Resultado esperado | "Bad Request". Hoy se omite y se agrega un `errors: []` que los demás status no tienen. |
| Automatizado en | `test/e2e-real/error-contract.e2e-real-spec.ts` — `Contrato de error uniforme › DEF-BE-007: el 400 debe incluir error.error ...` |

### CP-BE-ERR-009 — Un body inválido usa el mismo envelope de error

| Campo | Contenido |
|---|---|
| ID | CP-BE-ERR-009 |
| Título | Un body inválido usa el mismo envelope de error [DEF DEF-BE-001: caso `it.failing`, hoy el sistema NO cumple el esperado] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | Contrato de error transversal; M1/M2 del plan maestro; DEF-BE-001 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. |
| Pasos | 1. `POST /onboarding` con `{email:"nope"}`. |
| Datos de prueba | — |
| Resultado esperado | `success:false` y `error.code` = status. Hoy: 500 con `{statusCode,message}` (sin envelope). |
| Automatizado en | `test/e2e-real/error-contract.e2e-real-spec.ts` — `Contrato de error uniforme › DEF-BE-001: un body inválido debe usar el mismo envelope de error` |


## Casos manuales / no automatizados

| Tema | Motivo |
|---|---|
| Expiración real del access token (15 min) en una sesión viva | Requiere esperar o alterar `ACCESS_TOKEN_EXPIRES`; cubierto en refresh con un JWT firmado ya vencido (CP-BE-AUTH-024). |
| Entrega real del email de verificación / recuperación en MailHog | Fuera del alcance de W1 (M11 Notificaciones). |
