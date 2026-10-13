# Informe de ejecución QA — E2E real (smoke) — test/e2e-w1-auth-catalogos

| Campo | Valor |
|---|---|
| Fecha y hora | 2026-10-12 23:57 |
| Repo | TekoApp-Backend |
| Rama | `test/e2e-w1-auth-catalogos` |
| Commit | `18a9273` (árbol con cambios sin commitear) |
| Entorno | compose e2e (docker-compose.e2e.yml, .env.e2e), Node v22.16.0, Docker 29.6.2, build dfc4efb |
| Comando | `pnpm qa:e2e` |
| Ejecutor | agente Claude Code (modelo claude-sonnet-5-5) |

## 1. Resumen

| Suites | Casos | Pasaron | Fallaron | Omitidos | Duración |
|---|---|---|---|---|---|
| 5 (0 con fallo) | 115 | 115 | 0 | 0 | 25.5 s |

## 2. Resultados por caso

| Caso CP | Suite | Caso (it) | Estado |
|---|---|---|---|
| CP-BE-AUTH-035 | `test/e2e-real/auth-rate-limit.e2e-real-spec.ts` | M1 Auth - rate limit (multiplicador = 1) el 6º intento de login tras 5 fallidos -> 429 (incluso con credenciales válidas) | passed |
| CP-BE-ERR-006 | `test/e2e-real/auth-rate-limit.e2e-real-spec.ts` | M1 Auth - rate limit (multiplicador = 1) DEF-BE-005: el 429 debe usar el envelope {success:false,error:{code,message}} (hoy {error,retryAfter}) | passed |
| CP-BE-AUTH-007 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Registro POST /onboarding registra un usuario nuevo (201, PENDING_VERIFICATION) | passed |
| CP-BE-AUTH-008 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Registro POST /onboarding rechaza email duplicado con 409 (USER_ALREADY_EXISTS) | passed |
| CP-BE-AUTH-009 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Registro POST /onboarding rechaza passwords que no coinciden con 400 | passed |
| CP-BE-AUTH-010 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Registro POST /onboarding DEF-BE-001: body inválido debe responder 400/422 (hoy 500) | passed |
| CP-BE-AUTH-011 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Registro POST /onboarding un usuario recién registrado inicia sesión con estado PENDING_VERIFICATION y sin acceso admin | passed |
| CP-BE-AUTH-012 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Login password incorrecta -> 401 | passed |
| CP-BE-AUTH-013 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Login DEF-BE-003: email inexistente debe dar 401 como la password incorrecta (hoy 200 {login:false}) | passed |
| CP-BE-AUTH-014 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Login DEF-BE-001: login con body vacío debe dar 400/422 (hoy 500) | passed |
| CP-BE-AUTH-015 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Login reutilizar un nonce no permite un segundo login | passed |
| CP-BE-AUTH-016 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Login el login emite cookies httpOnly accessToken y refreshToken | passed |
| CP-BE-AUTH-017 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Login el cliente Basic mobile también puede autenticar | passed |
| CP-BE-AUTH-018 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) /auth/scope refleja permisos reales por fixture admin: rol ADMIN y admin:all | passed |
| CP-BE-AUTH-019 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) /auth/scope refleja permisos reales por fixture cliente_a: sin roles ni permisos administrativos | passed |
| CP-BE-AUTH-020 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) /auth/scope refleja permisos reales por fixture compliance: rol COMPLIANCE con permisos legales y sin admin:all | passed |
| CP-BE-AUTH-021 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Refresh token (cookie + Basic Auth) refresh válido devuelve un accessToken utilizable | passed |
| CP-BE-AUTH-022 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Refresh token (cookie + Basic Auth) refresh con cookie basura -> 401 | passed |
| CP-BE-AUTH-023 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Refresh token (cookie + Basic Auth) refresh sin cookie -> 401 | passed |
| CP-BE-AUTH-024 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Refresh token (cookie + Basic Auth) refresh expirado (firmado con la clave real) -> 401 | passed |
| CP-BE-AUTH-025 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Refresh token (cookie + Basic Auth) refresh firmado con otra clave -> 401 | passed |
| CP-BE-AUTH-026 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Refresh token (cookie + Basic Auth) DEF-BE-004: el 401 de refresh debe llamarse "Unauthorized" en error.error (hoy "Internal Server Error") | passed |
| CP-BE-AUTH-027 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Refresh token (cookie + Basic Auth) DEF-BE-006: existe logout que invalide la sesión (hoy POST /auth/logout -> 404) | passed |
| CP-BE-AUTH-028 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Basic Auth inválido o ausente en endpoints pre-login public-key sin Authorization -> 401 | passed |
| CP-BE-AUTH-028 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Basic Auth inválido o ausente en endpoints pre-login nonce sin Authorization -> 401 | passed |
| CP-BE-AUTH-028 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Basic Auth inválido o ausente en endpoints pre-login login sin Authorization -> 401 | passed |
| CP-BE-AUTH-028 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Basic Auth inválido o ausente en endpoints pre-login onboarding sin Authorization -> 401 | passed |
| CP-BE-AUTH-028 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Basic Auth inválido o ausente en endpoints pre-login refresh-token sin Authorization -> 401 | passed |
| CP-BE-AUTH-028 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Basic Auth inválido o ausente en endpoints pre-login forgot-password sin Authorization -> 401 | passed |
| CP-BE-AUTH-028 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Basic Auth inválido o ausente en endpoints pre-login create-password sin Authorization -> 401 | passed |
| CP-BE-AUTH-028 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Basic Auth inválido o ausente en endpoints pre-login change-expired-password sin Authorization -> 401 | passed |
| CP-BE-AUTH-029 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Basic Auth inválido o ausente en endpoints pre-login public-key con secret incorrecto -> 401 | passed |
| CP-BE-AUTH-029 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Basic Auth inválido o ausente en endpoints pre-login nonce con secret incorrecto -> 401 | passed |
| CP-BE-AUTH-029 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Basic Auth inválido o ausente en endpoints pre-login login con secret incorrecto -> 401 | passed |
| CP-BE-AUTH-029 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Basic Auth inválido o ausente en endpoints pre-login onboarding con secret incorrecto -> 401 | passed |
| CP-BE-AUTH-029 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Basic Auth inválido o ausente en endpoints pre-login refresh-token con secret incorrecto -> 401 | passed |
| CP-BE-AUTH-029 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Basic Auth inválido o ausente en endpoints pre-login forgot-password con secret incorrecto -> 401 | passed |
| CP-BE-AUTH-029 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Basic Auth inválido o ausente en endpoints pre-login create-password con secret incorrecto -> 401 | passed |
| CP-BE-AUTH-029 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Basic Auth inválido o ausente en endpoints pre-login change-expired-password con secret incorrecto -> 401 | passed |
| CP-BE-AUTH-030 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Basic Auth inválido o ausente en endpoints pre-login public-key con clientId inexistente -> 401 | passed |
| CP-BE-AUTH-030 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Basic Auth inválido o ausente en endpoints pre-login nonce con clientId inexistente -> 401 | passed |
| CP-BE-AUTH-030 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Basic Auth inválido o ausente en endpoints pre-login login con clientId inexistente -> 401 | passed |
| CP-BE-AUTH-030 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Basic Auth inválido o ausente en endpoints pre-login onboarding con clientId inexistente -> 401 | passed |
| CP-BE-AUTH-030 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Basic Auth inválido o ausente en endpoints pre-login refresh-token con clientId inexistente -> 401 | passed |
| CP-BE-AUTH-030 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Basic Auth inválido o ausente en endpoints pre-login forgot-password con clientId inexistente -> 401 | passed |
| CP-BE-AUTH-030 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Basic Auth inválido o ausente en endpoints pre-login create-password con clientId inexistente -> 401 | passed |
| CP-BE-AUTH-030 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Basic Auth inválido o ausente en endpoints pre-login change-expired-password con clientId inexistente -> 401 | passed |
| CP-BE-AUTH-031 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Basic Auth inválido o ausente en endpoints pre-login Authorization con formato Bearer en un endpoint Basic -> 401 | passed |
| CP-BE-AUTH-032 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Guards de autorización cliente_a: GET /admin/ai-disclosures -> 403 | passed |
| CP-BE-AUTH-032 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Guards de autorización cliente_a: GET /admin/audit-logs -> 403 | passed |
| CP-BE-AUTH-032 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Guards de autorización cliente_a: GET /users -> 403 | passed |
| CP-BE-AUTH-032 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Guards de autorización cliente_a: GET /admin/legal/document-versions -> 403 | passed |
| CP-BE-AUTH-032 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Guards de autorización cliente_a: POST /professionals/1/verify -> 403 | passed |
| CP-BE-AUTH-032 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Guards de autorización cliente_a: POST /professionals/1/suspend -> 403 | passed |
| CP-BE-AUTH-033 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Guards de autorización pro_aprobado sin permiso no puede verify/suspend de professionals (403) | passed |
| CP-BE-AUTH-033 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Guards de autorización compliance sin permiso no puede verify/suspend de professionals (403) | passed |
| CP-BE-AUTH-034 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Guards de autorización token ausente, malformado o de otra clave -> 401 en endpoint protegido | passed |
| CP-BE-AUTH-036 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Rol COMPLIANCE compliance accede a GET /admin/legal/consents (200) | passed |
| CP-BE-AUTH-036 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Rol COMPLIANCE compliance accede a GET /admin/legal/content-consents (200) | passed |
| CP-BE-AUTH-036 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Rol COMPLIANCE compliance accede a GET /admin/legal/document-versions (200) | passed |
| CP-BE-AUTH-036 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Rol COMPLIANCE compliance accede a GET /admin/legal/retention-policies (200) | passed |
| CP-BE-AUTH-037 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Rol COMPLIANCE compliance recibe 403 en endpoint admin ajeno GET /users | passed |
| CP-BE-AUTH-037 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Rol COMPLIANCE compliance recibe 403 en endpoint admin ajeno GET /admin/audit-logs | passed |
| CP-BE-AUTH-037 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Rol COMPLIANCE compliance recibe 403 en endpoint admin ajeno GET /admin/ai-disclosures | passed |
| CP-BE-AUTH-038 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Rol COMPLIANCE cliente_a no accede a la auditoría de consentimientos (403) | passed |
| CP-BE-CAT-001 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) Categorías admin crea una categoría y aparece en el listado público (sin token) | passed |
| CP-BE-CAT-002 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) Categorías una categoría oculta (isVisible=false) no aparece en listados públicos ni por slug | passed |
| CP-BE-CAT-003 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) Categorías toggle-visibility oculta y vuelve a mostrar la categoría | passed |
| CP-BE-CAT-004 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) Categorías una categoría INACTIVE no aparece en el listado público | passed |
| CP-BE-CAT-005 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) Categorías admin actualiza una categoría (PATCH) y el cambio se refleja | passed |
| CP-BE-CAT-006 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) Categorías nombre duplicado -> 409 | passed |
| CP-BE-CAT-007 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) Categorías admin elimina una categoría sin relaciones: 204 y luego 404 | passed |
| CP-BE-CAT-008 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) Categorías subcategoría: se crea bajo un padre y aparece en /subcategories/:parentId; 3er nivel -> 400 | passed |
| CP-BE-CAT-009 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) Categorías mutaciones sin token -> 401; id inexistente -> 404 | passed |
| CP-BE-CAT-010 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) Categorías cliente sin permiso admin (403 esperado) DEF-BE-002: cliente_a NO debe poder crear una categoría (hoy 201) | passed |
| CP-BE-CAT-011 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) Categorías cliente sin permiso admin (403 esperado) DEF-BE-002: cliente_a NO debe poder editar una categoría (hoy 200) | passed |
| CP-BE-CAT-012 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) Categorías cliente sin permiso admin (403 esperado) DEF-BE-002: cliente_a NO debe poder ocultar una categoría (hoy 200) | passed |
| CP-BE-CAT-013 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) Categorías cliente sin permiso admin (403 esperado) DEF-BE-002: cliente_a NO debe poder cambiar el estado de una categoría (hoy 200) | passed |
| CP-BE-CAT-014 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) Categorías cliente sin permiso admin (403 esperado) DEF-BE-002: cliente_a NO debe poder borrar una categoría (hoy 204) | passed |
| CP-BE-CAT-015 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) Categorías DEF-BE-001: GET /categories/abc debe dar 400/422 (hoy 500 por el exceptionFactory del ValidationPipe) | passed |
| CP-BE-CAT-016 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) Categorías DEF-BE-008: GET /categories/:id de una categoría oculta debe dar 404 como slug/listados (hoy 200) | passed |
| CP-BE-CAT-017 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) Service types GET /service-types es público y devuelve solo tipos activos del seed | passed |
| CP-BE-CAT-018 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) Países, monedas e idiomas (públicos, sin guard) GET /countries (sin token) lista Paraguay con paginación | passed |
| CP-BE-CAT-019 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) Países, monedas e idiomas (públicos, sin guard) GET /countries/:id existente 200; inexistente 404 | passed |
| CP-BE-CAT-020 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) Países, monedas e idiomas (públicos, sin guard) GET /currencies (sin token) incluye PYG sin decimales; /currencies/PYG 200; /ZZZ 404 | passed |
| CP-BE-CAT-021 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) Países, monedas e idiomas (públicos, sin guard) GET /languages (sin token) incluye es y en; /languages/:id 200 y 404 | passed |
| CP-BE-CAT-022 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) ProfessionalDocumentTypes admin crea un tipo y un usuario autenticado lo ve en el listado | passed |
| CP-BE-CAT-023 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) ProfessionalDocumentTypes admin actualiza y desactiva un tipo (PATCH): deja de listarse | passed |
| CP-BE-CAT-024 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) ProfessionalDocumentTypes cliente_a recibe 403 al crear/editar; sin token 401; referenceId inexistente 404 | passed |
| CP-BE-CAT-025 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) ProfessionalDocumentTypes DEF-BE-010: código de tipo de documento duplicado debe dar 409 (hoy 500: el P2002 de Prisma no se mapea) | passed |
| CP-BE-CAT-026 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) ProfessionalDocumentTypes DEF-BE-001: body inválido en alta de tipo de documento debe dar 400/422 (hoy 500) | passed |
| CP-BE-CAT-027 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) TaxConfig / TipConfig sin fila -> fallback seguro GET /tax/config sin fila: impuesto deshabilitado, tasa 0 | passed |
| CP-BE-CAT-028 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) TaxConfig / TipConfig sin fila -> fallback seguro GET /tips/config sin fila: propinas habilitadas con 10/15/20, no obligatoria | passed |
| CP-BE-CAT-029 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) TaxConfig / TipConfig sin fila -> fallback seguro con una fila activa, /tax/config refleja la fila (y no el fallback) | passed |
| CP-BE-CAT-030 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) TaxConfig / TipConfig sin fila -> fallback seguro tax/tips config exigen autenticación (401 sin token) | passed |
| CP-BE-CAT-031 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) Paginación: pageSize enorme DEF-BE-009: GET /countries?pageSize=100000 debe acotarse (<=100) o dar 400/422 (hoy se acepta tal cual) | passed |
| CP-BE-CAT-032 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) Paginación: pageSize enorme DEF-BE-009: GET /users?pageSize=100000 (admin) debe acotarse (<=100) o dar 400/422 (hoy se acepta tal cual) | passed |
| CP-BE-CAT-033 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) Paginación: pageSize enorme DEF-BE-001: pageSize inválido (-1 / abc) debe dar 400/422 (hoy 500) | passed |
| CP-BE-ERR-001 | `test/e2e-real/error-contract.e2e-real-spec.ts` | Contrato de error uniforme (e2e real) 400 (onboarding con passwords distintas): envelope {success:false, error:{code,message,timestamp,path}} | passed |
| CP-BE-ERR-001 | `test/e2e-real/error-contract.e2e-real-spec.ts` | Contrato de error uniforme (e2e real) 401 (endpoint protegido sin token): envelope {success:false, error:{code,message,timestamp,path}} | passed |
| CP-BE-ERR-001 | `test/e2e-real/error-contract.e2e-real-spec.ts` | Contrato de error uniforme (e2e real) 403 (cliente en endpoint admin): envelope {success:false, error:{code,message,timestamp,path}} | passed |
| CP-BE-ERR-001 | `test/e2e-real/error-contract.e2e-real-spec.ts` | Contrato de error uniforme (e2e real) 404 (categoría inexistente): envelope {success:false, error:{code,message,timestamp,path}} | passed |
| CP-BE-ERR-001 | `test/e2e-real/error-contract.e2e-real-spec.ts` | Contrato de error uniforme (e2e real) 409 (onboarding con email duplicado): envelope {success:false, error:{code,message,timestamp,path}} | passed |
| CP-BE-ERR-007 | `test/e2e-real/error-contract.e2e-real-spec.ts` | Contrato de error uniforme (e2e real) 401 (endpoint protegido sin token): error.error con el nombre HTTP | passed |
| CP-BE-ERR-007 | `test/e2e-real/error-contract.e2e-real-spec.ts` | Contrato de error uniforme (e2e real) 403 (cliente en endpoint admin): error.error con el nombre HTTP | passed |
| CP-BE-ERR-007 | `test/e2e-real/error-contract.e2e-real-spec.ts` | Contrato de error uniforme (e2e real) 404 (categoría inexistente): error.error con el nombre HTTP | passed |
| CP-BE-ERR-007 | `test/e2e-real/error-contract.e2e-real-spec.ts` | Contrato de error uniforme (e2e real) 409 (onboarding con email duplicado): error.error con el nombre HTTP | passed |
| CP-BE-ERR-008 | `test/e2e-real/error-contract.e2e-real-spec.ts` | Contrato de error uniforme (e2e real) DEF-BE-007: el 400 debe incluir error.error "Bad Request" como el resto (hoy lo omite y agrega errors[]) | passed |
| CP-BE-ERR-009 | `test/e2e-real/error-contract.e2e-real-spec.ts` | Contrato de error uniforme (e2e real) DEF-BE-001: un body inválido debe usar el mismo envelope de error (hoy 500 {statusCode,message}) | passed |
| CP-BE-AUTH-001 | `test/e2e-real/smoke.e2e-real-spec.ts` | Smoke E2E real healthcheck (version-neutral): Postgres, Mongo y Redis reales en up | passed |
| CP-BE-AUTH-002 | `test/e2e-real/smoke.e2e-real-spec.ts` | Smoke E2E real GET /auth/public-key devuelve el PEM publico generado para el E2E | passed |
| CP-BE-AUTH-003 | `test/e2e-real/smoke.e2e-real-spec.ts` | Smoke E2E real Basic Auth invalido -> 401 | passed |
| CP-BE-AUTH-004 | `test/e2e-real/smoke.e2e-real-spec.ts` | Smoke E2E real nonce + RSA -> login admin -> /auth/scope | passed |
| CP-BE-AUTH-005 | `test/e2e-real/smoke.e2e-real-spec.ts` | Smoke E2E real endpoint protegido sin token -> 401 | passed |
| CP-BE-AUTH-006 | `test/e2e-real/smoke.e2e-real-spec.ts` | Smoke E2E real usuario sin permiso -> 403 en endpoint de staff | passed |

### Casos fallidos u omitidos

Ninguno.

## 3. Defectos encontrados

| ID | Severidad | Caso que lo detectó | Repro | Estado |
|---|---|---|---|---|
| DEF-BE-001 | Alta | CP-BE-AUTH-010, 014; CP-BE-CAT-015, 026, 033; CP-BE-ERR-009 | `POST /onboarding` con `{"email":"nope"}` (también `POST /auth/login` con `{}`, `GET /categories/abc`, `GET /countries?pageSize=-1`): responde **500** `{statusCode,message}` en vez de 400/422 con envelope. Causa: el `exceptionFactory` de `ValidationConfig` devuelve un objeto plano, no una `HttpException`. Toda validación de DTO del API cae en 500 y se reporta como error interno. | Abierto (`it.failing`) |
| DEF-BE-002 | Crítica | CP-BE-CAT-010..014 | Login `cliente_a` y `POST/PATCH/DELETE /categories`, `PATCH /categories/:id/toggle-visibility` y `/status`: 201/200/204. Los endpoints de categorías solo usan `JwtAuthGuard` (sin `PermissionsGuard`/`@Permissions`): cualquier usuario autenticado crea, edita, oculta y borra el catálogo. | Abierto (`it.failing`) |
| DEF-BE-003 | Media | CP-BE-AUTH-013 | Login RSA con un email inexistente: **200** `{login:false}`; con password incorrecta: 401. Respuesta distinta y 200 para un login fallido (enumeración de usuarios; los clientes deben mirar `login`). | Abierto (`it.failing`) |
| DEF-BE-004 | Baja | CP-BE-AUTH-026 | `POST /auth/refresh-token` sin cookie o con cookie inválida: 401 con `error.error:"Internal Server Error"` y `message:"Unauthorized"` (sin localizar). | Abierto (`it.failing`) |
| DEF-BE-005 | Baja | CP-BE-ERR-006 | 6º intento fallido de login: 429 con cuerpo `{error,retryAfter}` sin envelope `{success:false,error:{code,...}}`. | Abierto (`it.failing`) |
| DEF-BE-006 | Media | CP-BE-AUTH-027 | `POST /auth/logout` -> 404: no existe logout ni revocación server-side; el refresh token sigue válido hasta su expiración. | Abierto (`it.failing`) |
| DEF-BE-007 | Baja | CP-BE-ERR-008 | El 400 (`ValidationExceptionFilter`) no incluye `error.error:"Bad Request"` y agrega `errors:[]`, a diferencia de 401/403/404/409. | Abierto (`it.failing`) |
| DEF-BE-008 | Baja | CP-BE-CAT-016 | `GET /categories/:id` de una categoría con `isVisible=false` devuelve 200, mientras listados y `/slug/:slug` la ocultan (404). | Abierto (`it.failing`) |
| DEF-BE-009 | Media | CP-BE-CAT-031, 032 | `GET /countries?pageSize=100000` y `GET /users?pageSize=100000` (admin): 200 con `pagination.pageSize=100000`; sin tope máximo. | Abierto (`it.failing`) |
| DEF-BE-010 | Media | CP-BE-CAT-025 | Alta de tipo de documento con `code` duplicado: **500** (violación de unicidad P2002 sin mapear a 409; el `PrismaClientExceptionFilter` no está registrado como filtro global). | Abierto (`it.failing`) |

Total: 20 casos `it.failing` (defectos esperados) sobre 10 defectos distintos. Ninguno se corrigió en esta rama (alcance: solo pruebas).

## 4. Desvíos y observaciones

- **Sin fallos reales ni flakies:** la suite completa (5 suites, 115 casos, 0 omitidos) pasó 3 veces seguidas con `pnpm test:e2e:real` y una cuarta vía `pnpm qa:e2e` (esta ejecución). Los 20 `it.failing` cuentan como esperados: al corregir cada DEF el test se pondrá en rojo y habrá que quitar `.failing`.
- **Rate limit:** `auth-rate-limit.e2e-real-spec.ts` fuerza `RATE_LIMIT_MULTIPLIER=1` en el proceso de Jest (la app se crea tras el override) y limpia las claves `rl:*` de Redis antes y después; el resto de los specs corre con multiplicador 1000 del `.env.e2e`. Se usa Basic Auth inválido para consumir el cupo sin bloquear cuentas fixture (el login con password errónea bloquea tras más de 3 intentos).
- **Comportamiento observado y documentado (no defecto):** un usuario recién registrado (PENDING_VERIFICATION) obtiene sesión (CP-BE-AUTH-011); `DELETE /categories/:id` es baja lógica (404 posterior).
- **PlatformCommissionConfig:** ningún endpoint la expone; documentado en `casos/CP-CAT.md` (se valida en M6 y en `fee-calculator.service.spec.ts`). TaxConfig/TipConfig: el spec respalda y restaura las filas.
- **Entorno:** `/healthcheck` puede dar 503 solo por `storage_disk` (umbral de disco del host), ya contemplado en el smoke. `pnpm e2e:serve` verificado a mano en el puerto 3100 (swagger-json 200, escucha en 0.0.0.0/[::]); el primer arranque con ts-node tarda ~1-2 min.
- **Unitarias:** no se tocó `src/`; `pnpm test` (138 suites, 1549 tests), `pnpm lint` y `pnpm check:types` en verde; no se regeneró el informe `qa:unit`.
- La marca "árbol con cambios sin commitear" del encabezado se debe a que este mismo informe aún no estaba commiteado; el código ejecutado es el de `18a9273`.

## 5. Evidencia

- Specs: `test/e2e-real/{auth,auth-rate-limit,catalogos,error-contract,smoke}.e2e-real-spec.ts` y `test/e2e-real/helpers/e2e-app.ts`; casos en `test/qa/casos/CP-AUTH.md` y `CP-CAT.md`.
- Salida JSON de jest en `coverage/jest-e2e.json` (ignorado por git).

## 6. Veredicto

**APROBADO CON OBSERVACIONES.** Criterio: todos los casos ejecutados pasan (115/115, estable en 3 corridas consecutivas más la de `qa:e2e`) y los comportamientos esperados incumplidos están registrados como defectos. Observaciones que bloquean la salida a producción de los módulos afectados hasta corregirse: DEF-BE-002 (Crítica: cualquier usuario autenticado administra categorías) y DEF-BE-001 (Alta: toda validación de DTO responde 500). El resto (Media/Baja) se planifica en el backlog.
