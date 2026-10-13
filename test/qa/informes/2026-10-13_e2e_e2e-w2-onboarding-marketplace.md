# Informe de ejecución QA — E2E real (smoke) — test/e2e-w2-onboarding-marketplace

| Campo | Valor |
|---|---|
| Fecha y hora | 2026-10-13 07:35 |
| Repo | TekoApp-Backend |
| Rama | `test/e2e-w2-onboarding-marketplace` |
| Commit | `4cc9975` (árbol con cambios sin commitear) |
| Entorno | compose e2e (docker-compose.e2e.yml, .env.e2e), Node v22.16.0, Docker 29.6.2, build dfc4efb |
| Comando | `pnpm qa:e2e` |
| Ejecutor | agente Claude Code (modelo claude-sonnet-5-5) |

## 1. Resumen

| Suites | Casos | Pasaron | Fallaron | Omitidos | Duración |
|---|---|---|---|---|---|
| 7 (0 con fallo) | 193 | 193 | 0 | 0 | 1 min 4 s |

## 2. Resultados por caso

| Caso CP | Suite | Caso (it) | Estado |
|---|---|---|---|
| CP-BE-AUTH-035 | `test/e2e-real/auth-rate-limit.e2e-real-spec.ts` | M1 Auth - rate limit (multiplicador = 1) el 6º intento de login tras 5 fallidos -> 429 (incluso con credenciales válidas) | passed |
| CP-BE-ERR-006 | `test/e2e-real/auth-rate-limit.e2e-real-spec.ts` | M1 Auth - rate limit (multiplicador = 1) DEF-BE-005: el 429 debe usar el envelope {success:false,error:{code,message}} | passed |
| CP-BE-AUTH-007 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Registro POST /onboarding registra un usuario nuevo (201, PENDING_VERIFICATION) | passed |
| CP-BE-AUTH-008 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Registro POST /onboarding rechaza email duplicado con 409 (USER_ALREADY_EXISTS) | passed |
| CP-BE-AUTH-009 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Registro POST /onboarding rechaza passwords que no coinciden con 400 | passed |
| CP-BE-AUTH-010 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Registro POST /onboarding DEF-BE-001: body inválido debe responder 400/422 | passed |
| CP-BE-AUTH-011 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Registro POST /onboarding un usuario recién registrado inicia sesión con estado PENDING_VERIFICATION y sin acceso admin | passed |
| CP-BE-AUTH-012 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Login password incorrecta -> 401 | passed |
| CP-BE-AUTH-013 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Login DEF-BE-003: email inexistente debe dar 401 como la password incorrecta | passed |
| CP-BE-AUTH-014 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Login DEF-BE-001: login con body vacío debe dar 400/422 | passed |
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
| CP-BE-AUTH-026 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Refresh token (cookie + Basic Auth) DEF-BE-004: el 401 de refresh debe llamarse "Unauthorized" en error.error | passed |
| CP-BE-AUTH-027 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Refresh token (cookie + Basic Auth) DEF-BE-006: logout revoca el refresh; refresh posterior -> 401 en envelope uniforme | passed |
| CP-BE-AUTH-036 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Refresh token (cookie + Basic Auth) DEF-BE-006: un segundo logout con el mismo refresh es idempotente (204) | passed |
| CP-BE-AUTH-037 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Refresh token (cookie + Basic Auth) DEF-BE-006: logout solo revoca ese refresh; otra sesión del mismo usuario sigue válida | passed |
| CP-BE-AUTH-038 | `test/e2e-real/auth.e2e-real-spec.ts` | M1 Auth y sesión (e2e real) Refresh token (cookie + Basic Auth) DEF-BE-006: logout sin cookie, con cookie basura o sin Basic Auth -> 401 | passed |
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
| CP-BE-CAT-010 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) Categorías cliente sin permiso admin (403 esperado) DEF-BE-002: cliente_a NO debe poder crear una categoría | passed |
| CP-BE-CAT-011 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) Categorías cliente sin permiso admin (403 esperado) DEF-BE-002: cliente_a NO debe poder editar una categoría | passed |
| CP-BE-CAT-012 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) Categorías cliente sin permiso admin (403 esperado) DEF-BE-002: cliente_a NO debe poder ocultar una categoría | passed |
| CP-BE-CAT-013 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) Categorías cliente sin permiso admin (403 esperado) DEF-BE-002: cliente_a NO debe poder cambiar el estado de una categoría | passed |
| CP-BE-CAT-014 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) Categorías cliente sin permiso admin (403 esperado) DEF-BE-002: cliente_a NO debe poder borrar una categoría | passed |
| CP-BE-CAT-015 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) Categorías DEF-BE-001: GET /categories/abc debe dar 400/422 | passed |
| CP-BE-CAT-016 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) Categorías DEF-BE-008: GET /categories/:id de una categoría oculta debe dar 404 como slug/listados | passed |
| CP-BE-CAT-016 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) Categorías DEF-BE-008: el admin sí ve la categoría oculta o inactiva por id; la visible la ve cualquiera | passed |
| CP-BE-CAT-017 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) Service types GET /service-types es público y devuelve solo tipos activos del seed | passed |
| CP-BE-CAT-018 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) Países, monedas e idiomas (públicos, sin guard) GET /countries (sin token) lista Paraguay con paginación | passed |
| CP-BE-CAT-019 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) Países, monedas e idiomas (públicos, sin guard) GET /countries/:id existente 200; inexistente 404 | passed |
| CP-BE-CAT-020 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) Países, monedas e idiomas (públicos, sin guard) GET /currencies (sin token) incluye PYG sin decimales; /currencies/PYG 200; /ZZZ 404 | passed |
| CP-BE-CAT-021 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) Países, monedas e idiomas (públicos, sin guard) GET /languages (sin token) incluye es y en; /languages/:id 200 y 404 | passed |
| CP-BE-CAT-022 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) ProfessionalDocumentTypes admin crea un tipo y un usuario autenticado lo ve en el listado | passed |
| CP-BE-CAT-023 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) ProfessionalDocumentTypes admin actualiza y desactiva un tipo (PATCH): deja de listarse | passed |
| CP-BE-CAT-024 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) ProfessionalDocumentTypes cliente_a recibe 403 al crear/editar; sin token 401; referenceId inexistente 404 | passed |
| CP-BE-CAT-025 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) ProfessionalDocumentTypes DEF-BE-010: código de tipo de documento duplicado debe dar 409 | passed |
| CP-BE-CAT-026 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) ProfessionalDocumentTypes DEF-BE-001: body inválido en alta de tipo de documento debe dar 400/422 | passed |
| CP-BE-CAT-027 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) TaxConfig / TipConfig sin fila -> fallback seguro GET /tax/config sin fila: impuesto deshabilitado, tasa 0 | passed |
| CP-BE-CAT-028 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) TaxConfig / TipConfig sin fila -> fallback seguro GET /tips/config sin fila: propinas habilitadas con 10/15/20, no obligatoria | passed |
| CP-BE-CAT-029 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) TaxConfig / TipConfig sin fila -> fallback seguro con una fila activa, /tax/config refleja la fila (y no el fallback) | passed |
| CP-BE-CAT-030 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) TaxConfig / TipConfig sin fila -> fallback seguro tax/tips config exigen autenticación (401 sin token) | passed |
| CP-BE-CAT-031 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) Paginación: pageSize enorme DEF-BE-009: GET /countries?pageSize=100000 debe dar 400 (tope 100) | passed |
| CP-BE-CAT-032 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) Paginación: pageSize enorme DEF-BE-009: GET /users?pageSize=100000 (admin) debe dar 400 (tope 100) | passed |
| CP-BE-CAT-033 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) Paginación: pageSize enorme DEF-BE-001: pageSize inválido (-1 / abc) debe dar 400/422 | passed |
| CP-BE-CAT-034 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) Categorías: paginación admin y nombre vacío DEF-BE-012: GET /categories/all respeta page/pageSize y devuelve {data, pagination} | passed |
| CP-BE-CAT-035 | `test/e2e-real/catalogos.e2e-real-spec.ts` | M2 Catálogos (e2e real) Categorías: paginación admin y nombre vacío DEF-BE-013: POST /categories con name vacío o solo espacios -> 400 | passed |
| CP-BE-ERR-001 | `test/e2e-real/error-contract.e2e-real-spec.ts` | Contrato de error uniforme (e2e real) 400 (onboarding con passwords distintas): envelope {success:false, error:{code,message,timestamp,path}} | passed |
| CP-BE-ERR-001 | `test/e2e-real/error-contract.e2e-real-spec.ts` | Contrato de error uniforme (e2e real) 401 (endpoint protegido sin token): envelope {success:false, error:{code,message,timestamp,path}} | passed |
| CP-BE-ERR-001 | `test/e2e-real/error-contract.e2e-real-spec.ts` | Contrato de error uniforme (e2e real) 403 (cliente en endpoint admin): envelope {success:false, error:{code,message,timestamp,path}} | passed |
| CP-BE-ERR-001 | `test/e2e-real/error-contract.e2e-real-spec.ts` | Contrato de error uniforme (e2e real) 404 (categoría inexistente): envelope {success:false, error:{code,message,timestamp,path}} | passed |
| CP-BE-ERR-001 | `test/e2e-real/error-contract.e2e-real-spec.ts` | Contrato de error uniforme (e2e real) 409 (onboarding con email duplicado): envelope {success:false, error:{code,message,timestamp,path}} | passed |
| CP-BE-ERR-007 | `test/e2e-real/error-contract.e2e-real-spec.ts` | Contrato de error uniforme (e2e real) 401 (endpoint protegido sin token): error.error con el nombre HTTP | passed |
| CP-BE-ERR-007 | `test/e2e-real/error-contract.e2e-real-spec.ts` | Contrato de error uniforme (e2e real) 403 (cliente en endpoint admin): error.error con el nombre HTTP | passed |
| CP-BE-ERR-007 | `test/e2e-real/error-contract.e2e-real-spec.ts` | Contrato de error uniforme (e2e real) 404 (categoría inexistente): error.error con el nombre HTTP | passed |
| CP-BE-ERR-007 | `test/e2e-real/error-contract.e2e-real-spec.ts` | Contrato de error uniforme (e2e real) 409 (onboarding con email duplicado): error.error con el nombre HTTP | passed |
| CP-BE-ERR-008 | `test/e2e-real/error-contract.e2e-real-spec.ts` | Contrato de error uniforme (e2e real) DEF-BE-007: el 400 debe incluir error.error "Bad Request" como el resto | passed |
| CP-BE-ERR-009 | `test/e2e-real/error-contract.e2e-real-spec.ts` | Contrato de error uniforme (e2e real) DEF-BE-001: un body inválido debe usar el mismo envelope de error | passed |
| CP-BE-MKT-001 | `test/e2e-real/marketplace.e2e-real-spec.ts` | M4 Marketplace (e2e real) Ciclo de vida feliz el cliente publica una solicitud: queda PENDING, sin profesional, con UUID público | passed |
| CP-BE-MKT-002 | `test/e2e-real/marketplace.e2e-real-spec.ts` | M4 Marketplace (e2e real) Ciclo de vida feliz oferta del profesional -> el cliente la acepta -> ACCEPTED con el profesional asignado y la oferta ACCEPTED | passed |
| CP-BE-MKT-003 | `test/e2e-real/marketplace.e2e-real-spec.ts` | M4 Marketplace (e2e real) Ciclo de vida feliz start (IN_PROGRESS) y complete (COMPLETED) por el profesional asignado, con startedAt/completedAt y finalAmount | passed |
| CP-BE-MKT-004 | `test/e2e-real/marketplace.e2e-real-spec.ts` | M4 Marketplace (e2e real) Ciclo de vida feliz aceptación directa del profesional (POST /services/:id/accept) deja ACCEPTED con él asignado | passed |
| CP-BE-MKT-005 | `test/e2e-real/marketplace.e2e-real-spec.ts` | M4 Marketplace (e2e real) Ciclo de vida feliz rechazar una oferta la deja REJECTED y el servicio sigue PENDING y abierto a otras ofertas | passed |
| CP-BE-MKT-006 | `test/e2e-real/marketplace.e2e-real-spec.ts` | M4 Marketplace (e2e real) Ciclo de vida feliz al aceptar una oferta, las demás ofertas pendientes pasan a REJECTED | passed |
| CP-BE-MKT-007 | `test/e2e-real/marketplace.e2e-real-spec.ts` | M4 Marketplace (e2e real) Ciclo de vida feliz el profesional ve el servicio asignado en my-services?role=professional y el cliente en role=client | passed |
| CP-BE-MKT-008 | `test/e2e-real/marketplace.e2e-real-spec.ts` | M4 Marketplace (e2e real) Cancelación el cliente cancela un servicio PENDING: CANCELLED con motivo y cancelledAt | passed |
| CP-BE-MKT-009 | `test/e2e-real/marketplace.e2e-real-spec.ts` | M4 Marketplace (e2e real) Cancelación el cliente y el profesional asignado pueden cancelar un servicio ACCEPTED | passed |
| CP-BE-MKT-010 | `test/e2e-real/marketplace.e2e-real-spec.ts` | M4 Marketplace (e2e real) Cancelación cancelar sin motivo -> 400; un tercero (cliente_b, otro profesional) -> 403 y el servicio no cambia | passed |
| CP-BE-MKT-011 | `test/e2e-real/marketplace.e2e-real-spec.ts` | M4 Marketplace (e2e real) Cancelación DEF-BE-019: no se puede cancelar un servicio IN_PROGRESS, COMPLETED ni CANCELLED: 409 con envelope uniforme | passed |
| CP-BE-MKT-012 | `test/e2e-real/marketplace.e2e-real-spec.ts` | M4 Marketplace (e2e real) Transiciones inválidas DEF-BE-019: completar sin iniciar -> 409 con envelope uniforme | passed |
| CP-BE-MKT-013 | `test/e2e-real/marketplace.e2e-real-spec.ts` | M4 Marketplace (e2e real) Transiciones inválidas DEF-BE-019: iniciar un servicio ya iniciado, o aceptar uno no PENDING -> 409 | passed |
| CP-BE-MKT-014 | `test/e2e-real/marketplace.e2e-real-spec.ts` | M4 Marketplace (e2e real) Transiciones inválidas iniciar un servicio PENDING (sin profesional asignado) -> 403/409, nunca avanza | passed |
| CP-BE-MKT-015 | `test/e2e-real/marketplace.e2e-real-spec.ts` | M4 Marketplace (e2e real) Transiciones inválidas DEF-BE-019: enviar una oferta a un servicio que ya no está PENDING -> 409 | passed |
| CP-BE-MKT-016 | `test/e2e-real/marketplace.e2e-real-spec.ts` | M4 Marketplace (e2e real) Transiciones inválidas DEF-BE-019: la oferta duplicada del mismo profesional -> 409 | passed |
| CP-BE-MKT-017 | `test/e2e-real/marketplace.e2e-real-spec.ts` | M4 Marketplace (e2e real) Transiciones inválidas DEF-BE-020: una oferta ya aceptada no se puede rechazar después (la oferta y el servicio no quedan incoherentes) | passed |
| CP-BE-MKT-018 | `test/e2e-real/marketplace.e2e-real-spec.ts` | M4 Marketplace (e2e real) Transiciones inválidas responder una oferta con un estado distinto de ACCEPTED/REJECTED -> 400 y no la modifica | passed |
| CP-BE-MKT-019 | `test/e2e-real/marketplace.e2e-real-spec.ts` | M4 Marketplace (e2e real) Transiciones inválidas DEF-BE-019: PUT /services/:id: el dueño edita en PENDING; fuera de PENDING/ACCEPTED -> 409 | passed |
| CP-BE-MKT-020 | `test/e2e-real/marketplace.e2e-real-spec.ts` | M4 Marketplace (e2e real) Transiciones inválidas ids inexistentes o mal formados -> 404 / 400 con envelope uniforme | passed |
| CP-BE-MKT-021 | `test/e2e-real/marketplace.e2e-real-spec.ts` | M4 Marketplace (e2e real) Transiciones inválidas crear una solicitud con datos inválidos (sin título, coordenadas fuera de rango, categoría inexistente) -> 400/404 | passed |
| CP-BE-MKT-022 | `test/e2e-real/marketplace.e2e-real-spec.ts` | M4 Marketplace (e2e real) Concurrencia: exactamente un ganador, el otro recibe 409 (x20) dos profesionales aceptan el mismo servicio en paralelo: 20/20 con un solo 2xx y un 409 | passed |
| CP-BE-MKT-023 | `test/e2e-real/marketplace.e2e-real-spec.ts` | M4 Marketplace (e2e real) Concurrencia: exactamente un ganador, el otro recibe 409 (x20) el mismo profesional acepta dos veces en paralelo: 20/20 con un solo 2xx y un 409 | passed |
| CP-BE-MKT-024 | `test/e2e-real/marketplace.e2e-real-spec.ts` | M4 Marketplace (e2e real) Concurrencia: exactamente un ganador, el otro recibe 409 (x20) el cliente acepta dos ofertas distintas en paralelo: 20/20 con un solo 200 y un 409, y una sola oferta ACCEPTED | passed |
| CP-BE-MKT-025 | `test/e2e-real/marketplace.e2e-real-spec.ts` | M4 Marketplace (e2e real) Autorización (IDOR y roles) DEF-BE-021: cliente_b no puede ver el detalle de un servicio de cliente_a (403/404) | passed |
| CP-BE-MKT-026 | `test/e2e-real/marketplace.e2e-real-spec.ts` | M4 Marketplace (e2e real) Autorización (IDOR y roles) DEF-BE-021: cliente_b no puede listar las ofertas de un servicio de cliente_a | passed |
| CP-BE-MKT-027 | `test/e2e-real/marketplace.e2e-real-spec.ts` | M4 Marketplace (e2e real) Autorización (IDOR y roles) cliente_b no puede editar, cancelar ni responder ofertas de un servicio de cliente_a; el servicio no cambia | passed |
| CP-BE-MKT-028 | `test/e2e-real/marketplace.e2e-real-spec.ts` | M4 Marketplace (e2e real) Autorización (IDOR y roles) my-services de cliente_b no incluye servicios de cliente_a | passed |
| CP-BE-MKT-029 | `test/e2e-real/marketplace.e2e-real-spec.ts` | M4 Marketplace (e2e real) Autorización (IDOR y roles) un profesional no asignado no puede iniciar ni completar (403) y el estado no cambia | passed |
| CP-BE-MKT-030 | `test/e2e-real/marketplace.e2e-real-spec.ts` | M4 Marketplace (e2e real) Autorización (IDOR y roles) un usuario sin perfil profesional no puede aceptar ni ofertar (403) | passed |
| CP-BE-MKT-031 | `test/e2e-real/marketplace.e2e-real-spec.ts` | M4 Marketplace (e2e real) Autorización (IDOR y roles) DEF-BE-022: un profesional PENDING o SUSPENDIDO no puede aceptar ni ofertar (403) | passed |
| CP-BE-MKT-032 | `test/e2e-real/marketplace.e2e-real-spec.ts` | M4 Marketplace (e2e real) Autorización (IDOR y roles) DEF-BE-021: GET /services (listado) no expone servicios ajenos a un cliente sin perfil profesional | passed |
| CP-BE-MKT-033 | `test/e2e-real/marketplace.e2e-real-spec.ts` | M4 Marketplace (e2e real) Autorización (IDOR y roles) un profesional ve los servicios PENDING del marketplace (listado) y admin ve todo | passed |
| CP-BE-MKT-034 | `test/e2e-real/marketplace.e2e-real-spec.ts` | M4 Marketplace (e2e real) Autorización (IDOR y roles) el profesional que ofertó no puede responder su propia oferta (solo el cliente dueño) | passed |
| CP-BE-MKT-035 | `test/e2e-real/marketplace.e2e-real-spec.ts` | M4 Marketplace (e2e real) Alcance de /locations según el estado del servicio el cliente no ve la posición exacta del profesional mientras el servicio está PENDING; el propio profesional y admin sí | passed |
| CP-BE-MKT-036 | `test/e2e-real/marketplace.e2e-real-spec.ts` | M4 Marketplace (e2e real) Alcance de /locations según el estado del servicio ACCEPTED e IN_PROGRESS autorizan al cliente del servicio; COMPLETED revoca; un tercero nunca | passed |
| CP-BE-MKT-037 | `test/e2e-real/marketplace.e2e-real-spec.ts` | M4 Marketplace (e2e real) Alcance de /locations según el estado del servicio CANCELLED también revoca el acceso a la posición exacta | passed |
| CP-BE-MKT-038 | `test/e2e-real/marketplace.e2e-real-spec.ts` | M4 Marketplace (e2e real) Alcance de /locations según el estado del servicio sin JWT /locations/professional/:id -> 401 | passed |
| CP-BE-ONB-001 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) Postulación POST /professionals un usuario registrado se postula y queda PENDING, no disponible | passed |
| CP-BE-ONB-002 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) Postulación POST /professionals DEF-BE-015: la doble postulación (USER_ALREADY_PROFESSIONAL) debe responder 409 | passed |
| CP-BE-ONB-003 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) Postulación POST /professionals una categoría inexistente se rechaza con 400 y mensaje claro | passed |
| CP-BE-ONB-004 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) Postulación POST /professionals body inválido (sin categoryId, tarifa negativa, descripción vacía) -> 400 con detalle por campo | passed |
| CP-BE-ONB-005 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) Postulación POST /professionals sin JWT -> 401 | passed |
| CP-BE-ONB-006 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) Postulación POST /professionals un usuario sin perfil profesional recibe 404 en GET /professionals/me | passed |
| CP-BE-ONB-034 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) Visibilidad pública de postulantes DEF-BE-023: un cliente no puede ver el perfil de un postulante PENDING (por id ni por referenceId) | passed |
| CP-BE-ONB-007 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) Consentimiento previo a subir documentos DEF-BE-014: las versiones legales activas aparecen como pendientes para un usuario nuevo | passed |
| CP-BE-ONB-008 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) Consentimiento previo a subir documentos sin DATA_PROCESSING_CONSENT subir un documento da 403 CONSENT_REQUIRED; tras aceptarlo funciona | passed |
| CP-BE-ONB-009 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) Consentimiento previo a subir documentos aceptar dos veces la misma versión -> 409 y deja de figurar como pendiente | passed |
| CP-BE-ONB-010 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) Documentos: subida real a MinIO, listado, cola y revisión el listado propio muestra cada tipo aplicable sin documento al inicio | passed |
| CP-BE-ONB-011 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) Documentos: subida real a MinIO, listado, cola y revisión la subida llega a MinIO: el URL presignado devuelve los mismos bytes | passed |
| CP-BE-ONB-012 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) Documentos: subida real a MinIO, listado, cola y revisión rechaza archivo inválido: tipo no permitido, > 5 MB, sin archivo, tipo de documento desconocido o UUID inválido | passed |
| CP-BE-ONB-013 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) Documentos: subida real a MinIO, listado, cola y revisión un usuario sin perfil profesional (con consentimiento) no puede subir documentos: 4xx, nunca 500 | passed |
| CP-BE-ONB-014 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) Documentos: subida real a MinIO, listado, cola y revisión la cola de admin lista el documento PENDING con filtros y un usuario común recibe 403 | passed |
| CP-BE-ONB-015 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) Documentos: subida real a MinIO, listado, cola y revisión rechazar sin motivo -> 400 con el campo rejectionReason y el documento sigue PENDING | passed |
| CP-BE-ONB-031 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) Documentos: subida real a MinIO, listado, cola y revisión DEF-BE-016: rechazar con motivo vacío o solo espacios debe dar 400 y no cambiar el estado | passed |
| CP-BE-ONB-016 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) Documentos: subida real a MinIO, listado, cola y revisión un usuario común no puede revisar (403); estado inválido 400, inexistente 404 y doble revisión 409 | passed |
| CP-BE-ONB-017 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) Documentos: subida real a MinIO, listado, cola y revisión el rechazo con motivo se refleja en el listado propio y no verifica al profesional | passed |
| CP-BE-ONB-018 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) Documentos: subida real a MinIO, listado, cola y revisión requiredDocumentsVerified se recalcula tras cada revisión: false con 1 de N aprobados, true con todos, estable al rechazar uno no requerido | passed |
| CP-BE-ONB-019 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) Documentos: subida real a MinIO, listado, cola y revisión el endpoint público solo muestra documentos APROBADOS de tipos visibles al cliente | passed |
| CP-BE-ONB-020 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) Documentos: subida real a MinIO, listado, cola y revisión expiración: el job vence el documento aprobado y recalcula requiredDocumentsVerified (run() invocado directo) | passed |
| CP-BE-ONB-021 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) verify / suspend de profesionales sin permiso (cliente, el propio profesional postulado) verify y suspend -> 403 y el estado no cambia | passed |
| CP-BE-ONB-022 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) verify / suspend de profesionales admin verifica: APPROVED + VERIFIED; admin rechaza: REJECTED; id inexistente 404; sin JWT 401 | passed |
| CP-BE-ONB-023 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) verify / suspend de profesionales suspender exige motivo (400) y deja SUSPENDED/isActive=false | passed |
| CP-BE-ONB-032 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) verify / suspend de profesionales DEF-BE-017: suspender con motivo solo espacios debe dar 400 y no suspender | passed |
| CP-BE-ONB-024 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) verify / suspend de profesionales DEF-BE-018: GET /locations/nearby no debe dar 500 y un profesional suspendido desaparece de /locations/nearby y de la lista de disponibles | passed |
| CP-BE-ONB-025 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) Portafolio de trabajos subir al portafolio exige IMAGE_USAGE_CONSENT (403 CONSENT_REQUIRED) y con él queda PENDING y visible | passed |
| CP-BE-ONB-026 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) Portafolio de trabajos rechaza archivos que no son imagen (PDF) con 400 | passed |
| CP-BE-ONB-027 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) Portafolio de trabajos PENDING no aparece en el endpoint público; aprobado sí; ocultar (isVisible:false) lo saca; mostrar lo devuelve | passed |
| CP-BE-ONB-028 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) Portafolio de trabajos reordenar por sortOrder cambia el orden del listado propio y del público | passed |
| CP-BE-ONB-029 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) Portafolio de trabajos borrar quita el item del listado propio y del público; ajeno -> 403; ya borrado -> 404 | passed |
| CP-BE-ONB-033 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) Portafolio de trabajos DEF-BE-016: rechazar un item de portafolio con motivo vacío o solo espacios -> 400 y sigue PENDING | passed |
| CP-BE-ONB-030 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) Portafolio de trabajos la revisión de portafolio exige permiso y motivo al rechazar; un item rechazado no es público ni re-revisable | passed |
| CP-BE-AUTH-001 | `test/e2e-real/smoke.e2e-real-spec.ts` | Smoke E2E real healthcheck (version-neutral): Postgres, Mongo y Redis reales en up | passed |
| CP-BE-AUTH-002 | `test/e2e-real/smoke.e2e-real-spec.ts` | Smoke E2E real GET /auth/public-key devuelve el PEM publico generado para el E2E | passed |
| CP-BE-AUTH-003 | `test/e2e-real/smoke.e2e-real-spec.ts` | Smoke E2E real Basic Auth invalido -> 401 | passed |
| CP-BE-AUTH-004 | `test/e2e-real/smoke.e2e-real-spec.ts` | Smoke E2E real nonce + RSA -> login admin -> /auth/scope | passed |
| CP-BE-AUTH-005 | `test/e2e-real/smoke.e2e-real-spec.ts` | Smoke E2E real endpoint protegido sin token -> 401 | passed |
| CP-BE-AUTH-006 | `test/e2e-real/smoke.e2e-real-spec.ts` | Smoke E2E real usuario sin permiso -> 403 en endpoint de staff | passed |

### Casos fallidos u omitidos

Ninguno.

## 3. Defectos encontrados

Detectados por los specs W2 (cada uno se escribió primero como `it.failing`, se documentó y se corrigió en un commit propio):

| ID | Sev. | Caso | Repro | Estado |
|---|---|---|---|---|
| DEF-BE-014 | Alto | CP-BE-ONB-007 | `GET /legal/consents/pending` con un usuario nuevo devuelve `[]`: el seed creó las versiones con `countryId` de Paraguay y las consultas solo ven `countryId null`. La subida de documentos y de portafolio (`@RequiresActiveConsent`) quedaba bloqueada para siempre. | Corregido (1659312) |
| DEF-BE-015 | Bajo | CP-BE-ONB-002 | Doble `POST /professionals` -> 400 (era conflicto de estado). | Corregido (c6467a1): 409 |
| DEF-BE-016 | Medio | CP-BE-ONB-031, 033 | Revisión de documento o foto con `rejectionReason` "" o "   " -> 200 y queda REJECTED sin motivo. | Corregido (21ba467): 400 |
| DEF-BE-017 | Bajo | CP-BE-ONB-032 | `POST /professionals/:id/suspend` con `reason` "   " suspende. | Corregido (0f5ceb6): 400 |
| DEF-BE-018 | Alto | CP-BE-ONB-024 | `GET /locations/nearby` -> 500 siempre en Postgres real (`HAVING` sin `GROUP BY`, 42803). | Corregido (8aa44de) |
| DEF-BE-019 | Medio | CP-BE-MKT-011, 012, 013, 015, 016, 019 | Cancelar, editar, aceptar, iniciar, completar fuera de estado, ofertar a un servicio no PENDING y ofertar dos veces -> 400. En la carrera de aceptación el perdedor recibía 400 o 409 según el timing. | Corregido (ace979a): 409 |
| DEF-BE-020 | Medio | CP-BE-MKT-017 | Rechazar una oferta ya aceptada -> 200: la oferta quedaba REJECTED y el servicio ACCEPTED con ese profesional. | Corregido (8742cb6): 409 |
| DEF-BE-021 | Crítico | CP-BE-MKT-025, 026, 032 | cliente_b: `GET /services/:id` (dirección y coordenadas), `GET /services/:id/requests` (precios y mensajes) y `GET /services` de cliente_a -> 200. | Corregido (5a38afb): 403 |
| DEF-BE-022 | Alto | CP-BE-MKT-031 | Un profesional PENDING, rechazado o suspendido podía aceptar un servicio u ofertar. | Corregido (fce2887): 403 |
| DEF-BE-023 | Medio | CP-BE-ONB-034 | `GET /professionals/:id` y `/reference/:ref` devuelven a cualquier cliente el perfil de un postulante PENDING (y el listado `GET /professionals` no filtra por estado). | **ABIERTO** (`it.failing`): el endpoint lo reutiliza el backoffice de Web; arreglarlo bien exige filtrar por rol en 6 consultas (list, nearby, skills, top-rated, id, referenceId) y decidir qué ve cada rol |

## 4. Desvíos y observaciones

- **Estabilidad:** la suite completa corrió 3 veces seguidas con `pnpm test:e2e:real` (193/193 en las tres, ~70 s cada una) y una cuarta
  desde cero con este `pnpm qa:e2e` (stack nuevo, 193/193). Las tres variantes de concurrencia (CP-BE-MKT-022..024) dieron 20/20 en todas las
  corridas. Sin flakies, timeouts ni omitidos.
- **Arnés:** el SDK de S3 falla dentro de Jest sin `--experimental-vm-modules` (500 al subir a MinIO); el CLI lo agrega solo (`scripts/e2e/cli.ts`).
- **Job de expiración:** se invoca `ProfessionalDocumentsExpirationJob.run()` directo (CP-BE-ONB-020); el disparo por cron de las 3 AM queda como caso manual.
- **WebSocket:** `subscribeToProfessional` no se prueba por socket (no hay `socket.io-client` en el repo); se probó la misma regla por REST
  (`GET /locations/professional/:id`, CP-BE-MKT-035..038) y la cubre `locations.gateway.spec.ts`. Caso manual documentado en CP-MKT.md.
- **Observaciones fuera de alcance (no corregidas):** `GET /uploads/presigned-url?key=` firma cualquier clave para cualquier usuario autenticado
  (revisar en M9); `GET /services/:id/progress` y `/requests/:requestId/budget-options` deben auditarse por IDOR en W3/W4; las respuestas de
  profesional incluyen `checksum`, `changeSignature` y `createdBy` internos.
- El campo "Commit" del encabezado dice "árbol con cambios sin commitear" solo porque este informe aún no estaba versionado al generarse.

## 5. Evidencia

- Salida JSON de jest en `coverage/jest-e2e.json` (ignorado por git).

## 6. Veredicto

**APROBADO CON OBSERVACIONES.** 193/193 casos pasan (72 son de W2: 34 de M3 y 38 de M4, 1 de ellos `it.failing` por DEF-BE-023 abierto), 4 corridas consecutivas sin fallos y concurrencia 20/20. Observación: DEF-BE-023 abierto (Medio) y los puntos de la sección 4.
