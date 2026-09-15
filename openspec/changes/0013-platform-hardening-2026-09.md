# Fase 0013 — Endurecimiento de plataforma (Backend)

Auditoría completa y transversal: `openspec/specs/platform-audit-2026-09.md`.
Contrapartes: `TekoApp-Frontend-Web/openspec/changes/0007-platform-hardening-2026-09.md`,
`TekoApp-Frontend-Mobile/openspec/changes/0017-platform-hardening-2026-09.md`.

## Contexto

Auditoría pedida por José 2026-09-04 sobre los 3 repos, con foco en comunicación entre servicios,
performance y sostenibilidad. Todos los hallazgos de abajo fueron verificados abriendo el archivo
citado — cuatro de los hallazgos crudos de los agentes venían mal o incompletos y se corrigieron
antes de escribir esto (ver la tabla de correcciones en la spec).

## Fase A — Webhook de pagos (CRÍTICO, autorización) ✅ CERRADA 2026-09-04

**El plan original de esta fase cambió al verificarlo contra el código.** Decía "implementar
verificación de firma de Stripe". Al auditar en profundidad aparecieron dos cosas que lo
invalidaban:

1. **Stripe nunca estuvo integrado.** `stripe@^14.0.0` está en `package.json` pero **no se importa
   en ningún archivo de `src/` ni `test/`**. Los pagos son internos/simulados. O sea: no era cierto
   que "los webhooks estuvieran rotos en producción" — no había nada mandándolos.
2. **El riesgo real era otro y estaba vivo.** El endpoint tomaba un `externalId` arbitrario del
   body y, vía `handlePaymentResult`, flipeaba el estado del pago/transacción correspondiente,
   protegido únicamente por `JwtAuthGuard` — que exige *una sesión válida, no un permiso*.
   **Cualquier usuario logueado podía marcar cualquier pago como COMPLETED.**
3. Decisión de José 2026-09-04: la pasarela real es **Dinelco Checkout (BEPSA)**, no Stripe. Así
   que implementar `constructEvent` habría sido trabajo tirado.

Resolución aplicada: **remover la superficie HTTP** en vez de gatearla con permiso de admin. No
existe una versión legítima de "flipear el estado de un pago desde un body arbitrario" que sea una
operación de admin, y el contrato de callback de Dinelco va a ser completamente distinto, así que
el esqueleto con forma de Stripe no tenía valor de reuso.

- [x] A1 — Removida la ruta `POST /payments/webhooks/:provider` (`payments.controller.ts`).
      Verificado antes de remover: **ningún cliente la llamaba** — aparece en el
      `types.generated.ts` de Web solo porque se genera del swagger, no porque algún código la use.
- [x] A2 — Removidos `processWebhook`, `processStripeWebhook` y `handlePaymentResult` de
      `payments.service.ts`, con un comentario que documenta por qué y apunta a la spec de Dinelco.
- [x] A3 — Removidos los huérfanos: `PaymentWebhookParamDTO` (archivo borrado + barrel),
      `ApiHandleWebhook` (`payments.docs.ts`), y los mocks/tests del webhook.
- [x] A4 — Test de regresión que falla si alguien vuelve a exponer `handleWebhooks` sin querer.
- [x] A5 — Spec de la pasarela real: `openspec/changes/0014-dinelco-checkout-integration.md`, con
      el diseño del callback hecho bien (controller propio fuera del guard de sesión, verificación
      de autenticidad antes de tocar la DB, idempotencia con `updateMany` condicional) y la lista
      de datos que faltan de la doc de Dinelco.
- [x] **Checkpoint A**: `pnpm run lint` 0 errores, `pnpm run format` sin cambios, `pnpm run test`
      112 suites / 1286 tests en verde, `pnpm run build` OK.

**Se mantiene**: `PaymentDbService.findTransactionByExternalId` — es un primitivo genérico, ya
testeado, que la integración de Dinelco va a necesitar igual.

**Deuda que queda registrada**: `stripe` sigue en `package.json` y el bloque `stripe` sigue en
config exigiendo un `STRIPE_WEBHOOK_SECRET` que nadie consume. Se remueven en la Fase 0014 (tarea 2)
para no mezclar la remoción de una dependencia con un fix de seguridad.

## Fase D — Performance y resiliencia

- [ ] D1 — Índice compuesto en `Professionals` para el patrón real de `findNearby`
      (`locations-db.service.ts:81-105`). Hoy solo hay `@@index([status])` y `@@index([isAvailable])`
      (`schema.prisma:412-413`), ambos de columna simple: la consulta calcula Haversine sobre toda
      la tabla antes de podar por radio. Evaluar `(status, isAvailable, isOnline, categoryId)` vs.
      migrar a `earthdistance`/PostGIS con índice GiST — decidir con medición, no a ojo.
- [ ] D2 — Cablear `authLimiter` (5/15min) y `paymentLimiter` (20/h) a sus rutas. Hoy
      `middleware.config.ts:53` aplica **solo** `limiters.general`; los otros cuatro que
      `RateLimitConfig.createLimiter` construye son código muerto.
- [ ] D3 — Decidir `professionalNetAmount`: hoy se expone en `payment-detail.response.dto.ts:95` y
      **nunca se escribe** — la API publica un campo siempre `null`. Opciones: (a) quitarlo del DTO
      hasta que exista payout, (b) calcularlo ya (monto − comisión − impuesto). Elegir con José.
- [ ] **Checkpoint D**: tests + migración aplicada y verificada + boot real.

## Fase H — Observabilidad y seguridad de pipeline

- [ ] H1 — Integrar Sentry (o equivalente) en `AllExceptionsFilter`
      (`core/filters/http-exception.filter.ts`) y explícitamente en el camino del webhook. Hoy no
      hay APM/error-tracking en absoluto; el logging estructurado (`nestjs-pino` + Seq) existe pero
      nadie recibe una alerta.
- [ ] H2 — Agregar etapa de scan de seguridad al pipeline (`.github/workflows/pipeline.yml`:
      `lint → test → docker → release → deploy`, sin `scan`). Ya estaba documentado como pendiente
      en `.claude/rules/infra.md`; confirmado que sigue faltando.
- [ ] **Checkpoint H**: pipeline verde con la etapa nueva.

## Fase I — Specs de sostenibilidad (documentación, sin código)

- [ ] I1 — Spec de **borrado de cuenta** (obligación legal: Apple 5.1.1(v), Google Play, Ley PY
      6534/2020). Debe cubrir: qué se borra vs. qué se anonimiza (pagos y contratos tienen
      retención legal), ventana de gracia, y el endpoint que Mobile/Web consumirán.
- [ ] I2 — Spec de **payouts a profesionales**: sin esto el marketplace no cierra el ciclo. Ligado
      a D3.
- [ ] I3 — Spec de **disputas/contracargos**: hoy hay reembolso pero no el proceso que lo justifica
      ni quién lo adjudica.
- [ ] I4 — Nota de arquitectura sobre versionado/compatibilidad de API: hoy un DTO breaking rompe
      Web y Mobile a la vez, y Mobile ya instalado no se "redespliega".

## Deuda de diseño registrada (no accionada en esta fase)

- Tres señales de verificación conviviendo en `Professionals` (`schema.prisma:363-378`):
  `status`, `verificationStatus` (String libre) y `requiredDocumentsVerified`. El schema ya
  documenta una colisión pasada. Candidato a normalizar a enum.
- `locations-db` (Postgres) vs `tracking-db` (Mongo): división correcta, nombres que no la
  explican. Además `tacking-db` tiene un typo en el nombre del archivo/módulo.
- Cobertura de tests fina en los módulos más nuevos: `professional-portfolio` (1 spec / 4 fuentes),
  `contracts` (1/7), `budgets` (1/3), `service-progress` (1/3).

## Checkpoint de salida (Backend)

- [x] Ningún usuario con sesión puede alterar el estado de un pago desde un endpoint sin permiso.
      (La verificación de firma del callback real se traslada a la Fase 0014 — Dinelco Checkout.)
- [ ] Login y pagos tienen su propio límite de tasa, distinto del general.
- [ ] `findNearby` usa un índice medible (comparar `EXPLAIN ANALYZE` antes/después).
- [ ] Una excepción no controlada genera una alerta, no solo una línea de log.
