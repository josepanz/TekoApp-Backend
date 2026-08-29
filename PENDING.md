# Pendientes y decisiones abiertas — TekoApp-Backend

Consolidado 2026-08-29. Objetivo: un solo lugar para ver qué queda sin resolver, sin tener que
recorrer `openspec/decisions.md` fase por fase. Actualizar esta lista al cerrar o abrir un
pendiente nuevo — no dejar que decisions.md sea la única fuente de verdad de "qué falta".

## 1. Decisiones de negocio/legal/fiscal que NO se pueden resolver con código

Estas requieren un insumo externo (asesoría real) — el código ya tiene la estructura lista, solo
falta cargar el dato real cuando exista.

- **Copy legal de contratos**: `src/api/contracts/const/contracts.const.ts` tiene
  `CONTRACT_LEGAL_DISCLAIMER_PLACEHOLDER` marcado `TODO(legal)` — texto genérico, no el real de
  asesoría legal. Se incluye tal cual en el PDF de cada contrato firmado. Reemplazar antes de
  producción.
- **`TaxConfig` (IVA por país)**: modelo listo (`prisma/schema.prisma`), wireado a
  `PaymentApiService.createPayment` (Fase 0011), pero **sin ninguna fila cargada** — el default es
  `isEnabled: false, rate: 0`, así que hoy no se cobra ningún IVA. Cuando exista una tasa real
  definida por asesoría fiscal (por país), cargar una fila de `TaxConfig` — no hace falta tocar
  código.
- **`USER_CONTENT_LIABILITY_DISCLAIMER`** (nuevo tipo de `LegalDocumentType`, Fase 0011): la
  infraestructura de consentimiento (versión + aceptación + guard) está lista y reusa el 100% de
  lo existente, pero **ninguna ruta la exige todavía** (`@RequiresActiveConsent(...)` no está
  puesto en ningún controller). Falta decidir: ¿qué acción de contenido generado por el usuario
  (¿publicar una reseña? ¿subir una foto de un servicio?) debe bloquear si no se aceptó este
  documento? Es una decisión de producto/legal, no técnica.
- **`Category.requiresProfessionalSignature`**: no implementado — para contratos donde el
  profesional no debería firmar (caso no pedido explícitamente todavía). Ver
  `openspec/specs/service-contracts.md`.

## 2. Deuda técnica conocida, no corregida (documentada a propósito)

- **`Payments.professionalNetAmount`**: campo `Decimal?` en el schema, **nunca escrito** por
  ningún código (`createPayment` no lo calcula). Siempre `null`. A diferencia de
  `Payments.platformFee` (que sí se corrigió en la Fase 0011 — ver más abajo), este campo requiere
  definir una fórmula de negocio real: ¿el profesional recibe `totalAmount - platformFee - tax`?
  ¿la comisión del proveedor de pago (`fee`) la absorbe la plataforma o se descuenta también del
  profesional? Nadie pidió resolver esto todavía — no inventar la fórmula sin confirmarla.
- **`GET /payments/:id/tip`** (endpoint de Tips) sin chequeo de ownership — cualquier usuario
  logueado puede consultar la propina de cualquier pago conociendo su `referenceId`. Se mantuvo
  consistente con el criterio ya existente antes de la Fase 0011 (no se amplió la laxitud, tampoco
  se corrigió — el dato en sí, monto+modo de una propina, es de sensibilidad baja).
- **`getPaymentByIdForViewer`** (Fase 0011, hardening de `GET /payments/:id`) solo compara contra
  `payment.userId` (el pagador) — no contra `payment.professionalId`. Si en el futuro se necesita
  que un profesional vea el detalle de un pago que recibió, hay que ampliar ese check
  explícitamente (hoy ningún cliente — Web ni Mobile — tiene una pantalla de "pagos recibidos" para
  profesionales).
- **Todos los modelos de config parametrizados por país resuelven siempre el default global**
  (`countryId: null`) — `TipConfig`, `TaxConfig`, `LegalDocumentVersions`. No existe todavía
  resolución real de país por `Service`/`User` en el dominio. Documentado en cada fase, nunca
  resuelto — es una limitación transversal, no de un modelo puntual.
- **`Payments.tax`/`platformFee` — corregido en Fase 0011**, ya NO es deuda técnica: `tax` ahora es
  IVA real (vía `TaxService`), `platformFee` es la comisión de la plataforma (antes mal guardada en
  `tax`). Se deja esta nota acá solo como registro histórico — si alguna vez se ve código o un
  comentario viejo que diga "`tax` = comisión de plataforma", está desactualizado.

## 3. Permisos/roles: tarea de datos pendiente (no de código)

Ningún rol además de `ADMIN` (que tiene `admin:all`, cubre todo por `.some()` en
`PermissionsGuard`) tiene asignado ninguno de estos permisos granulares — existen en
`PERMISSIONS` enum y están cableados en sus guards, pero **nadie sin `admin:all` puede usarlos
hoy**:

- `service-progress.audit:read` (Fase 0002)
- `ratings.audit:read` (Fase 0009)
- `payments.audit:read` (Fase 0011/extensión)
- `contracts.audit:read` (Fase 0004)
- `legal.consent-audit:read`, `legal.config:manage` (Fase 0006) — José confirmó que estos dos van
  tanto a `admin` como a un rol **`compliance`** nuevo, todavía sin crear en el seed.

Cuando se decida crear el rol `compliance` (o asignar estos permisos a un rol de staff existente),
es un `INSERT`/seed, no un cambio de código.

## 4. Checkpoints de negocio con datos/dispositivos reales (responsabilidad de José, no de código)

Todos verificados con tests unitarios/e2e simulados y, donde aplicó, boot real contra Supabase —
pero ninguno probado end-to-end con los 3 repos (Backend + Web + Mobile) corriendo juntos y cuentas
reales:

- Subir un documento profesional real desde Mobile → verlo en la cola de Web → aprobarlo/rechazarlo
  → confirmar que Mobile refleja el cambio.
- Aceptar un consentimiento legal real y verificar el flujo de bloqueo/desbloqueo end-to-end.
- Armar y aceptar un presupuesto multi-opción real (profesional arma, cliente compara y elige).
- Firmar un contrato real de punta a punta (cliente y profesional, ambas firmas, PDF final).
- Dejar una propina real sobre un pago real.
- Ver el historial/detalle de pagos propios desde el modo cliente de Web (`(client)/mis-pagos`,
  Fase 0011/extensión) con datos reales.

## 5. Infraestructura — configuración incompleta o en simulación

- **`ci/*/1_deployment.yml` — job `deploy` del pipeline** (`.github/workflows/pipeline.yml`) está
  en modo simulación: el paso real de GitOps/ArgoCD está comentado (`TODO(deploy-activate)`). El
  deploy real hoy pasa por Render (conectado directo al repo, fuera de este pipeline) — ver
  `openspec/decisions.md`/memoria de proyecto sobre el deploy free-tier.
- **`dev`/`qa`/`prod` comparten hoy la misma instancia de Render/Supabase/Redis/Mongo** (decisión
  explícita temporal, ver memoria de proyecto). Cuando cada ambiente tenga su propio backend/DB,
  hay que actualizar las env vars de `API_BASE_URL` en los 3 repos (ver
  `TekoApp-Frontend-Mobile/openspec/decisions.md`, sección `API_BASE_URL` de CI/CD).
- **Google Maps API key**: env var configurada pero sin ningún caller real — `calculateDistance`/
  `findNearbyProfessionals` usan Haversine puro. Si se necesita mapas de verdad en el futuro,
  evaluar OpenStreetMap como alternativa gratuita antes de activar la key real.
- **Twilio**: sin número de producción real configurado (`TWILIO_PHONE_NUMBER` debe ser el número
  que Twilio asigna gratis, no el celular personal de José usado hoy como "Verified Caller ID" en
  modo trial).

## 6. Roadmap futuro documentado pero sin spec (no arrancado)

- **Reportes/exports con más libertad de diseño desde Web**: arquitectura ya decidida (backend
  responde un export job asíncrono en JSON paginado + notificación push VAPID al completarse;
  frontend genera el PDF client-side con `@react-pdf/renderer`, no `pdfmake`) — ver
  `openspec/decisions.md`, nota al cierre de la Fase 0004 (contratos). Sin spec `000N-*.md` propia
  todavía, sin implementar.

## 7. PR abierto, en pausa deliberada

**PR #36** ("Consentimiento legal, disclosure de IA y spec de registro de usuarios") contra
`develop` — quedó abierto a propósito desde 2026-08-26 hasta cerrar el resto del roadmap en curso
(bitácora, documentos, auditoría legal, presupuestos, contratos, y luego el backlog de 5 features
post-Fase 0004). **Ese roadmap ya cerró por completo el 2026-08-28/29** — este PR es candidato a
mergear ahora, pero confirmarlo explícitamente antes de hacerlo (la nota del PR decía "no mergear
todavía" sin fecha de reactivación).
