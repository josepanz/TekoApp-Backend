# H-01 · Opciones de error-tracking/APM — NO implementado por decisión de José

Origen: `openspec/changes/platform-hardening-2026-09/WORKPLAN.md` §4, H-01. **José pidió
explícitamente NO implementar esto** — agrega una dependencia y un servicio externo con costo, y
esa decisión no la toma un modelo solo. Este documento presenta las opciones para que José decida;
no hay código, no hay integración, no hay elección hecha.

**Verificación previa** (confirma que el gap es real): `grep -rin "sentry|newrelic|datadog|opentelemetry"
package.json src/` → sin resultados. Hoy `nestjs-pino` + Seq dan logging estructurado, pero
ninguna herramienta avisa en tiempo real cuando algo falla — hay que ir a mirar el log.

## Opción A — Sentry (SaaS)

- **Qué es**: error tracking dedicado, SDK de NestJS maduro (`@sentry/nestjs`), agrupa excepciones
  por stack trace, alerta por Slack/email, guarda contexto de request.
- **Costo**: plan gratuito (Developer) — 5.000 errores/mes, 1 usuario, retención 30 días. Plan Team
  (~US$26/mes) si se necesita más de un usuario con acceso o más volumen. Paraguay no tiene
  restricción de residencia de datos que yo conozca para este caso de uso, pero verificar si aplica
  alguna política interna de dónde vive el dato de request bodies antes de activarlo.
- **Qué implica**: nueva dependencia (`@sentry/nestjs` + `@sentry/node`), nueva variable de entorno
  (DSN), scrubbing de datos sensibles a configurar ANTES de activar (documentos de identidad,
  antecedentes, pagos, consentimientos — este backend maneja los 4). Es la opción con menos
  fricción de setup y el ecosistema más grande si después se quiere Performance Monitoring o
  Session Replay (no aplica a un backend, pero es parte del mismo producto).

## Opción B — GlitchTip (self-hosted, API-compatible con Sentry)

- **Qué es**: OSS, implementa el mismo protocolo/API que Sentry (el SDK de Sentry funciona sin
  cambios apuntando a un GlitchTip propio) — mismo agrupado de errores, mismas alertas por
  email/Slack, sin el volumen limitado de un free tier de terceros.
- **Costo**: sin costo de licencia, pero corre en infraestructura propia (un contenedor Docker +
  Postgres) — hay que sumarle el costo de hosting (¿el mismo K3s que ya corre esta API, según
  `.claude/rules/infra.md`? sería el camino más barato) y el tiempo de mantenerlo actualizado.
- **Qué implica**: mismo SDK que la Opción A del lado del código (`@sentry/nestjs`), cambia solo el
  DSN de destino — más trabajo de infraestructura, cero costo recurrente de SaaS, dato 100% en
  infra propia (relevante si el scrubbing de datos sensibles falla en algún caso — el radio de
  exposición queda contenido).

## Opción C — Extender lo que ya existe (Seq) en vez de sumar una herramienta nueva

- **Qué es**: Seq ya está integrado (`nestjs-pino` + transporte a Seq, `ObservabilityModule`) y ya
  recibe cada log de error. Seq tiene alertas propias ("Seq.App.Slack"/webhooks) sobre consultas
  guardadas — se podría armar una alerta sobre `level:Error` sin agregar ninguna librería nueva al
  `package.json`.
- **Costo**: si el plan de Seq actual ya cubre esto, **cero costo adicional**. Verificar el plan
  contratado — la edición gratuita de Seq (single-user) puede no incluir alertas/apps; si hace
  falta subir de plan, ahí sí hay un costo a cotizar.
- **Qué implica**: cero dependencia nueva de código, pero **no agrupa errores por tipo/stack trace**
  como Sentry/GlitchTip — es una alerta de "pasó algo", no un panel de "este error pasó 40 veces
  esta semana, acá está la tendencia". Para el volumen actual (pocos usuarios reales) puede alcanzar;
  para triage a escala se queda corto frente a A/B.

## Puntos de enganche (para cuando se decida, no ahora)

Los mismos para las 3 opciones, ya identificados en el WORKPLAN original:

1. `AllExceptionsFilter` (`src/core/filters/http-exception.filter.ts`) — capturar cada excepción no
   manejada con el contexto del request (ruta, método, `requestId`, usuario si hay).
2. El futuro callback de Dinelco (`0014-dinelco-checkout-integration.md`) — un fallo ahí deja plata
   en un estado inconsistente y hoy sería silencioso.

**Scrubbing obligatorio antes de activar cualquiera de las 3**: nunca mandar bodies de request
completos, headers de auth, ni contenido de `professional-documents` — mismo estándar que ya aplica
`ObservabilityModule.formatPayload` a los logs de Seq hoy (sanitiza `password`/`token`/`secretKey`,
trunca payloads >1MB). Si no se puede garantizar el mismo nivel de scrubbing en la herramienta
elegida, no está lista para activarse.

## Recomendación (no vinculante)

Si el volumen de errores real sigue siendo bajo (pocos usuarios activos hoy), **Opción C** es el
camino de menor costo/esfuerzo para salir del "nadie se entera en tiempo real". Si el producto
escala y se necesita triage serio de errores agrupados, **Opción A** (Sentry free tier) es la de
menor fricción para arrancar, con **Opción B** como salida si el volumen supera el free tier y se
prefiere no pagar SaaS recurrente.
