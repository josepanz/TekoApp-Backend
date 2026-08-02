<div align="center">

# TekoApp テコ — Plataforma de Servicios Profesionales

![TekoApp Banner](.claude/documentation/brand/banner.png)

**Conectando talento con necesidad, donde sea, cuando sea.**

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Flutter](https://img.shields.io/badge/Flutter-02569B?style=for-the-badge&logo=flutter&logoColor=white)](https://flutter.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

</div>

---

## Descripción

**TekoApp** es una plataforma de economía colaborativa que conecta usuarios con profesionales de servicios de oficio (electricistas, plomeros, pintores, carpinteros, etc.) de manera rápida, segura y geolocalizada.

Inspirada en la eficiencia logística de modelos como Uber o Bolt, pero adaptada al sector de servicios profesionales:

TekoApp ofrece:
- **Doble Rol:** Una sola cuenta permite operar como Cliente o Profesional indistintamente.
- **Tracking en Tiempo Real:** Geolocalización y telemetría de profesionales disponibles con índices `2dsphere`.
- **Reputación Bidireccional:** Calificaciones mutuas para garantizar confianza entre ambas partes.
- **Economía Dinámica:** Precios establecidos por cada profesional, pagos integrados vía Stripe.
- **Ecosistema Completo:** App móvil nativa (Flutter) y panel de administración web (Next.js).

---

## ♟️ El poder detrás del nombre "Teko"

El nombre de nuestra plataforma fusiona dos conceptos culturales poderosos que definen nuestra misión:

| Idioma   | Escritura | Significado        | Simbolismo en la Arquitectura de la App                  |
|----------|-----------|--------------------|----------------------------------------------------------|
| **Guaraní**  | Teko      | *"Vida / Estilo"*  | Representa nuestra misión de mejorar el día a día y conectar a la comunidad. |
| **Japonés**  | テコ      | *"Palanca"*        | Simboliza el apalancamiento tecnológico; somos la herramienta que multiplica las oportunidades. |

1. **En guaraní**: El nombre "Teko" proviene del guaraní y significa "vida" o "estilo de vida", representando nuestra misión de mejorar la vida de las personas conectándolas con los mejores profesionales.
   - Significa *"vida" o "estilo de vida"*, representando nuestra misión de mejorar el día a día de las personas.
   - Representa la conexión entre los profesionales y los clientes.
   - Evoca un sentido de comunidad y bienestar.
3. **En japonés (テコ)**: Significa *"palanca"*, simbolizando cómo nuestra app sirve como herramienta para **conectar y potenciar** oportunidades entre profesionales y clientes, lo que añade un significado poderoso y simbólico reforzando el concepto de conexión y facilitación de servicios.
   - Escritura japonesa: テコ (katakana) / 梃子 (kanji menos común).
   - Significado:
     - Palanca (herramienta física que multiplica fuerza).
     - Apalancamiento (en contexto figurado: "ser un puente" o "facilitador").
     - Uso: Es una palabra reconocida en japonés, aunque no es de uso cotidiano (se usa más en contextos técnicos/mecánicos).

---

## Ecosistema de Repositorios

| Componente | Repositorio | Stack |
|------------|-------------|-------|
| **Backend Core** | [TekoApp-Backend](https://github.com/josepanz/TekoApp-Backend) | NestJS 10, Prisma, Mongoose, Redis, Sharp |
| **Mobile App** | [TekoApp-Mobile](https://github.com/josepanz/TekoApp-Frontend-Mobile) | Flutter 3, Riverpod, go_router, dio |
| **Web Admin** | [TekoApp-Web](https://github.com/josepanz/TekoApp-Frontend-Web) | Next.js 16, shadcn/ui, TanStack Query |

---

## Marca

<img src=".claude/documentation/brand/logo.png" alt="Logo de TekoApp" width="220" />

El manual de marca oficial (logo, banner y manual completo) vive en
[`.claude/documentation/brand/`](.claude/documentation/brand/) — es la referencia autoritativa de
color/tipografía para cualquier superficie con UI (hoy: `TekoApp-Web`; a futuro: `TekoApp-Mobile`
en Flutter). Este repo no tiene UI propia, pero sirve el logo en templates de email (`modules/email`)
y puede usarse para personalizar la portada de Swagger/Compodoc.

La paleta oficial (`#0D1B2A` navy, `#28A745` verde, `#17BEBB` teal, `#FFC107` dorado, `#F5F7FA`
gris claro) y la tipografía (Poppins) están implementadas como tokens de diseño en `TekoApp-Web`
(`src/design-system/tokens/tokens.json`) — ver el README de ese repo para el detalle completo del
rebrand 2026-08-02.

---

## Arquitectura del Backend

El backend de TekoApp está construido bajo principios estrictos de **Clean Architecture** y **Domain-Driven Design (DDD)**. 

El backend impone una frontera rígida entre la capa HTTP y la de persistencia.

### Estructura en dos capas

```
src/
├── api/                    # Capa HTTP — controllers, DTOs, services orquestadores
│   ├── analytics/          # Métricas y reportes
│   ├── categories/         # Categorías de servicios
│   ├── locations/          # Geolocalización
│   ├── payments/           # Stripe: pagos y webhooks
│   ├── professionals/      # Gestión de profesionales
│   ├── promotions/         # Promociones y descuentos
│   ├── ratings/            # Calificaciones bidireccionales
│   ├── roles-permission/   # Control de acceso RBAC
│   ├── services/           # Solicitudes de servicio
│   ├── uploads/            # Subida de archivos (S3 + Sharp)
│   └── users/              # Gestión de usuarios
├── modules/                # Capa de dominio — lógica reutilizable, conexiones DB
│   ├── auth/               # JWT custom: guards, decorators, access/refresh tokens
│   ├── email/              # Nodemailer SMTP
│   ├── notifications/      # Firebase FCM + colas Bull
│   ├── onboarding/         # Flujo de registro
│   ├── report/             # Generación de reportes
│   ├── storage/            # Abstracción AWS S3
│   ├── users/              # Gestión core de usuarios
│   └── *-db/               # Abstracción Prisma por dominio
│       ├── analytics-db/
│       ├── categories-db/
│       ├── locations-db/
│       ├── payments-db/
│       ├── professionals-db/
│       ├── promotions-db/
│       ├── ratings-db/
│       ├── roles-permission-db/
│       ├── services-db/
│       ├── tracking-db/
│       └── users-db/
├── core/
│   ├── database/           # PrismaDatasource (@Global, usa .extended para auditoría)
│   └── config/             # APP_CONFIG con validación JOI — nunca process.env directo
└── common/                 # Validators, pipes, decorators, helpers compartidos
```

> **Regla de oro:** `api/*` nunca accede a Prisma directamente. Siempre a través del módulo `*-db` correspondiente.

### Estrategia de persistencia híbrida

| DB | Propósito | Por qué |
|----|-----------|---------|
| **PostgreSQL** (Prisma) | Transacciones financieras, perfiles, roles, facturación | ACID garantizado |
| **MongoDB** (Mongoose) | Telemetría, GeoTracking (`2dsphere`), logs de notificaciones | Writes masivos, schema flexible |
| **Redis** (BullMQ) | Colas asíncronas: webhooks Stripe, push notifications, presigned URL cache | Desacopla procesamiento pesado del request cycle |

### Proveedores externos

| Proveedor | Propósito |
|-----------|-----------|
| Stripe | Pagos, métodos de pago, webhooks |
| Firebase | Notificaciones push (FCM) |
| Twilio | Verificación por SMS |
| AWS S3 | Almacenamiento de archivos e imágenes |
| Google Maps | Geolocalización, servicios cercanos |
| Sharp | Procesamiento de imágenes en memoria (resize, JPEG, thumbnails) |

### Estado del proyecto (Sesión 13 — 2026-06-09)

- `pnpm lint` — **0 errores, 0 warnings**
- `pnpm build` (tsc --noEmit) — **0 errores TypeScript**
- `pnpm test` — **59 suites, ~867 tests, todos PASS**
- `node dist/main` — Arranca correctamente (todos los módulos DI inicializan)

---

## Instalación y Desarrollo Local — Backend

**Requisitos:** Node.js 22+, pnpm, Docker.

### 1. Clonar el repositorio

```bash
git clone https://github.com/josepanz/TekoApp-Backend.git
cd TekoApp-Backend
```

### 2. Instalar dependencias

```bash
pnpm install
```

### 3. Levantar infraestructura local

```bash
# Levanta PostgreSQL, MongoDB y Redis con Docker
docker-compose up -d
```

### 4. Configurar el entorno

Crea `.env` en la raíz (usa `.env.example` como referencia):

```properties
# App
PORT=3000
NODE_ENV=develop

# Databases
DATABASE_URL="postgresql://postgres:password@localhost:5432/tekoapp?schema=public"
MONGODB_URI="mongodb://localhost:27017/tekoapp_logs"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Auth — JWT con RS256 (generar con: openssl genrsa -out private.pem 2048)
JWT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n..."
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=tekoapp-dev

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Firebase (JSON stringificado del service account)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890

# Google Maps
GOOGLE_MAPS_API_KEY=AIzaSy...

# Email SMTP
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your_user
SMTP_PASS=your_pass
SMTP_FROM="TekoApp <noreply@tekoapp.com>"
```

### 5. Generar cliente Prisma e iniciar

```bash
pnpm prisma generate
pnpm prisma db push        # aplica el schema sin migraciones (dev)
pnpm run start:dev         # hot-reload con watch mode
```

### 6. Comandos útiles

```bash
pnpm test                  # ejecutar todos los tests
pnpm test:watch            # modo watch
pnpm test:cov              # reporte de cobertura
pnpm lint                  # ESLint + auto-fix
pnpm build                 # compilar con tsc
```

---

## Despliegue en Producción (Kubernetes / K3s)

TekoApp está diseñado para entornos distribuidos con Kubernetes (K3s/K8s):

- **Secretos:** HashiCorp Vault con Agent Injectors — nunca en ConfigMap
- **Escalado:** HPA (Horizontal Pod Autoscaler) por CPU/memoria
- **Imágenes:** Multi-stage Docker build con `node:22-alpine`, `USER node` antes de `CMD`
- **Health checks:** Readiness y liveness probes en cada Deployment (`/health`)
- **CI/CD:** Pipeline `lint → test → build → scan → deploy`

Los manifiestos YAML de infraestructura se encuentran en `/ci`.

```bash
# Build de imagen de producción
docker build -t tekoapp-backend:latest .

# Deploy con Helm / kubectl
kubectl apply -f ci/k8s/
```

---

## TekoApp-Web — Panel de Administración

### Stack recomendado

| Capa | Tecnología | Por qué |
|------|-----------|---------|
| Framework | **Next.js 14+ (App Router)** | SSR/SSG, server components, routing nativo, mejor DX que CRA |
| UI | **shadcn/ui + Tailwind CSS** | Componentes accesibles pre-construidos, personalizables, sin bundle overhead |
| Estado servidor | **TanStack Query v5** | Cache, refetch, optimistic updates — reemplaza Redux para server state |
| Estado cliente | **Zustand** | Más simple que Redux para estado UI local (modales, filtros, etc.) |
| Formularios | **React Hook Form + Zod** | Validación isomórfica compartida con el backend |
| Tablas | **TanStack Table v8** | El panel tendrá muchas grids — esta lib es la mejor opción |
| HTTP | **Axios** con interceptores para JWT refresh automático | |

> Si el equipo ya conoce Redux, usar **Redux Toolkit + RTK Query** es válido — no instalar Redux "vanilla".

### Estructura de carpetas (Next.js App Router)

```
TekoApp-Web/
├── src/
│   ├── app/                              # Next.js App Router — server components por defecto
│   │   ├── (auth)/                       # Rutas públicas (sin sidebar)
│   │   │   ├── login/
│   │   │   │   └── page.tsx             # Server component — muestra LoginForm (client)
│   │   │   └── forgot-password/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/                  # Rutas protegidas — comparten layout con sidebar
│   │   │   ├── layout.tsx               # DashboardLayout: Sidebar + Header + auth check
│   │   │   ├── page.tsx                 # Overview: stats cards (server component)
│   │   │   ├── professionals/
│   │   │   │   ├── page.tsx             # Lista paginada (server: fetch inicial)
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx         # Detalle + edición del profesional
│   │   │   ├── services/
│   │   │   │   ├── page.tsx             # Solicitudes de servicio con filtros
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── payments/
│   │   │   │   └── page.tsx             # Historial de pagos + Stripe webhooks
│   │   │   ├── promotions/
│   │   │   │   └── page.tsx
│   │   │   ├── analytics/
│   │   │   │   └── page.tsx             # Gráficas (client component — usa recharts)
│   │   │   ├── categories/
│   │   │   │   └── page.tsx
│   │   │   ├── users/
│   │   │   │   └── page.tsx
│   │   │   └── settings/
│   │   │       └── page.tsx
│   │   ├── layout.tsx                   # Root layout: fuentes, QueryClientProvider, AuthProvider
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── ui/                          # shadcn/ui — NO modificar manualmente, regenerar con CLI
│   │   │   ├── button.tsx
│   │   │   ├── table.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── badge.tsx
│   │   │   └── ...
│   │   └── shared/                      # Componentes de dominio reutilizables
│   │       ├── data-table.tsx           # Tabla genérica con TanStack Table (sorting, pagination)
│   │       ├── page-header.tsx          # Título + breadcrumb + acciones
│   │       ├── sidebar.tsx              # Sidebar con navegación
│   │       ├── auth-guard.tsx           # HOC/wrapper para rutas protegidas client-side
│   │       └── confirm-dialog.tsx       # Modal de confirmación reutilizable
│   │
│   ├── features/                        # Módulos de feature (co-located: api + hooks + types + components)
│   │   ├── auth/
│   │   │   ├── api/
│   │   │   │   └── auth.api.ts          # loginUser(), refreshToken(), logout()
│   │   │   ├── hooks/
│   │   │   │   ├── use-login.ts         # useMutation → auth.api.loginUser
│   │   │   │   ├── use-logout.ts
│   │   │   │   └── use-auth-store.ts    # Zustand: { user, accessToken, isAuthenticated }
│   │   │   ├── types/
│   │   │   │   └── auth.types.ts        # LoginRequestDTO, AuthResponseDTO (espejo del backend)
│   │   │   └── components/
│   │   │       └── login-form.tsx       # 'use client' — React Hook Form + Zod
│   │   │
│   │   ├── professionals/
│   │   │   ├── api/
│   │   │   │   └── professionals.api.ts # getProfessionals(), getProfessional(id), updateProfessional()
│   │   │   ├── hooks/
│   │   │   │   ├── use-professionals-list.ts  # useQuery — lista paginada
│   │   │   │   ├── use-professional.ts        # useQuery — detalle por id
│   │   │   │   └── use-update-professional.ts # useMutation + invalidateQueries
│   │   │   ├── types/
│   │   │   │   └── professional.types.ts
│   │   │   └── components/
│   │   │       ├── professionals-table.tsx    # DataTable con columnas tipadas
│   │   │       └── professional-form.tsx
│   │   │
│   │   ├── services/                    # (misma estructura que professionals/)
│   │   ├── payments/
│   │   ├── analytics/
│   │   ├── categories/
│   │   └── users/
│   │
│   ├── lib/
│   │   ├── api/
│   │   │   ├── axios.ts                 # Instancia Axios con baseURL + interceptores JWT refresh
│   │   │   └── query-client.ts          # TanStack Query: QueryClient con staleTime + retry config
│   │   └── utils/
│   │       ├── cn.ts                    # clsx + tailwind-merge (helper de shadcn/ui)
│   │       └── format.ts               # formatDate, formatCurrency, formatFileSize
│   │
│   ├── hooks/
│   │   ├── use-pagination.ts            # Hook genérico de paginación con URL params
│   │   └── use-debounce.ts
│   │
│   └── types/
│       ├── api.types.ts                 # PaginatedResponse<T>, ApiError, RequestStatus
│       └── index.ts
│
├── public/
│   ├── logo.svg
│   └── favicon.ico
├── .env.example
├── components.json                      # shadcn/ui CLI config
├── tailwind.config.ts
├── next.config.ts
└── tsconfig.json                        # paths: { "@/*": ["./src/*"] }
```

#### Convenciones clave (Web)

| Regla | Aplicación |
|-------|-----------|
| Server vs Client components | Server por defecto — agregar `'use client'` solo si hay estado, eventos o hooks |
| Estado servidor | TanStack Query — nunca usar Zustand para datos del backend |
| Estado cliente | Zustand — solo UI state (sidebar abierto, modal activo, filtros locales) |
| Formularios | React Hook Form + Zod — el schema Zod puede ser el mismo que el DTO del backend |
| Convención de archivos | kebab-case para archivos, PascalCase para componentes |
| Naming de hooks | `use-<feature>-<acción>.ts` (ej: `use-professionals-list.ts`) |

### Instalación (Web)

**Requisitos:** Node.js 22+, pnpm.

```bash
git clone https://github.com/josepanz/TekoApp-Frontend-Web.git
cd TekoApp-Frontend-Web

pnpm install

# Configurar entorno
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:3000
# NEXT_PUBLIC_GOOGLE_MAPS_KEY=AIzaSy...

pnpm dev                   # http://localhost:3001
pnpm build && pnpm start   # producción local
```

---

## TekoApp-Mobile — App Multiplataforma

### Stack recomendado

| Capa | Tecnología | Por qué |
|------|-----------|---------|
| Framework | **Flutter 3.19+** | Multiplataforma nativo (iOS/Android), un solo codebase |
| Estado | **Riverpod 2.x** | Reemplaza Provider: null-safe, testable, sin BuildContext en lógica |
| Navegación | **go_router 13+** | Deep linking, guards, rutas tipadas — mucho mejor que Navigator 2.0 manual |
| HTTP | **dio** | Interceptores, FormData, cancel tokens — mejor que el paquete `http` |
| Modelos | **freezed + json_serializable** | Clases inmutables con copyWith, fromJson/toJson autogenerado |
| Mapas | **google_maps_flutter** | Integración nativa con Google Maps SDK |
| Push | **firebase_messaging** | FCM para notificaciones push del backend |

### Arquitectura: Clean Architecture por features

Cada feature tiene 3 capas: **data** (implementación), **domain** (contratos puros), **presentation** (UI + Riverpod).

```
TekoApp-Mobile/
├── lib/
│   ├── core/
│   │   ├── config/
│   │   │   └── app_config.dart           # apiBaseUrl, googleMapsKey, isDev flag
│   │   ├── network/
│   │   │   ├── dio_client.dart           # Instancia Dio con baseOptions + timeouts
│   │   │   └── auth_interceptor.dart     # Agrega Bearer token; llama refreshToken si 401
│   │   ├── router/
│   │   │   ├── app_router.dart           # GoRouter con todas las rutas declaradas
│   │   │   └── auth_guard.dart           # redirect: (ctx, state) → '/login' si no autenticado
│   │   ├── theme/
│   │   │   ├── app_theme.dart            # ThemeData claro + oscuro
│   │   │   ├── app_colors.dart           # Paleta de colores de la marca
│   │   │   └── app_text_styles.dart      # TextStyle por tamaño/peso
│   │   └── utils/
│   │       ├── extensions.dart           # BuildContext.go(), String.capitalize(), etc.
│   │       └── validators.dart           # Funciones de validación reutilizables
│   │
│   ├── features/
│   │   │
│   │   ├── auth/
│   │   │   ├── data/
│   │   │   │   ├── datasources/
│   │   │   │   │   └── auth_remote_datasource.dart   # dio.post('/auth/login'), refreshToken()
│   │   │   │   ├── models/
│   │   │   │   │   ├── login_request_model.dart      # @freezed — toJson para el body
│   │   │   │   │   └── auth_response_model.dart      # @freezed + fromJson — accessToken, user
│   │   │   │   └── repositories/
│   │   │   │       └── auth_repository_impl.dart     # implements AuthRepository
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   └── auth_user.dart                # Entidad pura (id, email, roles, etc.)
│   │   │   │   ├── repositories/
│   │   │   │   │   └── auth_repository.dart          # abstract interface AuthRepository
│   │   │   │   └── usecases/
│   │   │   │       ├── login_usecase.dart            # call(email, password) → AuthUser
│   │   │   │       ├── logout_usecase.dart
│   │   │   │       └── refresh_token_usecase.dart
│   │   │   └── presentation/
│   │   │       ├── providers/
│   │   │       │   ├── auth_provider.dart            # authNotifierProvider (AsyncNotifier<AuthUser?>)
│   │   │       │   └── auth_state.dart               # @freezed: AuthState (loading/authenticated/unauthenticated)
│   │   │       ├── screens/
│   │   │       │   ├── login_screen.dart
│   │   │       │   └── register_screen.dart
│   │   │       └── widgets/
│   │   │           └── login_form.dart
│   │   │
│   │   ├── home/                         # Mapa principal con profesionales disponibles
│   │   │   ├── data/
│   │   │   │   └── datasources/
│   │   │   │       └── location_datasource.dart      # Geolocator + Google Maps
│   │   │   └── presentation/
│   │   │       ├── providers/
│   │   │       │   └── nearby_professionals_provider.dart
│   │   │       └── screens/
│   │   │           └── home_screen.dart              # GoogleMap widget + markers dinámicos
│   │   │
│   │   ├── search/                       # Búsqueda por categoría y geolocalización
│   │   │   ├── data/
│   │   │   ├── domain/
│   │   │   └── presentation/
│   │   │       └── screens/
│   │   │           └── search_screen.dart            # SearchBar + CategoryGrid + ResultsList
│   │   │
│   │   ├── service_request/              # Solicitar / gestionar servicios
│   │   │   ├── data/
│   │   │   ├── domain/
│   │   │   │   └── usecases/
│   │   │   │       ├── create_service_request_usecase.dart
│   │   │   │       └── accept_service_request_usecase.dart
│   │   │   └── presentation/
│   │   │       └── screens/
│   │   │           ├── request_service_screen.dart
│   │   │           └── active_request_screen.dart
│   │   │
│   │   ├── tracking/                     # Tracking en tiempo real (WebSocket o polling)
│   │   │   └── presentation/
│   │   │       └── screens/
│   │   │           └── tracking_screen.dart          # GoogleMap + live marker del profesional
│   │   │
│   │   ├── profile/                      # Perfil dual: cliente o profesional
│   │   │   └── presentation/
│   │   │       └── screens/
│   │   │           ├── profile_screen.dart
│   │   │           └── edit_profile_screen.dart
│   │   │
│   │   ├── payments/                     # Stripe: métodos de pago, historial
│   │   │   └── presentation/
│   │   │       └── screens/
│   │   │           ├── payment_methods_screen.dart
│   │   │           └── payment_history_screen.dart
│   │   │
│   │   └── ratings/                      # Calificación post-servicio
│   │       └── presentation/
│   │           └── widgets/
│   │               └── rating_dialog.dart            # Modal 1-5 estrellas + comentario
│   │
│   ├── shared/
│   │   ├── widgets/
│   │   │   ├── app_button.dart           # Botón primario/secundario con loading state
│   │   │   ├── app_text_field.dart       # TextField con validación y estilo unificado
│   │   │   ├── loading_overlay.dart      # Overlay de carga que bloquea la pantalla
│   │   │   ├── error_view.dart           # Vista de error con retry
│   │   │   └── avatar_widget.dart        # Avatar con presigned URL de S3
│   │   └── providers/
│   │       └── app_providers.dart        # dioClientProvider, authRepositoryProvider, etc.
│   │
│   └── main.dart                         # ProviderScope(child: MaterialApp.router(routerConfig: appRouter))
│
├── test/
│   ├── features/
│   │   └── auth/
│   │       ├── data/
│   │       │   └── auth_repository_impl_test.dart
│   │       └── presentation/
│   │           └── auth_notifier_test.dart
│   └── helpers/
│       └── mock_providers.dart           # ProviderContainer con mocks para tests
│
├── assets/
│   ├── images/                           # PNG/SVG de la app
│   ├── icons/                            # Iconos personalizados
│   └── fonts/                            # Fuentes (declarar en pubspec.yaml)
│
├── android/
│   └── app/
│       └── google-services.json          # Firebase — NO commitear (agregar a .gitignore)
├── ios/
│   └── Runner/
│       └── GoogleService-Info.plist      # Firebase — NO commitear
│
└── pubspec.yaml
```

#### pubspec.yaml — dependencias principales

```yaml
dependencies:
  flutter:
    sdk: flutter

  # Estado
  flutter_riverpod: ^2.5.1
  riverpod_annotation: ^2.3.5

  # Navegación
  go_router: ^13.2.0

  # HTTP
  dio: ^5.4.3+1

  # Modelos inmutables
  freezed_annotation: ^2.4.1
  json_annotation: ^4.9.0

  # Firebase
  firebase_core: ^2.31.1
  firebase_messaging: ^14.9.1

  # Mapas
  google_maps_flutter: ^2.6.1
  geolocator: ^12.0.0

  # Storage local (tokens JWT)
  flutter_secure_storage: ^9.2.2

dev_dependencies:
  flutter_test:
    sdk: flutter
  build_runner: ^2.4.9
  freezed: ^2.5.2
  json_serializable: ^6.8.0
  riverpod_generator: ^2.4.0
  mockito: ^5.4.4
```

#### Convenciones clave (Mobile)

| Regla | Aplicación |
|-------|-----------|
| Nombres de archivos | snake_case siempre (`auth_screen.dart`, no `AuthScreen.dart`) |
| Providers | Un archivo por provider/notifier — nunca mezclar varios en el mismo archivo |
| Repositorios | domain/ define el `abstract interface`, data/ provee la implementación |
| Modelos vs Entidades | `model` = data layer (tiene `fromJson`). `entity` = domain layer (sin deps externas) |
| Generación de código | `dart run build_runner build --delete-conflicting-outputs` después de modificar `@freezed` o `@riverpod` |
| Tokens JWT | Almacenar con `flutter_secure_storage` — nunca en `SharedPreferences` |

### Instalación (Mobile)

**Requisitos:** Flutter 3.19+, Dart 3.3+, Android Studio / Xcode.

```bash
git clone https://github.com/josepanz/TekoApp-Frontend-Mobile.git
cd TekoApp-Frontend-Mobile

flutter pub get

# Generar código de freezed y json_serializable
dart run build_runner build --delete-conflicting-outputs

# Configurar en lib/core/config/app_config.dart:
#   const String apiBaseUrl = 'http://10.0.2.2:3000';  // Android emulator → localhost
#   const String googleMapsApiKey = 'tu_api_key';

# Agregar google-services.json (Android) y GoogleService-Info.plist (iOS)
# desde Firebase Console

flutter run                        # debug en emulador/dispositivo
flutter build apk --release        # APK Android
flutter build ios --release        # IPA iOS (requiere Mac + Xcode)
```

### Patrones clave en Flutter

```dart
// Provider con Riverpod (ejemplo: obtener profesionales)
final professionalsProvider = AsyncNotifierProvider<ProfessionalsNotifier, List<Professional>>(
  ProfessionalsNotifier.new,
);

// Repositorio: depende del contrato abstracto, no de la implementación
final professionalRepository = Provider<ProfessionalRepository>(
  (ref) => ProfessionalRepositoryImpl(ref.watch(dioProvider)),
);

// go_router con guard de autenticación
GoRoute(
  path: '/home',
  redirect: (context, state) => ref.read(authProvider).isAuthenticated ? null : '/login',
  builder: (context, state) => const HomeScreen(),
)
```

---

## Contribuir

1. Haz un Fork del repositorio.
2. Crea tu rama: `git checkout -b feature/nueva-feature`.
3. Respeta el linter y los tests: `pnpm lint && pnpm test` (backend) / `flutter analyze && flutter test` (mobile).
4. Commit siguiendo Conventional Commits: `git commit -m 'feat: descripción de la feature'`.
5. Abre un Pull Request describiendo el cambio y su motivación.

> Todo el código debe estar fuertemente tipado. No se aceptan PRs con `any` (TypeScript) o sin cobertura de tests en lógica nueva.

---

## Contacto

**José Panza** — CEO/CTO, Tech Lead, Architect & Senior Staff Engineer

- 𝕏 (Twitter): [@PanzerPy](https://twitter.com/PanzerPy)
- Email: josepanza1@gmail.com
