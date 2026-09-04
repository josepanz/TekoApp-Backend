# Auditoría de plataforma — 2026-09-04

Documento canónico y transversal a los 3 repos (`TekoApp-Backend`, `TekoApp-Frontend-Web`,
`TekoApp-Frontend-Mobile`). Cada repo tiene además su propio `openspec/changes/*-platform-hardening-2026-09.md`
con solo su tajada, accionable y con checkpoints.

Pedido de José 2026-09-04, textual: dejar "100% óptimo y performante la comunicación entre todos
los microservicios en base a la naturaleza e idea del proyecto", más propuestas de mejoras/features
para que la aplicación sea **sostenible**, incluyendo bugs potenciales, conceptos mal planteados y
mejoras de forma/fondo/visuales.

## Metodología (y por qué importa para leer este documento)

1. Tres auditorías paralelas, una por repo, cada una partiendo del grafo de `graphify` del repo,
   sus `openspec/project.md`/`decisions.md`/`PENDING.md` y las reglas de `.claude/rules/`.
2. **Verificación posterior contra el código real** de todos los hallazgos críticos, hecha por
   separado. Esto no fue ceremonia: **4 de los hallazgos venían mal o incompletos** (ver tabla
   abajo). Ningún ítem de este documento se escribió sin abrir el archivo citado.

### Correcciones aplicadas sobre el reporte crudo de los agentes

| Reportado | Realidad verificada |
|---|---|
| Webhook: "moverlo a un controller público y verificar firma" | No existe decorador `@Public()`/`IS_PUBLIC` en todo el repo (`src/common/decorators/` tiene 7, ninguno de ruta pública). El fix necesita **crear esa infraestructura + middleware de raw-body**, porque el parser JSON global de Nest destruye el cuerpo crudo que `stripe.webhooks.constructEvent()` exige. Fix de 3 partes, no de una línea. |
| `Professionals` tiene "solo `@@index([status])`" | Tiene dos: `@@index([status])` y `@@index([isAvailable])` (`prisma/schema.prisma:412-413`). El hallazgo de fondo (falta índice geo/compuesto para `findNearby`) sigue en pie; el detalle estaba mal. |
| `professionalNetAmount` "nunca se escribe" | Es peor: además de no escribirse nunca, **está expuesto en la respuesta pública** (`payment-detail.response.dto.ts:95`). La API publica un campo que siempre viaja `null` y sobre el que un cliente podría construir. |
| `getSession()` colapsa 401 y 5xx (bug abierto) | **Ya está corregido** (`TekoApp-Frontend-Web/src/core/auth/session.ts:90-95`: 401 → `null`, resto → `SessionUnavailableError`). Lo que está desactualizado es `.claude/rules/auth.md`, que lo sigue declarando abierto — y por eso cada auditoría nueva lo vuelve a reportar como bug. |

Lección de proceso, aplicable a futuras auditorías: **las reglas de `.claude/rules/` y `decisions.md`
envejecen y generan falsos positivos**. Cualquier afirmación de esos documentos sobre el estado del
código debe re-verificarse antes de accionarse (ya está escrito así en
`.claude/rules/database-conventions.md`, y esta auditoría lo confirma dos veces más).

---

## 1. Comunicación entre servicios — el eje del pedido

La topología real es: **1 backend NestJS + 2 clientes** (Web actúa además como BFF para el
browser; Mobile habla directo). No hay microservicios entre sí — el "entre servicios" real es
**backend ↔ Web** y **backend ↔ Mobile**, más los canales asíncronos.

### 1.1 Canales existentes y su estado

| Canal | Implementación | Estado |
|---|---|---|
| REST | `src/api/*/controllers` → Web vía BFF (`/api/backend/[...path]`), Mobile vía `dio` | Funcional. Sin versionado de contrato (ver 1.2) |
| WebSocket | `locations` (Socket.io) | Mobile: `locations_socket_service.dart:38-56` sin `onConnectError`/`onDisconnect`/reconexión. Con `JWT_ACCESS_EXPIRATION=15m`, una sesión larga pierde el socket en silencio |
| Push | FCM (Mobile) + Web Push VAPID (Web) | Implementado. Checkpoint real de 2 dispositivos nunca ejecutado (`decisions.md:761`) |
| Webhooks entrantes | Stripe → `POST /payments/webhooks/:provider` | **ROTO Y INSEGURO** — ver 2.1 |
| Email | `modules/email` (nodemailer) | Funcional |

### 1.2 El problema estructural: dos contratos, una sola fuente de verdad

- **Web** genera sus tipos del OpenAPI real (`pnpm generate:api-types` → `types.generated.ts`,
  ~13k líneas). Se auto-corrige: si el backend cambia un DTO, `pnpm check:types` falla.
- **Mobile** escribe **cada modelo a mano** (`lib/features/*/models/*.dart`), sin codegen desde
  `GET /swagger-json`. Nada detecta un drift hasta que explota en runtime, en un dispositivo real.

Esto no es teórico: ya produjo un crash garantizado (ver 2.2). Es el **hallazgo estructural más
importante de la auditoría** porque *genera* bugs de forma continua en vez de ser uno solo.

- **Propuesta**: adoptar un generador OpenAPI→Dart en Mobile (candidatos: `openapi_generator`,
  `swagger_dart_code_generator`) con el mismo patrón que Web (`pnpm generate:api-types` → script
  equivalente en Mobile), y un job de CI que falle si el modelo generado difiere del commiteado.
  Ver `TekoApp-Frontend-Mobile/openspec/changes/0017-platform-hardening-2026-09.md`, Fase M4.

### 1.3 Sin versionado ni contrato de compatibilidad

Un cambio de DTO breaking en backend rompe simultáneamente a Web y Mobile, y Mobile **ya
desplegado en un teléfono no se puede "redesplegar"** — el usuario tiene que actualizar la app.
Hoy no hay: versionado de API (`/v1`), deprecación gradual, ni un contrato escrito de qué se
considera breaking.

- **Propuesta** (no urgente, sí estructural antes de tener usuarios reales): definir política de
  compatibilidad — campos nuevos siempre opcionales, remoción solo tras N versiones, y usar el
  chequeo de versión mínima que Mobile ya tiene (`lib/core/update/`) para forzar actualización
  cuando el backend rompa compatibilidad de verdad.

---

## 2. Hallazgos críticos verificados

### 2.1 [CRÍTICO · Backend · dinero] Webhook de Stripe: inalcanzable en producción y forjable

- `payments.controller.ts:60` — `@UseGuards(JwtAuthGuard)` a nivel de clase.
- `payments.controller.ts:205` — `@Post('webhooks/:provider')` **sin override de guard**. Stripe
  no manda JWT → 401. **El webhook nunca se ejecuta en producción.**
- `payments.service.ts:292-318` — `processStripeWebhook` lee `payload.type` y
  `payload.data.object` crudos. **`stripe.webhooks.constructEvent()` no se llama en ningún lado
  del repo.**
- `STRIPE_WEBHOOK_SECRET` es `Joi.string().required()` (`config-schema.ts:70`) y se carga
  (`config-loader.ts:112`, `app.config.ts:111`), pero **no lo consume ningún servicio**.

Consecuencia doble: (a) hoy los pagos quedan colgados en el estado que les dejó el flujo síncrono
porque la confirmación asíncrona nunca llega; (b) si alguien "arregla" solo el guard, cualquiera
que descubra la URL puede `POST` un `payment_intent.succeeded` forjado y marcar como cobrado
cualquier pago. Es el ítem de mayor riesgo de toda la plataforma.

**Diseño del fix** (3 partes, en este orden):
1. Crear `src/common/decorators/public.decorator.ts` (`SetMetadata(IS_PUBLIC_KEY, true)`) y hacer
   que `JwtAuthGuard` lo respete vía `Reflector` — infraestructura que hoy no existe.
2. Registrar `express.raw({ type: 'application/json' })` **solo** para la ruta del webhook (el
   `bodyParser` JSON global destruye el buffer crudo que la verificación de firma necesita).
3. Verificar con `constructEvent(rawBody, req.headers['stripe-signature'], webhookSecret)` y
   rechazar con 400 cualquier evento cuya firma no valide. Tests: firma válida → procesa; firma
   inválida → 400 y no toca la DB.

### 2.2 [CRÍTICO · Mobile · crash garantizado] `Rating` castea a `int` un campo que el backend documenta `null`

- Backend: `rating-detail.response.dto.ts:24-26,34-36` → `userId!: number | null` y
  `professionalId!: number | null`, con `nullable: true` y descripción explícita: "null cuando
  `isAnonymous=true` y quien consulta no es el [autor]".
- Web (codegen): tipa correctamente `number | null`.
- Mobile: `lib/features/ratings/models/rating.dart:39-40` → `json['userId'] as int`,
  `json['professionalId'] as int`.

La primera calificación anónima en una lista pública de reseñas lanza
`type 'Null' is not a subtype of type 'int'` y tumba la pantalla entera. Es la primera
materialización concreta del problema estructural de 1.2.

### 2.3 [CRÍTICO · Mobile · crash + bloqueo de tienda] iOS sin `NSCameraUsageDescription`

- `ios/Runner/Info.plist:29-30` declara **únicamente** `NSLocationWhenInUseUsageDescription`.
- `ImageSource.camera` se usa en `upload_document_sheet.dart:155` y
  `upload_portfolio_item_sheet.dart:119`.

En iOS, acceder a la cámara sin esa clave **no es un rechazo de review: es un crash inmediato** la
primera vez que un profesional toca "Tomar foto". Además es bloqueante para la submission.

### 2.4 [CRÍTICO · Web · autorización invisible al sistema de tipos] 5 permisos del backend sin constante

`TekoApp-Frontend-Web/src/core/auth/permissions.ts` solo espeja 3 grupos
(`LEGAL.CONSENT_AUDIT_VIEW`, `AI_DISCLOSURE.AUDIT_VIEW`, `SERVICE_PROGRESS.AUDIT_VIEW`).
Faltan 5 que sí existen en `TekoApp-Backend/src/common/enum/permissions.enum.ts:62-79`:
`PROFESSIONAL_PORTFOLIO.REVIEW`, `PROFESSIONALS.VERIFY`, `CONTRACTS.AUDIT_VIEW`,
`RATINGS.AUDIT_VIEW`, `PAYMENTS.AUDIT_VIEW`.

Contradice la regla propia del repo ("nunca comparar con un string literal") — de hecho
`features/payments/api.ts:62` menciona `payments.audit:read` en un comentario porque no tiene
constante que referenciar. `/admin/payments` y `/admin/ratings` se renderizan sin ningún chequeo
de permiso del lado cliente: si esos permisos no están asignados a ningún rol (como pasó con
`service-progress.audit:read`, ver `decisions.md:121-129`), son pantallas que existen y dan 403 a
todo el mundo.

### 2.5 [CRÍTICO · Web · WCAG 2.1.1 en el flujo que genera ingresos] Mapa sin alternativa de teclado

`features/request-service/components/location-picker-map.tsx` — la única forma de fijar lat/lng es
arrastrar el marcador (`dragend`) o hacer click en el mapa. No hay handler de teclado ni entrada
manual de coordenadas, y el `Input` de dirección de `request-service-form.tsx:188-198` es texto
libre que nunca se sincroniza con el mapa. Un usuario que navega solo con teclado **no puede
completar `/solicitar`**, que es por donde entra la demanda al marketplace.

### 2.6 [CRÍTICO · Web · dominio entero invisible] No existe `/admin/contracts`

Backend expone `@Controller('admin/contracts')` con `@Get()` gateado por `CONTRACTS.AUDIT_VIEW`
(`admin-contracts.controller.ts:13,18-19`). En Web **no existe `features/contracts/` ni
`app/admin/contracts/`** (verificado). Todo el dominio de contratos de servicio es invisible para
el staff en el único cliente pensado para gestionarlo.

### 2.7 [CRÍTICO · Mobile+Backend · requisito legal y de tienda] No hay borrado de cuenta

No existe flujo de eliminación de cuenta ni en Mobile (`profile_screen.dart` solo expone logout)
ni en el backend (ningún endpoint). Apple exige borrado de cuenta in-app desde 2022 (Guideline
5.1.1(v)), Google Play pide equivalente, y la Ley paraguaya 6534/2020 de protección de datos
concede derecho de supresión. Es bloqueante para publicar y es una obligación legal, no una
feature opcional.

---

## 3. Riesgos altos (no bloqueantes hoy, sí antes de escalar)

| # | Repo | Hallazgo | Evidencia |
|---|---|---|---|
| 3.1 | Backend | `findNearby` corre Haversine + `GROUP BY` sobre toda la tabla `professionals` sin índice de apoyo para el filtro. Los índices existentes (`status`, `isAvailable`) son de columna simple y no cubren el patrón real de la consulta | `locations-db.service.ts:81-105`, `schema.prisma:412-413` |
| 3.2 | Backend | `RateLimitConfig.createLimiter` construye 5 limitadores (`general`, `auth` 5/15min, `upload`, `payment` 20/h, `search`) y `middleware.config.ts:53` aplica **solo `general`**. El limitador anti-fuerza-bruta de login y el de pagos son código muerto | `middleware.config.ts:52-53` |
| 3.3 | Backend | Sin APM/error-tracking (ni Sentry ni equivalente). El logging estructurado sí es bueno (`nestjs-pino` + Seq), pero nadie se entera en tiempo real de una excepción. Combinado con 2.1: un webhook que falla en silencio deja un pago en `PROCESSING` para siempre sin alerta | grep sin resultados sobre `package.json`/`src/` |
| 3.4 | Backend | CI sin etapa de security scan (`lint → test → docker → release → deploy`). Ya estaba documentado como pendiente en `rules/infra.md`; **confirmado que sigue siendo cierto** | `.github/workflows/pipeline.yml` |
| 3.5 | Backend | No existe ningún mecanismo de payout al profesional. Peor: `professionalNetAmount` se expone en la respuesta pública y **nunca se escribe** — la API promete un dato que siempre es `null` | `payment-detail.response.dto.ts:95`; sin hits de `payout`/`withdrawal` en `src/` ni schema |
| 3.6 | Backend | No hay modelo de disputas/contracargos. Hay reembolsos (y son TOCTOU-safe), pero no hay forma estructurada de registrar por qué hubo disputa, quién resolvió y con qué resultado | sin hits de `dispute`/`chargeback` |
| 3.7 | Mobile | `AsyncStateView` hardcodea `'Ocurrió un error inesperado.'` y `'No hay datos para mostrar.'` — usado en 21 pantallas, sin `l10n` y **sin acción de reintentar**. Viola la regla propia "cero strings hardcodeados" | `shared/widgets/async_state_view.dart:35,43` |
| 3.8 | Mobile | Refresh de token concurrente sin coordinación: dos 401 simultáneos disparan dos `POST /auth/refresh-token`; si el backend rota el refresh al usarlo, el segundo falla y desloguea al usuario a mitad de sesión | `refresh_token_interceptor.dart:13-14` (limitación ya documentada) |
| 3.9 | Mobile | Sin retry/backoff en toda la capa de red; solo un timeout plano de 90s tuneado para cold starts de Render. Un paquete perdido = request fallido, y hasta 90s de spinner sin explicación | `api_client.dart:47-61` |
| 3.10 | Mobile | `Image.network` sin `errorBuilder` en los 2 widgets de portafolio, sobre URLs presignadas que expiran a los 900s. Los widgets hermanos (`teko_avatar`, `progress_timeline`) sí tienen el patrón correcto | `public_portfolio_section.dart:72-77`, `my_portfolio_screen.dart:100-105` |
| 3.11 | Web | El proxy BFF re-lanza el error crudo cuando el backend no responde → Next devuelve un 500 opaco y `apiFetch` sintetiza un mensaje genérico. El caller nunca distingue "backend caído" de "backend respondió mal" | `backend-proxy.ts:65-75`, `client.ts:43-55` |

---

## 4. Conceptos mal planteados (deuda de diseño, no bugs)

1. **Tres señales de verificación en `Professionals`** (`schema.prisma:363-378`): `status` (enum),
   `verificationStatus` (String libre, legado) y `requiredDocumentsVerified` (bool). El propio
   comentario en el schema admite una colisión pasada ya corregida. No está roto hoy, pero tres
   trackers para un concepto, uno sin tipar, es exactamente lo que causa la próxima colisión.
   **Propuesta**: convertir `verificationStatus` a enum, o documentar en código (no en comentario)
   cuál es autoritativo para cada lectura.
2. **`locations-db` (Postgres, última posición) vs `tracking-db` (Mongo, histórico)**: la división
   es correcta y responde a la estrategia híbrida documentada, pero los nombres no la hacen
   legible — alguien nuevo asume que son duplicados. **Propuesta**: renombrar a
   `professional-position-db` / `geo-tracking-db`. (Además: `tacking-db` tiene un typo en el
   nombre del archivo y del módulo.)
3. **`professionalNetAmount` expuesto sin implementar** (3.5): un campo público que siempre es
   `null` es peor que no tenerlo. **Propuesta**: quitarlo del DTO hasta que exista el flujo de
   payout que lo llene, o calcularlo ya (monto − comisión − impuesto) aunque no haya transferencia.
4. **Documentación que envejece y genera falsos positivos**: `rules/auth.md` de Web declara abierto
   un bug ya corregido; `rules/test.md` describe una cobertura e2e que no coincide con `e2e/`
   (subestima: hay `login`, `admin-categories`, `client-solicitar`, `smoke`). **Propuesta**: al
   cerrar un ítem, actualizar la regla en el mismo commit — ya es la convención para
   `decisions.md`, extenderla a `rules/`.

---

## 5. Forma, formato y peso visual (Web)

Todas las páginas siguen el mismo esqueleto generado (`h1` + descripción + un componente) — eso es
deliberado. La vida visual tiene que estar en el componente hijo, y ahí es donde falta. Pantallas
"planas" ordenadas por costo de oportunidad:

| # | Pantalla | Problema |
|---|---|---|
| 1 | `(client)/solicitar` (`request-service-form.tsx`) | **La pantalla por donde entra el ingreso al marketplace**: formulario apilado sin `Card`, sin indicador de pasos, sin acento en el CTA |
| 2 | `(client)/postularme-como-profesional` (`professional-application-form.tsx`) | El embudo de captación de oferta, con el mismo tratamiento nulo |
| 3 | `pro/perfil` (`professional-profile-form.tsx`) | La página más visitada por un profesional: sin panel de avatar/preview, sin indicador de completitud, sin agrupar campos en cards |
| 4 | `admin/categories` (`categories-table.tsx`) | `DataTable` pelada, sin `Badge` ni color ni siquiera para el booleano de visibilidad |
| 5 | `admin/roles-permission/[id]` (`role-detail-view.tsx`) | Vista de detalle sin jerarquía visual |

**Referencia de lo que sí está bien** (usar como vara): `features/analytics/components/overview.tsx`
+ `stat-card.tsx` y el hero con `BrandGradientBackground` de `(client)/page.tsx:18-23`. Son las dos
únicas superficies que aplican el 80/20 verde/teal con intención.

Otro patrón transversal: varias tablas muestran ids crudos en vez de nombres
(`ratings-table.tsx:75-83` renderiza `#${userId}`), lo que es a la vez un problema de usabilidad y
de nombre accesible.

---

## 6. Propuestas de sostenibilidad (features que faltan)

Ordenadas por si bloquean, obligan legalmente, o solo mejoran:

| Prioridad | Propuesta | Por qué |
|---|---|---|
| Bloqueante | Borrado de cuenta (Backend + Mobile + Web) | Apple 5.1.1(v), Google Play, Ley 6534/2020 PY |
| Alta | Payouts a profesionales | Un marketplace de dos lados sin forma de pagarle al lado de la oferta no cierra el ciclo de negocio |
| Alta | Observabilidad (Sentry/APM + alertas) | Sin esto, todo fallo asíncrono es silencioso (ver 2.1 + 3.3) |
| Alta | Codegen OpenAPI→Dart en Mobile | Corta de raíz la clase de bug de 2.2 |
| Media | Disputas/contracargos | Existe reembolso pero no el proceso que lo justifica |
| Media | Canal de soporte in-app | Hoy un usuario con un pago fallido no tiene ningún camino para contactar a nadie |
| Media | Preferencias de notificación + bandeja in-app | Solo existe el gateway de token push |
| Media | Scan de seguridad en CI | Ya documentado como pendiente hace meses |
| Baja | Login biométrico (Mobile) | El login nonce+RSA es más fricción que el promedio; mejora retención |
| Baja | Export/auditoría/búsqueda global (Web admin) | Estándar de portal admin a escala |

---

## 7. Roadmap propuesto (fases = checkpoints)

Cada fase cierra con los gates del repo en verde y confirmación explícita antes de la siguiente,
en una sola rama `audit/2026-09-04` por repo y **un commit agrupado por fase**.

| Fase | Repo | Alcance | Riesgo si no se hace |
|---|---|---|---|
| **A** | Backend | Webhook Stripe: `@Public()` + raw-body + `constructEvent` + tests | Pagos colgados / forjables |
| **B** | Mobile | `Rating` nullable, `Info.plist` cámara, `errorBuilder`, `AsyncStateView` a l10n + reintentar | Crash garantizado + bloqueo de tienda |
| **C** | Web | 5 constantes de permisos, 502 estructurado en el proxy, parser de error compartido, corregir `rules/auth.md` | Autorización invisible al type system |
| **D** | Backend | Índice compuesto para `findNearby`, cablear `authLimiter`/`paymentLimiter`, decidir `professionalNetAmount` | Degradación bajo carga, fuerza bruta sin freno |
| **E** | Web | Alternativa de teclado/coordenadas en `/solicitar` | Fallo WCAG en el flujo de ingresos |
| **F** | Web | `features/contracts` + `/admin/contracts` + tests | Dominio entero sin UI |
| **G** | Web | Pase visual sobre las 5 pantallas de §5 | Percepción de producto |
| **H** | Backend | Sentry/APM + scan de seguridad en CI | Fallos silenciosos |
| **I** | Los 3 | Specs (no código) de: borrado de cuenta, payouts, disputas, codegen Dart | Sostenibilidad / legal |

**Orden recomendado**: A → B → C → D → E → F → G → H → I. A/B/C son independientes entre sí y
podrían paralelizarse por repo; D en adelante conviene secuencial para no mezclar dominios en una
misma rama.

## 8. Ejecución: workflows con modelos por tipo de trabajo

Dos workflows guardados en `c:/workspace/.claude/workflows/`, invocables por nombre:

| Workflow | Modelo | Para qué |
|---|---|---|
| `audit-fix-phase` | **sonnet** | Implementa una fase completa: un agente por tarea (secuencial dentro del repo, porque las tareas comparten archivos) → gates reales del repo → revisión adversarial del diff contra el criterio de aceptación de la fase |
| `audit-docs-sync` | **haiku** | Post-fase: marca checkboxes contra el diff real, redacta la entrada de `decisions.md` y refresca el grafo con `graphify update`. Los 3 repos en paralelo (son independientes) |

El reparto de modelos es deliberado, no arbitrario: las tareas de cada fase ya están completamente
especificadas en los change docs (archivo, línea, criterio de aceptación), así que implementarlas
es ejecución y no diseño — sonnet alcanza. La documentación post-fase es todavía más mecánica
(marcar checkboxes contra un diff que ya existe, seguir un formato ya establecido) — haiku con
`effort: 'low'`.

Uso:

```
Workflow({ name: 'audit-fix-phase', args: { phase: 'A' } })
Workflow({ name: 'audit-docs-sync', args: { phase: 'A', repos: ['backend'] } })
```

Dos salvaguardas incorporadas a los scripts, aprendidas de esta misma sesión:
- El agente de implementación tiene instrucción explícita de **reabrir el archivo antes de editar**,
  porque los números de línea citados se corren con cada tarea previa de la misma fase.
- Los gates de Mobile incluyen `dart format --set-exit-if-changed` — se escapó una vez en la fase
  0016 y rompió el CI con todo lo demás en verde.
