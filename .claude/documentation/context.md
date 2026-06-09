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
| Imágenes | Sharp (opcional — native binary) |
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
│   ├── services/
│   ├── uploads/
│   └── users/ (en migración a modules/users)
├── modules/                ← Capa de lógica: módulos de negocio y abstracción DB
│   ├── auth/               — JWT, guards, decorators
│   ├── email/              — envío de emails
│   ├── notifications/      — push via Firebase, colas Bull
│   ├── onboarding/         — flujo de registro
│   ├── users/              — gestión de usuarios
│   ├── *-db/               — abstracción Prisma por dominio
│   │   ├── users-db/
│   │   ├── payments-db/
│   │   ├── categories-db/
│   │   ├── locations-db/
│   │   └── analytics-db/
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
| Sharp como dependencia opcional | Native binary win32-x64 no disponible en dev; la app arranca sin él |
| `// @ts-nocheck` en helpers de Sequelize/acquiring | `@sequelize/core` no está instalado — se usa solo en acquiring via HTTP |
| `Prisma.UsersUncheckedCreateInput` en create de users | Permite scalar FK (`documentTypeId`, `access_level`) sin nested relations |

## Estado actual — actualizar por sesión

**Última actualización: 2026-06-08 — Sesión 5 (DTO restructure 5 APIs + fee calculator + tests)**

### Build y runtime
- `pnpm lint` — **0 errores, 0 warnings**
- `pnpm build` (tsc --noEmit) — **0 errores TypeScript**
- `pnpm test` — **4 suites, 68 tests, todos PASS**
- `node dist/main` — Arranca, todos los módulos DI inicializan correctamente
- Errores en runtime (esperados, sin .env): MongoDB/PostgreSQL/Redis retry por `.env` ausente

### Tareas completadas
- [x] Eliminados 8 archivos entity TypeORM (no instalado) (Sesión 1)
- [x] Corregidos ~38 errores de compilación TypeScript (Sesión 1)
- [x] Migración users-db, módulos DI, Sharp opcional, APP_CONFIG, webpack:false (Sesión 1)
- [x] 322 warnings `no-explicit-any`/`no-unsafe-*` → 0 (Sesión 2)
- [x] 19 errores TypeScript adicionales → 0 (Sesión 2)
- [x] Eliminado modelo `Example` del schema.prisma + `pnpm prisma generate` (usuario, Sesión 2/3)
- [x] DTOs @Param/@Query: `professionals`, `services`, `categories`, `ratings`, `promotions` (Sesión 3)
- [x] Refactor payments: JwtAuthGuard, DTOs tipados, eliminado `mockUserId = 1` (Sesión 3)
- [x] Reorganización `api.module.ts` / `app.module.ts` (usuario, Sesión 3)
- [x] Módulo `professionals-db` + `ProfessionalsDbService` + response DTOs + folder structure (Sesión 4)
- [x] **DTO restructure completa** (Sesión 5): categories, payments, promotions, ratings, services → `/dtos/request/`, `/dtos/response/`, `/controllers/`, `/services/`, `/docs/`
- [x] **Fee calculator** (Sesión 5): `FeeCalculatorService` en `payments-db`, lee rates desde DB, TTL cache 5 min
- [x] **Tests** (Sesión 5): 4 suites — fee-calculator (7), payments (~26), promotions (12), categories (23)
- [x] **Jest alias `@/`** (Sesión 5): `jest.config.ts` agrega `'^@/(.*)$': '<rootDir>/$1'`

### Notas de arquitectura (Sesión 5)
- Cast pattern: `return service.method() as unknown as Promise<ResponseDTO>` — evita remapping Prisma→DTO
- `FeeCalculatorService`: TTL cache en Map (no Redis) — suficiente para config que cambia raramente
- Jest aliases disponibles: `@core/`, `@modules/`, `@api/`, `@common/`, `@auth/`, `@email/`, `@/`
- `expect.objectContaining()` retorna `any` — cast con `as unknown` para suprimir `no-unsafe-assignment`

### Pendiente (próximas sesiones)
- [ ] **Sharp binary**: `pnpm add sharp` o binario win32-x64 para habilitar procesamiento de imágenes
- [ ] **Tests restantes**: `professionals-db.service.spec.ts`, `professionals.service.spec.ts`, controllers specs
- [ ] **`--forceExit`** (opcional): TTL cache de `FeeCalculatorService` produce warning cosmético "worker process failed to exit gracefully"
