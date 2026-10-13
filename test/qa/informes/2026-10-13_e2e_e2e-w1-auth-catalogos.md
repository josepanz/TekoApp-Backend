# Informe de ejecución QA — E2E real (smoke) — test/e2e-w1-auth-catalogos

| Campo | Valor |
|---|---|
| Fecha y hora | 2026-10-13 00:29 |
| Repo | TekoApp-Backend |
| Rama | `test/e2e-w1-auth-catalogos` |
| Commit | `69f80ca` (árbol con cambios sin commitear) |
| Entorno | compose e2e (docker-compose.e2e.yml, .env.e2e), Node v22.16.0, Docker 29.6.2, build dfc4efb |
| Comando | `pnpm qa:e2e` |
| Ejecutor | agente Claude Code (modelo claude-sonnet-5-5) |

## 1. Resumen

| Suites | Casos | Pasaron | Fallaron | Omitidos | Duración |
|---|---|---|---|---|---|
| 5 (0 con fallo) | 119 | 119 | 0 | 0 | 27.1 s |

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
| CP-BE-AUTH-001 | `test/e2e-real/smoke.e2e-real-spec.ts` | Smoke E2E real healthcheck (version-neutral): Postgres, Mongo y Redis reales en up | passed |
| CP-BE-AUTH-002 | `test/e2e-real/smoke.e2e-real-spec.ts` | Smoke E2E real GET /auth/public-key devuelve el PEM publico generado para el E2E | passed |
| CP-BE-AUTH-003 | `test/e2e-real/smoke.e2e-real-spec.ts` | Smoke E2E real Basic Auth invalido -> 401 | passed |
| CP-BE-AUTH-004 | `test/e2e-real/smoke.e2e-real-spec.ts` | Smoke E2E real nonce + RSA -> login admin -> /auth/scope | passed |
| CP-BE-AUTH-005 | `test/e2e-real/smoke.e2e-real-spec.ts` | Smoke E2E real endpoint protegido sin token -> 401 | passed |
| CP-BE-AUTH-006 | `test/e2e-real/smoke.e2e-real-spec.ts` | Smoke E2E real usuario sin permiso -> 403 en endpoint de staff | passed |

### Casos fallidos u omitidos

Ninguno.

## 3. Defectos encontrados

Defectos heredados del informe `2026-10-12_e2e_e2e-w1-auth-catalogos.md`; en esta ejecución (segunda corrida de la rama, tras implementar DEF-BE-006; sobrescribe el informe de la primera corrida del mismo día) los 10 están corregidos y sus casos son `it` normales. Defecto nuevo: DEF-BE-011 (Bajo, abierto, `it.failing` unitario CP-BE-AUTH-039): `JwtRefreshStrategy` busca por `payload.email`, que el refresh no lleva; no explotable porque el service revalida por `sub`.

| ID | Severidad | Casos | Estado |
|---|---|---|---|
| DEF-BE-001 | Alta | CP-BE-AUTH-010, 014; CP-BE-CAT-015, 026, 033; CP-BE-ERR-009 | Corregido (2dd5228): `exceptionFactory` lanza `BadRequestException` (400) |
| DEF-BE-002 | Crítica | CP-BE-CAT-010..014 | Corregido (f92e95a): `PermissionsGuard` + `categories.catalog:manage` o `admin:all` |
| DEF-BE-003 | Media | CP-BE-AUTH-013 | Corregido (1cdcbce): email inexistente -> 401 `INVALID_CREDENTIALS` |
| DEF-BE-004 | Baja | CP-BE-AUTH-026 | Corregido (ad9f0d8): `error` sale del status si la excepción no lo trae |
| DEF-BE-005 | Baja | CP-BE-ERR-006 | Corregido (bbfac18): el 429 usa el envelope uniforme |
| DEF-BE-006 | Media | CP-BE-AUTH-027, 036..038 | Corregido (69f80ca): refresh con `jti`, `POST /auth/logout` y denylist `revoked:jti:<jti>` en Redis con TTL |
| DEF-BE-007 | Baja | CP-BE-ERR-008 | Corregido (a24fea1): el 400 incluye `error.error:"Bad Request"` |
| DEF-BE-008 | Baja | CP-BE-CAT-016, 016b | Corregido (dcf2657): detalle por id oculto para no-admin (`OptionalJwtAuthGuard`) |
| DEF-BE-009 | Media | CP-BE-CAT-031, 032 | Corregido (c0c7d8f): `pageSize` máximo 100 (`PaginationQueryDTO` y `ListUsersRequestDTO`) |
| DEF-BE-010 | Media | CP-BE-CAT-025 | Corregido (9b11879): P2002 -> 409 |

## 4. Desvíos y observaciones

- **Sin fallos ni flakies:** la suite (5 suites, 119 casos) pasó 3 veces seguidas con `pnpm test:e2e:real` y una cuarta vía `pnpm qa:e2e`. No queda ningún `it.failing` e2e.
- **Unitarias:** `pnpm test` (144 suites, 1603 tests), `pnpm lint` (0 errores) y `pnpm check:types` en verde. `pnpm qa:unit` sale con código 1 por umbrales de cobertura global (branches 67,17% < 70%, functions 76,32% < 80%): ya incumplían antes de esta rama (66,85% / 75,74%).
- **Diseño de DEF-BE-006:** un refresh legacy sin `jti` se acepta hasta expirar; si Redis cae, el refresh sigue (warning) y el logout falla con 500 (fail-closed).
- **Observación, no corregida:** el login de un usuario existente sin credencial sigue devolviendo 200 `{login:false, requiredNewPassword:true}` (flujo de migración de usuarios legacy), lo que aún permite distinguir ese caso; además el login de email inexistente no ejecuta la verificación de hash (diferencia de tiempo). Fuera de alcance de DEF-BE-003.
- `qa:e2e` levantó y bajó el stack (`pnpm e2e:down` incluido; sin contenedores `tekoapp-e2e-*` al terminar).
- La marca "árbol con cambios sin commitear" del encabezado se debe a que este informe aún no estaba commiteado; el código ejecutado es el de `69f80ca`.

## 5. Evidencia

- Specs: `test/e2e-real/{auth,auth-rate-limit,catalogos,error-contract,smoke}.e2e-real-spec.ts`; casos en `test/qa/casos/CP-AUTH.md` y `CP-CAT.md`; informe unitario `2026-10-13_unit_e2e-w1-auth-catalogos.md`.
- Salida JSON de jest en `coverage/jest-e2e.json` (ignorado por git).

## 6. Veredicto

APROBADO CON OBSERVACIONES: 119/119 casos pasan en 4 corridas y los 10 defectos DEF-BE-001..010 están corregidos; queda abierto DEF-BE-011 (bajo).
