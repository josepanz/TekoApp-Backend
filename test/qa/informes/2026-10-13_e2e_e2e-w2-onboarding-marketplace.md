# Informe de ejecución QA — E2E real (smoke) — test/e2e-w2-onboarding-marketplace

| Campo | Valor |
|---|---|
| Fecha y hora | 2026-10-13 15:14 |
| Repo | TekoApp-Backend |
| Rama | `test/e2e-w2-onboarding-marketplace` |
| Commit | `ec4724c` |
| Entorno | compose e2e (docker-compose.e2e.yml, .env.e2e), Node v22.16.0, Docker 29.6.2, build dfc4efb |
| Comando | `pnpm qa:e2e` |
| Ejecutor | agente Claude Code (modelo claude-sonnet-5-5) |

## 1. Resumen

| Suites | Casos | Pasaron | Fallaron | Omitidos | Duración |
|---|---|---|---|---|---|
| 8 (0 con fallo) | 226 | 226 | 0 | 0 | 1 min 52 s |

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
| CP-BE-MKT-040 | `test/e2e-real/marketplace.e2e-real-spec.ts` | M4 Marketplace (e2e real) Ciclo de vida feliz DEF-BE-027 (descartado): el motivo al rechazar una oferta es opcional; sin motivo, motivo vacio o con motivo -> 200 REJECTED | passed |
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
| CP-BE-MKT-039 | `test/e2e-real/marketplace.e2e-real-spec.ts` | M4 Marketplace (e2e real) Alcance de /locations según el estado del servicio DEF-BE-030: un profesional suspendido a mitad de servicio sigue visible (id y referenceId) para su cliente con servicio ACCEPTED/IN_PROGRESS; terceros y quien perdio el vinculo reciben 404 | passed |
| CP-BE-ONB-001 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) Postulación POST /professionals un usuario registrado se postula y queda PENDING, no disponible | passed |
| CP-BE-ONB-002 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) Postulación POST /professionals DEF-BE-015: la doble postulación (USER_ALREADY_PROFESSIONAL) debe responder 409 | passed |
| CP-BE-ONB-003 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) Postulación POST /professionals una categoría inexistente se rechaza con 400 y mensaje claro | passed |
| CP-BE-ONB-004 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) Postulación POST /professionals body inválido (sin categoryId, tarifa negativa, descripción vacía) -> 400 con detalle por campo | passed |
| CP-BE-ONB-005 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) Postulación POST /professionals sin JWT -> 401 | passed |
| CP-BE-ONB-006 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) Postulación POST /professionals un usuario sin perfil profesional recibe 404 en GET /professionals/me | passed |
| CP-BE-ONB-034 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) Visibilidad pública de postulantes DEF-BE-023: un cliente no puede ver el perfil de un postulante PENDING (por id ni por referenceId) | passed |
| CP-BE-ONB-035 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) Visibilidad pública: listados de postulantes DEF-BE-023: el listado, la búsqueda por skills y los cercanos no devuelven postulantes PENDING a un cliente | passed |
| CP-BE-ONB-036 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) Visibilidad pública: listados de postulantes DEF-BE-023: admin ve al postulante PENDING (lista, id, referenceId, services, stats) y el propio profesional se ve a sí mismo | passed |
| CP-BE-ONB-037 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) Visibilidad pública: listados de postulantes DEF-BE-023: un profesional APPROVED sí es visible para el cliente; REJECTED y SUSPENDED dejan de serlo (id, referenceId y listado) | passed |
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
| CP-BE-ONB-038 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) verify / suspend de profesionales DEF-BE-028: verify sobre un SUSPENDED o APPROVED responde 409 con envelope y no cambia el estado; sobre REJECTED sí (re-revision) | passed |
| CP-BE-ONB-039 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) verify / suspend de profesionales DEF-BE-029: suspend sobre un SUSPENDED (o PENDING/REJECTED) responde 409 y conserva el motivo original | passed |
| CP-BE-ONB-032 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) verify / suspend de profesionales DEF-BE-017: suspender con motivo solo espacios debe dar 400 y no suspender | passed |
| CP-BE-ONB-024 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) verify / suspend de profesionales DEF-BE-018: GET /locations/nearby no debe dar 500 y un profesional suspendido desaparece de /locations/nearby y de la lista de disponibles | passed |
| CP-BE-ONB-040 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) verify / suspend de profesionales reactivate: SUSPENDED -> APPROVED con motivo; vuelve a ser visible y queda como un APPROVED normal (isActive, no disponible hasta re-marcarse) | passed |
| CP-BE-ONB-041 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) verify / suspend de profesionales reactivate sobre PENDING, REJECTED, APPROVED o ya reactivado -> 409 con envelope y no cambia el estado ni el motivo | passed |
| CP-BE-ONB-042 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) verify / suspend de profesionales reactivate exige motivo (400 si falta, vacío o solo espacios), permiso (403), JWT (401) y existencia (404) | passed |
| CP-BE-ONB-044 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) verify / suspend de profesionales auditoría: verify, suspend y reactivate registran actor (referenceId), estado anterior/nuevo, motivo, IP y user-agent en audit_logs | passed |
| CP-BE-ONB-045 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) verify / suspend de profesionales rechazar exige motivo (400 si falta o está en blanco); verify sin nota no arrastra el motivo previo | passed |
| CP-BE-ONB-046 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) verify / suspend de profesionales status-history: lista paginada de transiciones (más reciente primero) con actor, de->a, motivo, fecha, IP y user-agent | passed |
| CP-BE-ONB-047 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) verify / suspend de profesionales status-history: pageSize > 100 -> 400, sin permiso 403, sin JWT 401, inexistente 404; una actualización sin cambio de estado no genera entrada | passed |
| CP-BE-ONB-043 | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` | M3 Onboarding profesional (e2e real) verify / suspend de profesionales reactivate con la cuenta del usuario no ACTIVE (bloqueada) -> 409 y sigue SUSPENDED | passed |
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
| CP-BE-UPL-001 | `test/e2e-real/uploads-presigned.e2e-real-spec.ts` | Autorización de archivos S3 (e2e real) Documentos de identidad del profesional DEF-BE-024: cliente_b no puede obtener el URL presignado de un documento de un profesional ni descargar sus bytes | passed |
| CP-BE-UPL-002 | `test/e2e-real/uploads-presigned.e2e-real-spec.ts` | Autorización de archivos S3 (e2e real) Documentos de identidad del profesional DEF-BE-024: otro profesional tampoco puede; el dueño y el admin sí, con los mismos bytes | passed |
| CP-BE-UPL-003 | `test/e2e-real/uploads-presigned.e2e-real-spec.ts` | Autorización de archivos S3 (e2e real) Documentos de identidad del profesional DEF-BE-024: un documento aprobado y visible al cliente lo ve cualquier autenticado; uno aprobado no visible, no | passed |
| CP-BE-UPL-004 | `test/e2e-real/uploads-presigned.e2e-real-spec.ts` | Autorización de archivos S3 (e2e real) Documentos de identidad del profesional DEF-BE-024: GET /uploads/info/:filename aplica la misma regla | passed |
| CP-BE-UPL-005 | `test/e2e-real/uploads-presigned.e2e-real-spec.ts` | Autorización de archivos S3 (e2e real) Portafolio DEF-BE-024: una foto PENDING u oculta (isVisible:false) solo la ven el dueño y el admin | passed |
| CP-BE-UPL-006 | `test/e2e-real/uploads-presigned.e2e-real-spec.ts` | Autorización de archivos S3 (e2e real) Portafolio una foto aprobada y visible la ve cualquier usuario autenticado y los bytes se descargan | passed |
| CP-BE-UPL-007 | `test/e2e-real/uploads-presigned.e2e-real-spec.ts` | Autorización de archivos S3 (e2e real) Avatar, claves no referenciadas, TTL y sin JWT el avatar de un usuario lo ve cualquier autenticado | passed |
| CP-BE-UPL-008 | `test/e2e-real/uploads-presigned.e2e-real-spec.ts` | Autorización de archivos S3 (e2e real) Avatar, claves no referenciadas, TTL y sin JWT DEF-BE-024: una key que ninguna fila referencia (inventada o recién subida sin guardar) -> 404 | passed |
| CP-BE-UPL-009 | `test/e2e-real/uploads-presigned.e2e-real-spec.ts` | Autorización de archivos S3 (e2e real) Avatar, claves no referenciadas, TTL y sin JWT DEF-BE-024: el URL presignado expira en 5 minutos como máximo | passed |
| CP-BE-UPL-010 | `test/e2e-real/uploads-presigned.e2e-real-spec.ts` | Autorización de archivos S3 (e2e real) Avatar, claves no referenciadas, TTL y sin JWT sin JWT o sin key -> 401 / 400 | passed |
| CP-BE-UPL-011 | `test/e2e-real/uploads-presigned.e2e-real-spec.ts` | Autorización de archivos S3 (e2e real) Fotos de servicio y de bitácora DEF-BE-024: la foto de un servicio PENDING la ven el cliente, un profesional aprobado y el admin; no un tercero | passed |
| CP-BE-UPL-012 | `test/e2e-real/uploads-presigned.e2e-real-spec.ts` | Autorización de archivos S3 (e2e real) Fotos de servicio y de bitácora DEF-BE-024: tras asignarse, la foto del servicio y las de la bitácora solo las ven el cliente, el profesional asignado y el admin | passed |
| CP-BE-UPL-013 | `test/e2e-real/uploads-presigned.e2e-real-spec.ts` | Autorización de archivos S3 (e2e real) Fotos de servicio y de bitácora DEF-BE-024: adjuntar la key de un documento ajeno a una entrada de bitácora no da acceso a ese documento | passed |
| CP-BE-UPL-014 | `test/e2e-real/uploads-presigned.e2e-real-spec.ts` | Autorización de archivos S3 (e2e real) Borrado de archivos DEF-BE-025: cliente_b no puede borrar un documento ajeno (403) y el archivo sigue ahí | passed |
| CP-BE-UPL-015 | `test/e2e-real/uploads-presigned.e2e-real-spec.ts` | Autorización de archivos S3 (e2e real) Borrado de archivos DEF-BE-025: borrar una key no referenciada -> 404 | passed |
| CP-BE-UPL-016 | `test/e2e-real/uploads-presigned.e2e-real-spec.ts` | Autorización de archivos S3 (e2e real) Borrado de archivos el dueño y el admin pueden borrar el archivo | passed |
| CP-BE-UPL-017 | `test/e2e-real/uploads-presigned.e2e-real-spec.ts` | Autorización de archivos S3 (e2e real) Auditoría de IDOR en /services/:id/progress y /budget-options (regresión) bitácora: un tercero (cliente_b, otro profesional) no puede leer ni escribir; el dueño, el asignado y el admin leen | passed |
| CP-BE-UPL-018 | `test/e2e-real/uploads-presigned.e2e-real-spec.ts` | Autorización de archivos S3 (e2e real) Auditoría de IDOR en /services/:id/progress y /budget-options (regresión) presupuestos: un tercero no puede leer, reemplazar ni elegir opciones; solo el autor edita y solo el cliente dueño elige | passed |

### Casos fallidos u omitidos

Ninguno.

## 3. Defectos encontrados

Detectados por los specs W2 y por la revisión de logs (cada uno se escribió primero como test que falla, se documentó y se corrigió en un commit propio):

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
| DEF-BE-023 | Medio | CP-BE-ONB-034..037 | `GET /professionals`, `/nearby`, `/search/skills`, `/top-rated`, `/:id`, `/reference/:ref`, `/:id/stats` y `/:id/services` devolvían postulantes PENDING, rechazados y suspendidos a cualquier cliente. | Corregido (8420fa2): un cliente solo ve APPROVED y activos (404 en los lookups); admin, gestores y el propio profesional ven todo |
| DEF-BE-024 | Crítico | CP-BE-UPL-001..005, 008, 009, 011..013 | cliente_b pide `GET /uploads/presigned-url?key=<fileKey de un documento de identidad ajeno>` y descarga los bytes reales del MinIO; `info/:filename` igual; el URL duraba 900 s. | Corregido (a4050d5): autorización por dueño resuelto desde la DB, 404 sin registro, TTL <= 300 s |
| DEF-BE-025 | Alto | CP-BE-UPL-014, 015 | cliente_b `DELETE /uploads/:fileKey` borra el documento de otro usuario (200). | Corregido (59382c1): solo dueño o admin |
| DEF-BE-027 | Bajo | CP-BE-MKT-040 | Rechazar una oferta sin motivo -> 200. | Descartado por decisión de UX: el motivo es opcional; el test 1b1d4d9 fija el contrato |
| DEF-BE-028 | Medio | CP-BE-ONB-038 | `POST /professionals/:id/verify` sobre un SUSPENDED -> 201 y lo dejaba APPROVED (también re-verificaba un APPROVED). | Corregido (6ef4c40): verify solo desde PENDING/REJECTED, resto 409 |
| DEF-BE-029 | Bajo | CP-BE-ONB-039 | `suspend` sobre un SUSPENDED -> 201, pisaba el motivo y reenviaba la notificación. | Corregido (a7f3d3b): suspend solo desde APPROVED, resto 409 |
| DEF-BE-030 | Medio | CP-BE-MKT-039 | Profesional suspendido a mitad de servicio -> 404 para su cliente en `/professionals/:id` y `/reference/:ref`. | Corregido (b76baa0): un cliente con servicio ACCEPTED/IN_PROGRESS lo sigue viendo; terceros 404 |
| DEF-BE-031 | Bajo | CP-BE-ENV-004 | Detectado en los logs: el log de un 4xx manejado salía como `ERROR` y con el status del handler ("201 - CREATED" en un 409). | Corregido (367a5c2): status real de la excepción, `WARN` para 4xx y `ERROR` solo para 5xx |

Auditoría de IDOR en `/services/:id/progress` y `/budget-options` (lectura y escritura): **sin defectos**, casos de regresión CP-BE-UPL-017 y 018.

## 4. Desvíos y observaciones

- **Estabilidad:** la suite completa corrió 3 veces seguidas sobre el stack e2e (`pnpm test:e2e:real` x3 más la corrida de `pnpm qa:e2e` sobre un stack nuevo): 226/226 en las cuatro. Las tres variantes de concurrencia (CP-BE-MKT-022..024) dieron 20/20 en todas. Sin flakies, timeouts ni omitidos. En una corrida previa de `qa:e2e`, `prisma migrate deploy` falló una vez con `P1001` (el puerto 55432 todavía no aceptaba conexiones recién levantado el contenedor); se repitió y pasó, es una carrera del CLI `e2e up`, ajena a la app.
- **Arnés:** el SDK de S3 falla dentro de Jest sin `--experimental-vm-modules` (500 al subir a MinIO); el CLI lo agrega solo (`scripts/e2e/cli.ts`).
- **Job de expiración:** se invoca `ProfessionalDocumentsExpirationJob.run()` directo (CP-BE-ONB-020); el disparo por cron de las 3 AM queda como caso manual.
- **WebSocket:** `subscribeToProfessional` no se prueba por socket (no hay `socket.io-client` en el repo); se probó la misma regla por REST
  (`GET /locations/professional/:id`, CP-BE-MKT-035..038) y la cubre `locations.gateway.spec.ts`. Caso manual documentado en CP-MKT.md.
- **Observaciones no corregidas:** las respuestas de profesional incluyen `checksum`, `changeSignature` y `createdBy` internos; el admin no puede
  leer las opciones de presupuesto (decisión de producto para M5); las claves `merchant-docs` no se pueden pedir (flujo sin uso). Ver CP-UPL.md ("No cubierto").
- **Reactivación, auditoría e historial (W2, 2026-10-13):** CP-BE-ONB-040..047. Sin migración: el modelo `AuditLogs` y el trigger `fn_audit_generic_trigger` ya guardan estado anterior/nuevo (`old_data`/`new_data`), motivo, actor, IP y user-agent; el `AuditInterceptor` global no está registrado, por eso las transiciones corren dentro de `auditStorage` para que el trigger registre IP y user-agent. Limitación conocida: la columna `audit_logs.reason` hereda el motivo anterior cuando una transición no trae nota (el trigger usa `COALESCE(NEW.changed_reason, OLD.changed_reason)`); el historial lee el motivo de `new_data.changed_reason`.
- **Healthcheck 503 en el smoke:** CP-BE-AUTH-001 acepta 200 o 503; con la app in-process de jest el healthcheck responde 503 porque `memory_heap` (heap del proceso jest) y `storage_disk` (disco del host) superan sus umbrales, con Postgres, Mongo y Redis en `up`. Ver sección 7.

## 5. Evidencia

- Salida JSON de jest en `coverage/jest-e2e.json` (ignorado por git).
- Logs de la corrida en `test/qa/informes/artefactos/2026-10-13_e2e_e2e-w2-onboarding-marketplace/logs/` (ignorado por git; ver sección 7).

## 6. Veredicto

**APROBADO.** 226/226 casos pasan (105 son de W2: 47 de M3, 40 de M4 y 18 de archivos/auditoría), 4 corridas completas consecutivas sin fallos, concurrencia 20/20 y sin defectos abiertos (DEF-BE-027 descartado por decisión de UX; DEF-BE-031 corregido). El único 5xx de los logs está explicado (sección 7) y no hay errores no manejados. Las observaciones de la sección 4 no bloquean.

## 7. Logs de servicios

Carpeta de artefactos (gitignoreada): `test/qa/informes/artefactos/2026-10-13_e2e_e2e-w2-onboarding-marketplace/logs/`. `app` es el stdout de la app in-process de jest (pino) y `app-stderr` su stderr; el resto es `docker compose -f docker-compose.e2e.yml logs` por contenedor.

| Servicio | Archivo | Líneas | ERROR/FATAL | 5xx | No manejados | WARN |
|---|---|---|---|---|---|---|
| app | `app.log` | 157023 | 1 (0 fatal) | 1 | 0 | 241 |
| app-stderr | `app-stderr.log` | 7910 | 1 (0 fatal) | 0 | 0 | 0 |
| mailhog | `mailhog.log` | 44634 | 0 (0 fatal) | 0 | 0 | 0 |
| minio | `minio.log` | 24 | 0 (0 fatal) | 0 | 0 | 0 |
| mongo | `mongo.log` | 1077 | 0 (0 fatal) | 0 | 0 | 3 |
| postgres | `postgres.log` | 68 | 4 (0 fatal) | 0 | 0 | 0 |
| redis | `redis.log` | 7 | 0 (0 fatal) | 0 | 0 | 1 |

**Atención: 1 respuesta(s) 5xx y 0 error(es) no manejado(s) en los logs. Con tests en verde igual impiden el veredicto APROBADO hasta explicarlos (caso negativo esperado, con su CP) o registrarlos como DEF.**

### Primeras 10 líneas de error por servicio

#### app

```text
ERROR: Error | GET /tekoapp-backend/api/healthcheck - (503 - SERVICE_UNAVAILABLE) | Trace ID: 469b9401-85db-41fd-ad6d-ee783df728a7
```

#### app-stderr

```text
ERROR: [Nest] 37000  - 13/10/2026, 3:13:56 p. m.   ERROR [Testing] Health Check has failed! {"postgres_database":{"status":"up"},"mongodb_database":{"status":"up"},"redis":{"status":"up"},"memory_heap":{"message":"Used heap exceeded the set threshold","status":"down"},"storage_disk":{"message":"Used...
```

#### mailhog

Ninguna.

#### minio

Ninguna.

#### mongo

Ninguna.

#### postgres

```text
ERROR: 2026-10-13 18:13:18.503 UTC [298] ERROR:  duplicate key value violates unique constraint "users_email_key"
ERROR: 2026-10-13 18:13:51.148 UTC [384] ERROR:  duplicate key value violates unique constraint "professional_document_types_code_key"
ERROR: 2026-10-13 18:14:02.134 UTC [422] ERROR:  duplicate key value violates unique constraint "users_email_key"
ERROR: 2026-10-13 18:14:02.356 UTC [422] ERROR:  duplicate key value violates unique constraint "users_email_key"
```

#### redis

Ninguna.

### Revisión

- **5xx (1):** `GET /tekoapp-backend/api/healthcheck` -> 503, esperado: lo provoca el caso CP-BE-AUTH-001 (smoke), que acepta 200 o 503 porque en la app in-process de jest `memory_heap` y `storage_disk` superan sus umbrales (`app-stderr` lo muestra: Postgres, Mongo y Redis en `up`). No es un defecto de la app. El mismo 503 aparece como `ERROR` en `app` y como `ERROR [Testing] Health Check has failed!` en `app-stderr` (una sola respuesta, contada una vez).
- **Errores no manejados:** ninguno (0 `UnhandledPromiseRejection` / excepciones no capturadas).
- **`app` WARN (241):** son los 4xx manejados de los casos negativos (409 de máquinas de estado y carreras, 400/403/404 de validación y autorización). Tras DEF-BE-031 salen como `WARN` con su status real y solo el 503 del healthcheck es `ERROR`.
- **Postgres ERROR (4, `duplicate key value violates unique constraint`):** violaciones de unicidad esperadas que la app convierte en 409: `users_email_key` x3 (registro con email duplicado: CP-BE-AUTH-008 y el caso "onboarding con email duplicado" del contrato de error, CP-BE-ERR-001/007) y `professional_document_types_code_key` x1 (CP-BE-CAT-025, código de tipo de documento duplicado). Ninguno llegó al cliente como 5xx.
- **Mongo (3 WARN) y Redis (1 WARN):** avisos de arranque de los contenedores de desarrollo (Mongo: límite de conexiones y "access control is not enabled"; Redis: "no config file specified"), sin impacto. MinIO y MailHog sin errores.
