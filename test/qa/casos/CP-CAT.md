# CP-CAT — M2 Catálogos (Backend)

Especificación según `C:\workspace\QA-DOC-STANDARD.md` §2. Casos CP-BE-CAT-001..035 de la ola W1. Los marcados `[DEF ...]` están automatizados como `it.failing` (pasan mientras el defecto exista; hay que quitar `.failing` al corregirlo).

## Decisiones y casos no automatizables

- **Endpoints públicos sin guard (intención documentada):** `GET /categories*` (salvo `/categories/all`, que exige JWT), `/service-types`, `/countries`, `/currencies`, `/languages`. Son catálogos de solo lectura que la app necesita antes del login (registro, home, selector de país/idioma); no exponen datos de usuarios. Se verifican sin token.
- **PlatformCommissionConfig:** ningún controller la expone. Solo la consume `FeeCalculatorService` al calcular pagos (con fallback a "sin comisión" si no hay fila por defecto); ese fallback lo cubre `src/modules/payments-db/services/fee-calculator.service.spec.ts` y se vuelve a validar en M6 (Pagos) a través de un pago real. Por eso no hay caso e2e en M2.
- **TaxConfig/TipConfig:** el spec respalda las filas, vacía las tablas, valida el fallback y las restaura al final.
- **Ordenamiento server-side:** no hay (hallazgo de UX del plan maestro); no se prueba.

### CP-BE-CAT-001 — Admin crea una categoría y aparece en el listado público

| Campo | Contenido |
|---|---|
| ID | CP-BE-CAT-001 |
| Título | Admin crea una categoría y aparece en el listado público |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M2 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 2 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. |
| Pasos | 1. Login admin.<br>2. `POST /categories` con nombre único.<br>3. `GET /categories` y `/categories/main` sin token. |
| Datos de prueba | nombre `E2E Cat <hex>` |
| Resultado esperado | 201 con slug autogenerado; la categoría aparece en ambos listados públicos. |
| Automatizado en | `test/e2e-real/catalogos.e2e-real-spec.ts` — `Categorías › admin crea una categoría y aparece en el listado público (sin token)` |

### CP-BE-CAT-002 — Una categoría oculta no aparece en listados públicos ni por slug

| Campo | Contenido |
|---|---|
| ID | CP-BE-CAT-002 |
| Título | Una categoría oculta no aparece en listados públicos ni por slug |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M2 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 2 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. |
| Pasos | 1. Crear categoría con `isVisible:false`.<br>2. Listados públicos y `GET /categories/slug/:slug`.<br>3. Admin: `GET /categories/all`. |
| Datos de prueba | isVisible=false |
| Resultado esperado | No aparece en `/categories` ni `/main`; slug 404; el admin la ve en `/all`. |
| Automatizado en | `test/e2e-real/catalogos.e2e-real-spec.ts` — `Categorías › una categoría oculta (isVisible=false) no aparece...` |

### CP-BE-CAT-003 — toggle-visibility oculta y vuelve a mostrar la categoría

| Campo | Contenido |
|---|---|
| ID | CP-BE-CAT-003 |
| Título | toggle-visibility oculta y vuelve a mostrar la categoría |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M2 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 2 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. |
| Pasos | 1. `PATCH /categories/:id/toggle-visibility` dos veces, verificando el listado público tras cada una. |
| Datos de prueba | — |
| Resultado esperado | Tras la 1ª desaparece; tras la 2ª reaparece. |
| Automatizado en | `test/e2e-real/catalogos.e2e-real-spec.ts` — `Categorías › toggle-visibility oculta y vuelve a mostrar la categoría` |

### CP-BE-CAT-004 — Una categoría INACTIVE no aparece en el listado público

| Campo | Contenido |
|---|---|
| ID | CP-BE-CAT-004 |
| Título | Una categoría INACTIVE no aparece en el listado público |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M2 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 2 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. |
| Pasos | 1. `PATCH /categories/:id/status?status=INACTIVE`.<br>2. `GET /categories`. |
| Datos de prueba | status=INACTIVE |
| Resultado esperado | No aparece en el listado público. |
| Automatizado en | `test/e2e-real/catalogos.e2e-real-spec.ts` — `Categorías › una categoría INACTIVE no aparece en el listado público` |

### CP-BE-CAT-005 — Admin actualiza una categoría

| Campo | Contenido |
|---|---|
| ID | CP-BE-CAT-005 |
| Título | Admin actualiza una categoría |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M2 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 2 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. |
| Pasos | 1. `PATCH /categories/:id` con `description`.<br>2. `GET /categories/:id`. |
| Datos de prueba | descripción e2e |
| Resultado esperado | 200 y el cambio persiste. |
| Automatizado en | `test/e2e-real/catalogos.e2e-real-spec.ts` — `Categorías › admin actualiza una categoría (PATCH) y el cambio se refleja` |

### CP-BE-CAT-006 — Rechaza nombre de categoría duplicado

| Campo | Contenido |
|---|---|
| ID | CP-BE-CAT-006 |
| Título | Rechaza nombre de categoría duplicado |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M2 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 2 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. |
| Pasos | 1. Crear categoría.<br>2. Crear otra con el mismo nombre. |
| Datos de prueba | — |
| Resultado esperado | 409. |
| Automatizado en | `test/e2e-real/catalogos.e2e-real-spec.ts` — `Categorías › nombre duplicado -> 409` |

### CP-BE-CAT-007 — Admin elimina una categoría sin relaciones

| Campo | Contenido |
|---|---|
| ID | CP-BE-CAT-007 |
| Título | Admin elimina una categoría sin relaciones |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M2 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 2 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. |
| Pasos | 1. `DELETE /categories/:id`.<br>2. `GET /categories/:id`. |
| Datos de prueba | — |
| Resultado esperado | 204; luego 404 y ya no aparece en el listado. |
| Automatizado en | `test/e2e-real/catalogos.e2e-real-spec.ts` — `Categorías › admin elimina una categoría sin relaciones: 204 y luego 404` |

### CP-BE-CAT-008 — Subcategorías: alta bajo un padre y rechazo de 3er nivel

| Campo | Contenido |
|---|---|
| ID | CP-BE-CAT-008 |
| Título | Subcategorías: alta bajo un padre y rechazo de 3er nivel |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P2 |
| Trazabilidad | M2 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 2 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. |
| Pasos | 1. Crear padre e hija (`parentCategoryId`).<br>2. `GET /categories/subcategories/:parentId`.<br>3. Crear una hija de la hija. |
| Datos de prueba | — |
| Resultado esperado | La hija figura en subcategorías; el tercer nivel da 400. |
| Automatizado en | `test/e2e-real/catalogos.e2e-real-spec.ts` — `Categorías › subcategoría: se crea bajo un padre...` |

### CP-BE-CAT-009 — Mutaciones sin token dan 401 e ids inexistentes 404

| Campo | Contenido |
|---|---|
| ID | CP-BE-CAT-009 |
| Título | Mutaciones sin token dan 401 e ids inexistentes 404 |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M2 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 2 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. |
| Pasos | 1. `POST /categories` sin token.<br>2. `GET /categories/999999`.<br>3. `PATCH /categories/999999` como admin. |
| Datos de prueba | — |
| Resultado esperado | 401, 404, 404. |
| Automatizado en | `test/e2e-real/catalogos.e2e-real-spec.ts` — `Categorías › mutaciones sin token -> 401; id inexistente -> 404` |

### CP-BE-CAT-010 — Un cliente no puede crear una categoría (403)

| Campo | Contenido |
|---|---|
| ID | CP-BE-CAT-010 |
| Título | Un cliente no puede crear una categoría (403) [DEF-BE-002: Corregido (f92e95a); caso `it` normal] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M2 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 2; DEF-BE-002 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. |
| Pasos | 1. Login cliente_a.<br>2. `POST /categories` con su Bearer. |
| Datos de prueba | cliente_a |
| Resultado esperado | 403 (mutación reservada a admin). Antes del fix: 201 (los endpoints solo usan `JwtAuthGuard`, sin `PermissionsGuard`). |
| Automatizado en | `test/e2e-real/catalogos.e2e-real-spec.ts` — `Categorías › cliente sin permiso admin (403 esperado) › DEF-BE-002: cliente_a NO debe poder ...` |

### CP-BE-CAT-011 — Un cliente no puede editar una categoría (403)

| Campo | Contenido |
|---|---|
| ID | CP-BE-CAT-011 |
| Título | Un cliente no puede editar una categoría (403) [DEF-BE-002: Corregido (f92e95a); caso `it` normal] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M2 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 2; DEF-BE-002 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. |
| Pasos | 1. Login cliente_a.<br>2. `PATCH /categories/:id` con su Bearer. |
| Datos de prueba | cliente_a |
| Resultado esperado | 403 (mutación reservada a admin). Antes del fix: 200 (los endpoints solo usan `JwtAuthGuard`, sin `PermissionsGuard`). |
| Automatizado en | `test/e2e-real/catalogos.e2e-real-spec.ts` — `Categorías › cliente sin permiso admin (403 esperado) › DEF-BE-002: cliente_a NO debe poder ...` |

### CP-BE-CAT-012 — Un cliente no puede ocultar una categoría (403)

| Campo | Contenido |
|---|---|
| ID | CP-BE-CAT-012 |
| Título | Un cliente no puede ocultar una categoría (403) [DEF-BE-002: Corregido (f92e95a); caso `it` normal] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M2 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 2; DEF-BE-002 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. |
| Pasos | 1. Login cliente_a.<br>2. `PATCH /categories/:id/toggle-visibility` con su Bearer. |
| Datos de prueba | cliente_a |
| Resultado esperado | 403 (mutación reservada a admin). Antes del fix: 200 (los endpoints solo usan `JwtAuthGuard`, sin `PermissionsGuard`). |
| Automatizado en | `test/e2e-real/catalogos.e2e-real-spec.ts` — `Categorías › cliente sin permiso admin (403 esperado) › DEF-BE-002: cliente_a NO debe poder ...` |

### CP-BE-CAT-013 — Un cliente no puede cambiar el estado de una categoría (403)

| Campo | Contenido |
|---|---|
| ID | CP-BE-CAT-013 |
| Título | Un cliente no puede cambiar el estado de una categoría (403) [DEF-BE-002: Corregido (f92e95a); caso `it` normal] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M2 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 2; DEF-BE-002 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. |
| Pasos | 1. Login cliente_a.<br>2. `PATCH /categories/:id/status?status=INACTIVE` con su Bearer. |
| Datos de prueba | cliente_a |
| Resultado esperado | 403 (mutación reservada a admin). Antes del fix: 200 (los endpoints solo usan `JwtAuthGuard`, sin `PermissionsGuard`). |
| Automatizado en | `test/e2e-real/catalogos.e2e-real-spec.ts` — `Categorías › cliente sin permiso admin (403 esperado) › DEF-BE-002: cliente_a NO debe poder ...` |

### CP-BE-CAT-014 — Un cliente no puede borrar una categoría (403)

| Campo | Contenido |
|---|---|
| ID | CP-BE-CAT-014 |
| Título | Un cliente no puede borrar una categoría (403) [DEF-BE-002: Corregido (f92e95a); caso `it` normal] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M2 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 2; DEF-BE-002 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. |
| Pasos | 1. Login cliente_a.<br>2. `DELETE /categories/:id` con su Bearer. |
| Datos de prueba | cliente_a |
| Resultado esperado | 403 (mutación reservada a admin). Antes del fix: 204 (los endpoints solo usan `JwtAuthGuard`, sin `PermissionsGuard`). |
| Automatizado en | `test/e2e-real/catalogos.e2e-real-spec.ts` — `Categorías › cliente sin permiso admin (403 esperado) › DEF-BE-002: cliente_a NO debe poder ...` |

### CP-BE-CAT-015 — Un id de categoría no numérico da 400/422

| Campo | Contenido |
|---|---|
| ID | CP-BE-CAT-015 |
| Título | Un id de categoría no numérico da 400/422 [DEF-BE-001: Corregido (2dd5228); caso `it` normal] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M2 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 2; DEF-BE-001 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. |
| Pasos | 1. `GET /categories/abc`. |
| Datos de prueba | abc |
| Resultado esperado | 400/422. Antes del fix: 500 `{statusCode,message}`. |
| Automatizado en | `test/e2e-real/catalogos.e2e-real-spec.ts` — `Categorías › DEF-BE-001: GET /categories/abc debe dar 400/422...` |

### CP-BE-CAT-016 — GET /categories/:id de una categoría oculta da 404 como el resto de lecturas públicas

| Campo | Contenido |
|---|---|
| ID | CP-BE-CAT-016 |
| Título | GET /categories/:id de una categoría oculta da 404 como el resto de lecturas públicas [DEF-BE-008: Corregido (dcf2657); caso `it` normal] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P3 |
| Trazabilidad | M2 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 2; DEF-BE-008 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. |
| Pasos | 1. Crear categoría oculta.<br>2. `GET /categories/:id` sin token. |
| Datos de prueba | isVisible=false |
| Resultado esperado | 404 (listados y slug ya la ocultan). Antes del fix: 200 con el detalle. |
| Automatizado en | `test/e2e-real/catalogos.e2e-real-spec.ts` — `Categorías › DEF-BE-008: GET /categories/:id de una categoría oculta...` |

### CP-BE-CAT-016b — El admin sí ve por id la categoría oculta o inactiva

| Campo | Contenido |
|---|---|
| ID | CP-BE-CAT-016b |
| Título | El detalle por id de una categoría oculta/inactiva es visible solo con permiso de categorías (admin) [DEF-BE-008: Corregido (dcf2657)] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P2 |
| Trazabilidad | DEF-BE-008 (regla de visibilidad del listado público aplicada al detalle) |
| Precondiciones | Stack e2e arriba y sembrado; fixture admin. |
| Pasos | 1. Crear categoría oculta y otra visible.<br>2. `GET /categories/:id` de la oculta con token admin.<br>3. Poner la visible en INACTIVE y pedirla sin token y con token admin. |
| Datos de prueba | isVisible=false; status=INACTIVE |
| Resultado esperado | Admin: 200 en ambos. Anónimo/cliente/token inválido: 404 en ambos. |
| Automatizado en | `test/e2e-real/catalogos.e2e-real-spec.ts` — `Categorías › DEF-BE-008: el admin sí ve la categoría oculta o inactiva por id...` |

### CP-BE-CAT-017 — service-types es público y lista solo tipos activos

| Campo | Contenido |
|---|---|
| ID | CP-BE-CAT-017 |
| Título | service-types es público y lista solo tipos activos |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M2 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 2 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. |
| Pasos | 1. `GET /service-types` sin token. |
| Datos de prueba | seed: "Instalación" |
| Resultado esperado | 200; lista no vacía con "Instalación"; todos activos. Endpoint público por diseño (catálogo de lectura). |
| Automatizado en | `test/e2e-real/catalogos.e2e-real-spec.ts` — `Service types › GET /service-types es público...` |

### CP-BE-CAT-018 — Lista pública de países con paginación

| Campo | Contenido |
|---|---|
| ID | CP-BE-CAT-018 |
| Título | Lista pública de países con paginación |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M2 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 2 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. |
| Pasos | 1. `GET /countries` sin token. |
| Datos de prueba | seed: Paraguay (PY) |
| Resultado esperado | 200; `data` incluye PY; `pagination {page,total,...}`. |
| Automatizado en | `test/e2e-real/catalogos.e2e-real-spec.ts` — `Países, monedas e idiomas (públicos, sin guard) › GET /countries (sin token) lista Paraguay con paginación` |

### CP-BE-CAT-019 — Detalle de país: existente 200, inexistente 404

| Campo | Contenido |
|---|---|
| ID | CP-BE-CAT-019 |
| Título | Detalle de país: existente 200, inexistente 404 |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P2 |
| Trazabilidad | M2 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 2 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. |
| Pasos | 1. `GET /countries/1`.<br>2. `GET /countries/999999`. |
| Datos de prueba | — |
| Resultado esperado | 200 y 404. |
| Automatizado en | `test/e2e-real/catalogos.e2e-real-spec.ts` — `... › GET /countries/:id existente 200; inexistente 404` |

### CP-BE-CAT-020 — Monedas públicas con PYG sin decimales

| Campo | Contenido |
|---|---|
| ID | CP-BE-CAT-020 |
| Título | Monedas públicas con PYG sin decimales |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M2 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 2 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. |
| Pasos | 1. `GET /currencies` sin token.<br>2. `GET /currencies/PYG`, `/ZZZ`. |
| Datos de prueba | PYG |
| Resultado esperado | 200 con PYG (`decimalQuantity` 0); `/PYG` 200; `/ZZZ` 404. |
| Automatizado en | `test/e2e-real/catalogos.e2e-real-spec.ts` — `... › GET /currencies (sin token) incluye PYG sin decimales...` |

### CP-BE-CAT-021 — Idiomas públicos es y en

| Campo | Contenido |
|---|---|
| ID | CP-BE-CAT-021 |
| Título | Idiomas públicos es y en |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M2 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 2 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. |
| Pasos | 1. `GET /languages` sin token.<br>2. `GET /languages/:id`, `/999999`. |
| Datos de prueba | es, en |
| Resultado esperado | 200 con es y en; detalle 200; inexistente 404. |
| Automatizado en | `test/e2e-real/catalogos.e2e-real-spec.ts` — `... › GET /languages (sin token) incluye es y en...` |

### CP-BE-CAT-022 — Admin crea un tipo de documento profesional y se lista a usuarios autenticados

| Campo | Contenido |
|---|---|
| ID | CP-BE-CAT-022 |
| Título | Admin crea un tipo de documento profesional y se lista a usuarios autenticados |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M2 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 2 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. |
| Pasos | 1. `POST /admin/professional-document-types`.<br>2. `GET /professional-document-types` como cliente_a (con y sin `?category=`). |
| Datos de prueba | code `E2E_DOC_<HEX>`, QUALIFICATION |
| Resultado esperado | 201; aparece en el listado y en el filtro QUALIFICATION, no en PORTFOLIO. |
| Automatizado en | `test/e2e-real/catalogos.e2e-real-spec.ts` — `ProfessionalDocumentTypes › admin crea un tipo y un usuario autenticado lo ve en el listado` |

### CP-BE-CAT-023 — Admin actualiza y desactiva un tipo de documento

| Campo | Contenido |
|---|---|
| ID | CP-BE-CAT-023 |
| Título | Admin actualiza y desactiva un tipo de documento |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M2 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 2 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. |
| Pasos | 1. `PATCH /admin/professional-document-types/:referenceId` con `name`.<br>2. Idem con `isActive:false`.<br>3. Listar. |
| Datos de prueba | — |
| Resultado esperado | 200 con el nombre nuevo; deja de listarse. No existe DELETE (la baja es lógica). |
| Automatizado en | `test/e2e-real/catalogos.e2e-real-spec.ts` — `ProfessionalDocumentTypes › admin actualiza y desactiva un tipo (PATCH)...` |

### CP-BE-CAT-024 — Permisos del CRUD de tipos de documento

| Campo | Contenido |
|---|---|
| ID | CP-BE-CAT-024 |
| Título | Permisos del CRUD de tipos de documento |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M2 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 2 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. |
| Pasos | 1. cliente_a: POST y PATCH admin.<br>2. Listado sin token.<br>3. PATCH como admin con referenceId inexistente. |
| Datos de prueba | — |
| Resultado esperado | 403, 403, 401, 404. |
| Automatizado en | `test/e2e-real/catalogos.e2e-real-spec.ts` — `ProfessionalDocumentTypes › cliente_a recibe 403 al crear/editar; sin token 401; referenceId inexistente 404` |

### CP-BE-CAT-025 — Rechaza código de tipo de documento duplicado con 409

| Campo | Contenido |
|---|---|
| ID | CP-BE-CAT-025 |
| Título | Rechaza código de tipo de documento duplicado con 409 [DEF-BE-010: Corregido (9b11879); caso `it` normal] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M2 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 2; DEF-BE-010 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. |
| Pasos | 1. Crear un tipo.<br>2. Crear otro con el mismo `code`. |
| Datos de prueba | — |
| Resultado esperado | 409. Antes del fix: 500 (violación de unicidad de Prisma P2002 sin mapear). |
| Automatizado en | `test/e2e-real/catalogos.e2e-real-spec.ts` — `ProfessionalDocumentTypes › DEF-BE-010: código ... duplicado debe dar 409` |

### CP-BE-CAT-026 — Body inválido en alta de tipo de documento da 400/422

| Campo | Contenido |
|---|---|
| ID | CP-BE-CAT-026 |
| Título | Body inválido en alta de tipo de documento da 400/422 [DEF-BE-001: Corregido (2dd5228); caso `it` normal] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M2 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 2; DEF-BE-001 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. |
| Pasos | 1. `POST /admin/professional-document-types` con `{}` como admin. |
| Datos de prueba | {} |
| Resultado esperado | 400/422. Antes del fix: 500. |
| Automatizado en | `test/e2e-real/catalogos.e2e-real-spec.ts` — `ProfessionalDocumentTypes › DEF-BE-001: body inválido ... debe dar 400/422` |

### CP-BE-CAT-027 — TaxConfig sin fila devuelve el fallback seguro

| Campo | Contenido |
|---|---|
| ID | CP-BE-CAT-027 |
| Título | TaxConfig sin fila devuelve el fallback seguro |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M2 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 2 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. |
| Pasos | 1. Vaciar `tax_config` (con respaldo y restauración).<br>2. `GET /tax/config` como cliente_a. |
| Datos de prueba | tabla vacía |
| Resultado esperado | 200 `{isEnabled:false, name:"Sin configurar", rate:0}`. |
| Automatizado en | `test/e2e-real/catalogos.e2e-real-spec.ts` — `TaxConfig / TipConfig sin fila -> fallback seguro › GET /tax/config sin fila...` |

### CP-BE-CAT-028 — TipConfig sin fila devuelve el fallback seguro

| Campo | Contenido |
|---|---|
| ID | CP-BE-CAT-028 |
| Título | TipConfig sin fila devuelve el fallback seguro |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M2 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 2 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. |
| Pasos | 1. Vaciar `tip_config`.<br>2. `GET /tips/config`. |
| Datos de prueba | tabla vacía |
| Resultado esperado | 200 `{isEnabled:true, isMandatory:false, suggestedPercentages:[10,15,20], allowFreeAmount:true}`. |
| Automatizado en | `test/e2e-real/catalogos.e2e-real-spec.ts` — `... › GET /tips/config sin fila...` |

### CP-BE-CAT-029 — Con una fila activa, /tax/config refleja la fila

| Campo | Contenido |
|---|---|
| ID | CP-BE-CAT-029 |
| Título | Con una fila activa, /tax/config refleja la fila |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M2 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 2 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. |
| Pasos | 1. Insertar `TaxConfig` IVA E2E 0.1 habilitada.<br>2. `GET /tax/config`. |
| Datos de prueba | rate 0.1 |
| Resultado esperado | `{isEnabled:true, name:"IVA E2E", rate:0.1}`. |
| Automatizado en | `test/e2e-real/catalogos.e2e-real-spec.ts` — `... › con una fila activa, /tax/config refleja la fila...` |

### CP-BE-CAT-030 — tax/tips config exigen autenticación

| Campo | Contenido |
|---|---|
| ID | CP-BE-CAT-030 |
| Título | tax/tips config exigen autenticación |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M2 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 2 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. |
| Pasos | 1. `GET /tax/config` y `/tips/config` sin token. |
| Datos de prueba | — |
| Resultado esperado | 401 en ambos. |
| Automatizado en | `test/e2e-real/catalogos.e2e-real-spec.ts` — `... › tax/tips config exigen autenticación (401 sin token)` |

### CP-BE-CAT-031 — Un pageSize enorme en /countries se acota o se rechaza

| Campo | Contenido |
|---|---|
| ID | CP-BE-CAT-031 |
| Título | Un pageSize enorme en /countries se acota o se rechaza [DEF-BE-009: Corregido (c0c7d8f); caso `it` normal] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M2 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 2; DEF-BE-009 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. |
| Pasos | 1. `GET /countries?pageSize=100000`. |
| Datos de prueba | pageSize=100000 |
| Resultado esperado | pageSize efectivo <= 100 o 400/422. Antes del fix: se acepta tal cual (`pagination.pageSize`=100000). |
| Automatizado en | `test/e2e-real/catalogos.e2e-real-spec.ts` — `Paginación: pageSize enorme › DEF-BE-009: GET /countries?pageSize=100000 ...` |

### CP-BE-CAT-032 — Un pageSize enorme en /users se acota o se rechaza

| Campo | Contenido |
|---|---|
| ID | CP-BE-CAT-032 |
| Título | Un pageSize enorme en /users se acota o se rechaza [DEF-BE-009: Corregido (c0c7d8f); caso `it` normal] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M2 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 2; DEF-BE-009 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. |
| Pasos | 1. Login admin.<br>2. `GET /users?pageSize=100000`. |
| Datos de prueba | pageSize=100000 |
| Resultado esperado | pageSize efectivo <= 100 o 400/422. Antes del fix: se acepta tal cual. |
| Automatizado en | `test/e2e-real/catalogos.e2e-real-spec.ts` — `Paginación: pageSize enorme › DEF-BE-009: GET /users?pageSize=100000 (admin) ...` |

### CP-BE-CAT-033 — Un pageSize inválido (-1 / abc) da 400/422

| Campo | Contenido |
|---|---|
| ID | CP-BE-CAT-033 |
| Título | Un pageSize inválido (-1 / abc) da 400/422 [DEF-BE-001: Corregido (2dd5228); caso `it` normal] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P2 |
| Trazabilidad | M2 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 2; DEF-BE-001 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. |
| Pasos | 1. `GET /countries?pageSize=-1` y `?pageSize=abc`. |
| Datos de prueba | -1, abc |
| Resultado esperado | 400/422. Antes del fix: 500. |
| Automatizado en | `test/e2e-real/catalogos.e2e-real-spec.ts` — `Paginación: pageSize enorme › DEF-BE-001: pageSize inválido (-1 / abc)...` |

### CP-BE-CAT-034 — GET /categories/all (admin) respeta page y pageSize

| Campo | Contenido |
|---|---|
| ID | CP-BE-CAT-034 |
| Título | GET /categories/all (admin) respeta page y pageSize [DEF-BE-012: Corregido (d80e84a); caso `it` normal] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P2 |
| Trazabilidad | M2 del plan maestro (§3); DEF-BE-012 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`). Fixture admin. |
| Pasos | 1. Login admin y crear 3 categorías.<br>2. `GET /categories/all?page=1&pageSize=2`.<br>3. Última página.<br>4. `?pageSize=101`. |
| Datos de prueba | 3 categorías nuevas, page=1&pageSize=2; pageSize=101 |
| Resultado esperado | 200 con `{data (2 ítems), pagination:{total,page,pageSize,totalPages}}`; última página con el resto; pageSize>100 -> 400. Antes del fix: devolvía todo. |
| Automatizado en | `test/e2e-real/catalogos.e2e-real-spec.ts` — `Categorías: paginación admin y nombre vacío › DEF-BE-012...` |

### CP-BE-CAT-035 — POST/PATCH /categories rechaza name vacío o solo espacios

| Campo | Contenido |
|---|---|
| ID | CP-BE-CAT-035 |
| Título | POST/PATCH /categories rechaza name vacío o solo espacios [DEF-BE-013: Corregido (cba23fa); caso `it` normal] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P3 |
| Trazabilidad | M2 del plan maestro (§3); DEF-BE-013 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`). Fixture admin. |
| Pasos | 1. Login admin.<br>2. `POST /categories` con `name` vacío y con espacios.<br>3. `PATCH /categories/:id` con `name: "  "`. |
| Datos de prueba | name `""` y `"   "` |
| Resultado esperado | 400 en los tres. Antes del fix: 201. |
| Automatizado en | `test/e2e-real/catalogos.e2e-real-spec.ts` — `Categorías: paginación admin y nombre vacío › DEF-BE-013...` |

## Estado de defectos (rama e2e-w1-auth-catalogos)

| DEF | Sev. | Estado |
|---|---|---|
| DEF-BE-001 | Alto | Corregido (2dd5228) |
| DEF-BE-002 | Crítico | Corregido (f92e95a): permiso `categories.catalog:manage` o `admin:all` |
| DEF-BE-008 | Medio | Corregido (dcf2657) |
| DEF-BE-009 | Medio | Corregido (c0c7d8f): tope `pageSize` = 100 |
| DEF-BE-010 | Medio | Corregido (9b11879) |
| DEF-BE-012 | Medio | Corregido (d80e84a): `/categories/all` paginado, tope 100 |
| DEF-BE-013 | Bajo | Corregido (cba23fa): `name` con trim + `@IsNotEmpty()` |
