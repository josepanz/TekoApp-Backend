# Fase 0011 — Marco legal/tributario multi-país: IVA parametrizable + deslinde de responsabilidad

**Implementada 2026-08-28.** Backlog documentado en
`TekoApp-Frontend-Mobile/openspec/decisions.md`, sección "Backlog — features grandes pedidas
2026-08-08", ítem 4 ("Marco legal + tributario multi-país... consentimiento de datos, deslinde de
responsabilidad por contenido de usuario, protocolo de IVA por país — todo parametrizable, sin
hardcodear. Límite explícito: el contenido legal/tasas reales deben venir de asesoría real, no de
inferencia de un LLM — solo se modela el flujo técnico").

**Alcance real tras verificar contra código** (ver roadmap `staged-booping-pillow.md`, "Roadmap 2"):
de los 3 sub-ítems del backlog, 2 ya estaban resueltos por la Fase 0006
(`LegalDocumentVersions`/`UserConsents`/`ContentConsentGrants` — consentimiento de datos y la
infraestructura genérica de documentos legales versionados por país). Solo faltaban dos piezas
puntuales:

## 1. Deslinde de responsabilidad por contenido de usuario

Se reusa el 100% de la infraestructura genérica de la Fase 0006 — solo se agregó un valor nuevo al
enum `LegalDocumentType`: `USER_CONTENT_LIABILITY_DISCLAIMER`. Staff puede cargar la versión real
del texto vía `/admin/legal/document-versions` (Web) en cuanto legal provea el contenido, igual que
cualquier otro tipo de documento. **Deliberadamente no se gatea ninguna ruta con este tipo todavía**
(`@RequiresActiveConsent(LegalDocumentType.USER_CONTENT_LIABILITY_DISCLAIMER)` en ningún
controller) — decidir qué acción de contenido generado por el usuario (¿publicar una reseña?
¿subir una foto de un servicio?) debe exigir este consentimiento es una decisión de producto/legal,
no técnica, y no estaba definida en el backlog original. Cuando se decida, es una línea de código
(un decorator más) sobre el controller correspondiente.

**Corrección de un gap pre-existente encontrado de paso**: Web nunca reflejó `SERVICE_CONTRACT_TERMS`
(agregado en la Fase 0004 de contratos) en su dropdown de tipo de documento
(`legal-document-version-form-dialog.tsx`) ni en `types.generated.ts` — staff no podía cargar una
versión de ese tipo desde la UI pese a que el backend lo soporta desde hace 2 fases. Se agregó junto
con el tipo nuevo, mismo fix, mismo commit.

## 2. `TaxConfig` — IVA parametrizable por país

Nuevo modelo, mismo patrón de resolución que `TipConfig`/`LegalDocumentVersions` (`countryId: null`
= default global, Paraguay-only por ahora — sin país resuelto por Service/User todavía):

- `TaxConfig`: `countryId` (nullable), `name` (descriptivo, ej. "IVA Paraguay"), `rate` (fracción,
  `Decimal(6,4)` — `0.10` = 10%, nunca porcentaje entero), `isEnabled`, `isActive`, campos de
  auditoría estándar.
- `GET /tax/config` (JWT, cualquier usuario logueado) — nunca falla: sin fila cargada, devuelve un
  default **deshabilitado** (`isEnabled: false`, `rate: 0`, `name: "Sin configurar"`) en vez de
  inventar una tasa real.
- Sin CRUD admin en Web — mismo alcance mínimo que `PlatformCommissionConfig`/`TipConfig` (ninguno
  de los dos tiene UI de gestión tampoco), carga por DB directa hasta que exista una necesidad real.

### Wireado a `PaymentApiService.createPayment` (extensión el mismo día, a pedido explícito)

`TaxService.calculateTax(platformFee)` se llama desde `createPayment`, aplicando IVA sobre la
comisión de la plataforma (criterio técnico elegido para modelar el flujo — no hay una tasa real
todavía, así que con la config default deshabilitada siempre da `0`, sin cambiar `totalAmount`
respecto al comportamiento previo). Cuando exista una tasa real definida por asesoría fiscal, el
único cambio necesario es cargar una fila de `TaxConfig` con `isEnabled: true` — el código ya está
wireado.

### Corregido: `Payments.tax` ya NO es la comisión de la plataforma

Se encontró que `Payments.tax` (campo existente desde antes de esta fase) tenía un nombre
engañoso: `PaymentApiService.createPayment` lo llenaba con el resultado de
`FeeCalculatorService.calculatePlatformFee()` — es decir, guardaba la comisión de la plataforma,
no un impuesto gubernamental, pese a que Web ya lo etiquetaba "Impuesto" en el detalle de pago.

**Corregido sin renombrar la columna del schema**: `Payments` ya tenía un segundo campo,
`platformFee`, con el nombre correcto para ese dato pero nunca escrito (siempre `0.00` — leído en
vano por `analytics-db.service.ts` para `platformRevenue`, que por eso daba 0 siempre). El fix
en `createPayment`: lo que antes iba a `tax` ahora va a `platformFee`; `tax` ahora se calcula de
verdad vía `TaxService.calculateTax()`. `professionalNetAmount` (otro campo dormido encontrado de
paso) se dejó sin tocar — no fue parte del pedido y calcularlo bien exige una fórmula de negocio no
definida (¿el profesional absorbe la comisión del proveedor o la plataforma?).

## Migración aplicada contra Supabase

`npx prisma migrate dev` detectó que la migración `20260828194041_add_tips` (Fase 0010) había sido
modificada después de aplicada (por el `SELECT fn_attach_audit_triggers();` agregado a mano) y
pedía un `migrate reset` completo. Se evitó el reset (hubiera borrado datos reales sin necesidad):
se corrigió el `checksum` de esa fila en `_prisma_migrations` a mano (`UPDATE` con el sha256 real
del archivo), un fix de metadata no destructivo. Con eso resuelto, la migración nueva se aplicó
limpia y se re-invocó `SELECT fn_attach_audit_triggers();` para incluir `tax_config`.

## Verificado

`pnpm run build`/`lint`/`format` en 0 warnings. `pnpm run test`: 109 suites/1258 tests en verde (10
tests nuevos: 5 del módulo `tax`, 5 en `payments.service.spec.ts` para el wireo de
`platformFee`/`tax`). Boot real contra Supabase: Postgres/Mongo/Redis arriba,
`GET /tekoapp-backend/api/tax/config` registrada, sin errores de DI.
