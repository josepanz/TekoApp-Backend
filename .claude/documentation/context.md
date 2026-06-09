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

**Última actualización: 2026-06-09 — Sesión 8 (Migración a -db modules: ratings, services, promotions + tests de controllers)**

### Build y runtime
- `pnpm lint` — **0 errores, 0 warnings**
- `pnpm build` (tsc --noEmit) — **0 errores TypeScript**
- `pnpm test` — **22 suites, 315 tests, todos PASS** (Sesión 8)
- `node dist/main` — Arranca, todos los módulos DI inicializan correctamente
- Errores en runtime (esperados, sin .env): MongoDB/PostgreSQL/Redis retry por `.env` ausente

### Módulos -db activos (arquitectura limpia)
| Módulo db | Importado por |
|-----------|---------------|
| `users-db` | `api/users` |
| `payments-db` | `api/payments` |
| `categories-db` | `api/categories` |
| `locations-db` | `api/locations` |
| `analytics-db` | `api/analytics` |
| `professionals-db` | `api/professionals` |
| `ratings-db` | `api/ratings` ✅ (Sesión 8) |
| `services-db` | `api/services` ✅ (Sesión 8) |
| `promotions-db` | `api/promotions` ✅ (Sesión 8) |

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
- [x] **DTO restructure completa** (Sesión 5): categories, payments, promotions, ratings, services
- [x] **Fee calculator** (Sesión 5): `FeeCalculatorService` en `payments-db`, TTL cache 5 min
- [x] **Tests** (Sesión 5): 4 suites — fee-calculator (7), payments (~26), promotions (12), categories (23)
- [x] **Jest alias `@/`** (Sesión 5)
- [x] **`--forceExit`** en Jest (Sesión 6)
- [x] **6 nuevos specs de services** (Sesión 6): analytics, locations, professionals, ratings/services, services/services, users-api
- [x] **`getUsersCount()`** migrado a `users-db.service.ts` (Sesión 6)
- [x] **Tests de controllers** (Sesión 7): analytics (4), locations (8), professionals (15), ratings (16), services (16), users (10)
- [x] **`ratings-db` module + service** (Sesión 8): 17 métodos semánticos
- [x] **`services-db` module + service** (Sesión 8): 19 métodos, incluyendo `acceptRequestTransaction`
- [x] **`promotions-db` module + service** (Sesión 8): 11 métodos, `applyTransaction` con `$transaction`
- [x] **Migración `ratings.service.ts`** (Sesión 8): PrismaDatasource → RatingsDbService, spec reescrito
- [x] **Migración `services.service.ts`** (Sesión 8): PrismaDatasource → ServicesDbService, spec reescrito
- [x] **Migración `promotions.service.ts`** (Sesión 8): PrismaDatasource → PromotionsDbService, spec reescrito
- [x] **Módulos api actualizados** (Sesión 8): ratings/services/promotions importan módulo `-db` en lugar de DatabaseModule

### Notas de arquitectura
- Cast pattern: `return service.method() as unknown as Promise<ResponseDTO>` — evita remapping Prisma→DTO
- Cast en specs: declarar `const dto = { prop: val }` sin cast, luego `service.method(dto as never)` en el call site
- `ServicesDbService.updateService` acepta `Prisma.ServicesUncheckedUpdateInput` para soportar FK escalares (`professionalId`)
- `UserHelper` tiene métodos estáticos — mockear con `jest.spyOn(UserHelper, 'method').mockReturnValue(...)`
- `IMerchantContext` requiere campo `ruc: string` — incluirlo en mocks de tests que usen MerchantContext
- Jest aliases disponibles: `@core/`, `@modules/`, `@api/`, `@common/`, `@auth/`, `@email/`, `@/`
- **Regla de oro activa en todos los módulos**: `api/*` nunca accede a PrismaDatasource directo

### Pendiente (próximas sesiones)
- [ ] **Faltan test specs:**
    - En /src/api: 
        - [ ] Categories controller
        - [ ] Notifications controller
        - [ ] Notifications service
        - [ ] Notification processor
        - [ ] Onboarding controller
        - [ ] Onboarding api service
        - [ ] Payments controller
        - [ ] Promotions controller
        - [ ] Roles-permission controller
        - [ ] roles permission api service
        - [ ] storage controller
        - [ ] services controller
        - [ ] Tracking controller

        En /src/module:
        - [ ] analytrics-db service
        - [ ] auth-password.service
        - [ ] auth-token.service
        - [ ] auth.service
        - [ ] categories-db.service
        - [ ] email.service
        - [ ] health.controller
        - [ ] locations-db.service
        - [ ] notifications-db.service
        - [ ] onboarding.service
        - [ ] payment-db.service
        - [ ] professionals-db.service
        - [ ] promotions-db.service
        - [ ] ratings-db.service
        - [ ] permissions-db.service.ts
        - [ ] role-permissions-db.service.ts
        - [ ] roles-db.service.ts
        - [ ] user-permissions-db.service.ts
        - [ ] user-roles-db.service.ts
        - [ ] services-db.service
        - [ ] tacking-db.service
        - [ ] user-roles-db.service
        - [ ] users-db.service

    - Y si es facil, no consume recurso y se puede testear sin muchos pasos:
        - [ ] report.service

- [ ] **Ajustes criticos de diseño:**
    - [ ] Validar /src/api/uploads si en verdad es necesario o se puede unificar y consolidar todo en storage para exponer las funciones correctas segun las reglas, specs, lint, rules definidas y specs:
        - [ ] Si si es necesario, ajustar completo el uploads de /src/api, falta organización de carpetas controllers, services, dtos, dtos/request, dtos/response, faltan propiamente los DTOs request.dto.ts, response.dto.ts, query.dto.ts, param.dto.ts según las reglas, faltan specs de controller y service, sino borrar.
    - [ ] Validar /src/api/storage y /src/modules/storage que cumpla con todas las reglas
- [ ] **Sharp binary**: `pnpm add sharp` o binario win32-x64 para habilitar procesamiento de imágenes
