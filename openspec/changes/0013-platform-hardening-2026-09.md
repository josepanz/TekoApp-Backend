# Fase 0013 — Endurecimiento de plataforma (Backend)

Auditoría completa y transversal: `openspec/specs/platform-audit-2026-09.md`.
Contrapartes: `TekoApp-Frontend-Web/openspec/changes/0007-platform-hardening-2026-09.md`,
`TekoApp-Frontend-Mobile/openspec/changes/0017-platform-hardening-2026-09.md`.

## Contexto

Auditoría pedida por José 2026-09-04 sobre los 3 repos, con foco en comunicación entre servicios,
performance y sostenibilidad. Todos los hallazgos de abajo fueron verificados abriendo el archivo
citado — cuatro de los hallazgos crudos de los agentes venían mal o incompletos y se corrigieron
antes de escribir esto (ver la tabla de correcciones en la spec).

## Fase A — Webhook de Stripe (CRÍTICO, dinero)

Estado hoy: `@Post('webhooks/:provider')` (`payments.controller.ts:205`) hereda
`@UseGuards(JwtAuthGuard)` de la clase (`:60`) → Stripe recibe 401 y **el webhook nunca corre**.
`processStripeWebhook` (`payments.service.ts:292-318`) lee `payload.type`/`payload.data.object`
crudos, y `constructEvent` no aparece en ningún lado del repo pese a que
`STRIPE_WEBHOOK_SECRET` es `required` en `config-schema.ts:70`.

- [ ] A1 — Crear `src/common/decorators/public.decorator.ts` (`IS_PUBLIC_KEY` + `SetMetadata`) y
      hacer que `JwtAuthGuard` lo respete vía `Reflector`. **No existe hoy**: hay 7 decoradores en
      `common/decorators/` y ninguno de ruta pública; esta es la pieza faltante, no un detalle.
- [ ] A2 — Registrar `express.raw({ type: 'application/json' })` acotado a la ruta del webhook. El
      `bodyParser` JSON global destruye el buffer crudo que la verificación de firma necesita.
- [ ] A3 — Verificar la firma con `constructEvent(rawBody, headers['stripe-signature'], secret)`;
      rechazar con 400 lo que no valide, antes de tocar la DB.
- [ ] A4 — Tests: firma válida procesa el evento; firma inválida devuelve 400 y no escribe nada;
      provider desconocido sigue devolviendo el error actual.
- [ ] **Checkpoint A**: `pnpm run lint`/`format`/`test` en verde + boot real contra la DB.

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

- [ ] Un evento de Stripe con firma válida actualiza el pago; uno forjado se rechaza con 400.
- [ ] Login y pagos tienen su propio límite de tasa, distinto del general.
- [ ] `findNearby` usa un índice medible (comparar `EXPLAIN ANALYZE` antes/después).
- [ ] Una excepción no controlada genera una alerta, no solo una línea de log.
