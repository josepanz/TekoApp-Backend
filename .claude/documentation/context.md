# TekoApp-Backend — Contexto del proyecto

## Identificación

| Campo | Valor |
|-------|-------|
| Proyecto | TekoApp-Backend |
| Versión | 1.0.0-develop.1 |
| Framework | NestJS 10, TypeScript strict |
| ORM | Prisma 6.18 (PostgreSQL) |
| Auth | JWT custom (access + refresh + cookies) + Basic Auth pre-login |
| Runtime | Node 22, pnpm |

## Stack completo

| Capa | Tecnología |
|------|-----------|
| HTTP | NestJS 10, Express |
| DB principal | PostgreSQL vía Prisma 6.18 |
| DB documentos | MongoDB vía Mongoose (notificaciones) |
| Caché / Colas | Redis vía Bull/BullMQ |
| Pagos | Stripe (métodos de pago, webhooks) |
| Notificaciones | Firebase Cloud Messaging |
| SMS | Twilio |
| Almacenamiento | AWS S3 |
| Geolocalización | Google Maps API |
| Email | Nodemailer (SMTP) |
| Imágenes | Sharp 0.32.6 (binario nativo win32-x64) |
| Docs API | Swagger / OpenAPI |

## Arquitectura en dos capas

```
src/
├── api/                    ← Capa HTTP: controllers, DTOs, services orquestadores
│   ├── analytics/
│   ├── categories/
│   ├── locations/
│   ├── payments/
│   ├── professionals/
│   ├── promotions/
│   ├── ratings/
│   ├── roles-permission/
│   ├── services/
│   ├── uploads/
│   └── users/
├── modules/                ← Capa de lógica: módulos de negocio y abstracción DB
│   ├── auth/               — JWT, guards, decorators
│   ├── email/              — envío de emails
│   ├── notifications/      — push via Firebase, colas Bull
│   ├── onboarding/         — flujo de registro
│   ├── report/             — generación de reportes
│   ├── storage/            — abstracción AWS S3
│   ├── users/              — gestión de usuarios
│   └── *-db/               — abstracción Prisma por dominio
│       ├── users-db/
│       ├── payments-db/
│       ├── categories-db/
│       ├── locations-db/
│       ├── analytics-db/
│       ├── professionals-db/
│       ├── ratings-db/
│       ├── services-db/
│       ├── promotions-db/
│       ├── roles-permission-db/
│       ├── tracking-db/
│       └── notifications-db/
├── core/
│   ├── database/           — PrismaDatasource (@Global, usa .extended)
│   └── config/             — APP_CONFIG (registerAs), JOI schema
└── common/                 — validators, pipes, decorators, helpers compartidos
```

**Regla de oro**: `api/*` nunca accede a Prisma directo — siempre vía módulo `*-db` correspondiente.

## Clientes consumidores

| Cliente | Auth | Propósito |
|---------|------|-----------|
| TekoApp-Web | JWT / Basic Auth | Portal web: gestión, configuración, datos |
| TekoApp-Mobile | JWT / Basic Auth | App móvil para usuarios y profesionales |

## Proveedores externos

| Proveedor | Propósito |
|-----------|-----------|
| Stripe | Pagos, métodos de pago, webhooks |
| Firebase | Notificaciones push |
| Twilio | Verificación por SMS |
| AWS S3 | Almacenamiento de archivos/imágenes |
| Google Maps | Geolocalización, servicios cercanos |

## Decisiones de arquitectura clave

| Decisión | Motivo |
|----------|--------|
| `DatabaseModule` es `@Global()` | `PrismaDatasource` disponible en toda la app sin re-importar |
| Módulos `-db` importan `DatabaseModule`, no `PrismaDatasource` directo | `PrismaDatasource` es `@Injectable()`, no un módulo — no va en `imports[]` |
| `prisma.extended.*` siempre | Coexiste con audit triggers automáticos |
| `nest-cli.json` webpack: false | Usa tsc — evita errores de path resolution en bundle |
| `APP_CONFIG` en `ConfigModule.forRoot({ load: [APP_CONFIG] })` | Registra el token globalmente; sin esto `@Inject(APP_CONFIG.KEY)` falla |
| Sharp como dependencia nativa | `sharp@0.32.6` instalado con binario win32-x64 — procesa imágenes en-memory |
| `// @ts-nocheck` en helpers de Sequelize/acquiring | `@sequelize/core` no está instalado — se usa solo en acquiring via HTTP |
| `Prisma.UsersUncheckedCreateInput` en create de users | Permite scalar FK (`documentTypeId`, `access_level`) sin nested relations |
| `api/uploads/` usa `memoryStorage()` | Sin disk I/O — buffer directo a Sharp → S3 |
| `api/storage/` eliminado (era dead code) | Nunca registrado en `api.module.ts`; `api/uploads/` es el único endpoint de archivos |

## Estado actual — Sesión 13 (2026-06-09)

**Última actualización: 2026-06-09 — Sesión 13**

### Build y runtime
- `pnpm lint` — **0 errores, 0 warnings** ✅
- `pnpm build` (tsc --noEmit) — **0 errores TypeScript** ✅
- `pnpm test` — **59 suites, 867 tests, todos PASS** ✅
- `node dist/main` — Arranca, todos los módulos DI inicializan correctamente
- Errores en runtime (esperados, sin .env): MongoDB/PostgreSQL/Redis retry

> Historial de sesiones detallado: `.claude/projects/.../memory/sessions/` y `/archive/`

### Módulos -db activos

| Módulo db | Importado por |
|-----------|---------------|
| `users-db` | `api/users` |
| `payments-db` | `api/payments` |
| `categories-db` | `api/categories` |
| `locations-db` | `api/locations` |
| `analytics-db` | `api/analytics` |
| `professionals-db` | `api/professionals` |
| `ratings-db` | `api/ratings` ✅ |
| `services-db` | `api/services` ✅ |
| `promotions-db` | `api/promotions` ✅ |
| `roles-permission-db` | `api/roles-permission` ✅ |

### Notas de arquitectura
- Cast pattern: `return service.method() as unknown as Promise<ResponseDTO>` — evita remapping Prisma→DTO
- Cast en specs: declarar `const dto = { prop: val }` sin cast, luego `service.method(dto as never)` en el call site
- `ServicesDbService.updateService` acepta `Prisma.ServicesUncheckedUpdateInput` para soportar FK escalares (`professionalId`)
- `UserHelper` tiene métodos estáticos — mockear con `jest.spyOn(UserHelper, 'method').mockReturnValue(...)`
- `IMerchantContext` requiere campo `ruc: string` — incluirlo en mocks de tests que usen MerchantContext
- Jest aliases disponibles: `@core/`, `@modules/`, `@api/`, `@common/`, `@auth/`, `@email/`, `@/`
- **Regla de oro activa en todos los módulos**: `api/*` nunca accede a PrismaDatasource directo
- `IUserDataOnJwt` requiere: `id, referenceId, email, firstName, lastName, accessLevelId, userStatus, profileStatus, permissions[], roles[]` — en specs usar `as unknown as IUserDataOnJwt`
- `jest.mock()` se hoistea — NUNCA referenciar variables `const` externas dentro de la factory
- Mongoose services: mockear con constructor-function `function MockModel(data) { ...; this.save = mockSave }` + static methods
- `jest.clearAllMocks()` NO resetea `mockReturnValue/mockResolvedValue`. Usar `mockReturnValueOnce` para evitar contaminación
- `expect.objectContaining()/expect.any()` como **valor de propiedad** disparan `no-unsafe-assignment` — fix: `as unknown`
- Transaction mocks: NO usar `async (cb) => cb(mockTx)` — fix: `(cb: (tx: typeof mockTx) => unknown) => cb(mockTx)`
- Métodos estáticos de clases mockeadas en `expect()` disparan `unbound-method` — fix: `// eslint-disable-next-line @typescript-eslint/unbound-method`
- Fixtures `buildUser()`: retornar `as unknown as Users` (importar tipo de `@prisma/client`), nunca `as any`
- `sharp`: `jest.mock('sharp', factory)` con factory completamente self-contained (ver feedback_jest_lint_patterns.md #8)

### Pendientes
_(ninguno al cierre de sesión 13)_
