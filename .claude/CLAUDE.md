<!-- PROJECT: tekoapp-backend v1.0 -->

# tekoapp-backend

## Dominio

Backend NestJS para marketplace de servicios: conecta usuarios (quienes solicitan servicios) con profesionales (quienes los ofrecen). Gestiona onboarding, perfiles, solicitudes de servicio, pagos (Stripe), calificaciones, promociones, geolocalización y notificaciones.

Arquitectura en dos capas: `src/api/` (capa HTTP — controllers, DTOs, services orquestadores) → `src/modules/` (lógica reutilizable — servicios de negocio, conexiones DB vía Prisma, integraciones externas).

## Estructura clave

- `api/*` — Controllers + DTOs + services orquestadores (nunca acceden a Prisma directo)
- `modules/auth` — JWT custom, guards, decorators, access/refresh tokens, cookies
- `modules/users` — gestión de usuarios
- `modules/onboarding` — flujo de registro de usuarios y profesionales
- `modules/email` — envío de emails (nodemailer)
- `modules/notifications` — notificaciones push (Firebase)
- `modules/*-db` — abstracción Prisma por dominio (users-db, payments-db, categories-db, locations-db, analytics-db, etc.)
- `core/database` — `PrismaDatasource` central (usa `.extended` para audit triggers)
- `core/config` — cargador de configuración con validación JOI, token `APP_CONFIG`
- `common/` — decorators, filters, pipes, validators, helpers compartidos

## Clientes que consumen este backend

| Cliente | Auth | Propósito |
|---------|------|-----------|
| TekoApp-Web | JWT custom / Basic Auth (pre-login) | Portal web — gestión, configuración, vista de datos |
| TekoApp-Mobile | JWT custom / Basic Auth (pre-login) | App móvil multiplatforma para usuarios y profesionales |

## Proveedores externos consumidos

| Proveedor | Auth | Propósito |
|-----------|------|-----------|
| Stripe | Bearer (secret key) | Pagos, métodos de pago, webhooks |
| Firebase | Service account | Notificaciones push |
| Twilio | Account SID + Auth Token | SMS (verificación de teléfono) |
| AWS S3 | Access key | Almacenamiento de archivos |
| Google Maps | API key | Geolocalización, servicios cercanos |
| MongoDB | URI | Colecciones de notificaciones (Mongoose) |
| Redis | Host + password | Colas Bull, caché |

## Auth

JWT custom — access token + refresh token + cookies. Basic Auth para endpoints pre-login (onboarding, recuperación de contraseña).
Siempre usar guards y decorators de `modules/auth`. Nunca implementar autenticación inline.

## Base de datos

PostgreSQL local vía Prisma. Cada módulo `-db` encapsula su dominio.
**Nunca llamar `PrismaDatasource` directamente desde `api/*`** — siempre a través del módulo `-db` correspondiente.
**Siempre usar `prisma.extended.*`** para coexistir con los audit triggers.

## Reglas críticas

- DTOs explícitos en request/response — nunca tipos genéricos ni `any`
- Guards del módulo auth en todos los controllers de `api/*` (excepto endpoints Basic Auth pre-login)
- Transacciones Prisma en escrituras multi-tabla
- Config loader en `core/config` para todos los secrets — nunca `process.env` directo fuera de core
- `common/` solo para utilidades compartidas — sin lógica de negocio ni conexiones a DB
- `DatabaseModule` es `@Global()` — los módulos `-db` deben importar `DatabaseModule`, nunca `PrismaDatasource` directamente en `imports[]`
- @./rules/infra.md
- @./rules/typescript.md
- @./rules/test.md
- @./rules/datetime.md
- @./rules/database-conventions.md

## Agentes

- @./agents/code-reviewer.md
- @./agents/db-advisor.md
- @./agents/testing-agent.md
- @./agents/tdd-refactor.md

## graphify

Este proyecto tiene un grafo de conocimiento en `graphify-out/` (god nodes, comunidades,
relaciones cross-file), generado 2026-07-21 sobre `src/`, `.claude/`, `prisma/`, `ci/`, etc.
(se excluyó `docs/`, output auto-generado de compodoc).

- Para preguntas sobre el código, primero correr `graphify query "<pregunta>"` cuando
  `graphify-out/graph.json` exista. Usar `graphify path "<A>" "<B>"` para relaciones y
  `graphify explain "<concepto>"` para conceptos puntuales — devuelven un subgrafo acotado, mucho
  más chico que `GRAPH_REPORT.md` o un grep crudo.
- Leer `graphify-out/GRAPH_REPORT.md` completo solo para revisión de arquitectura amplia, o cuando
  query/path/explain no alcancen.
- Después de modificar código, correr `graphify update .` para mantener el grafo al día (solo AST,
  sin costo de API).
