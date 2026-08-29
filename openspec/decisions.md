# Decisiones de arquitectura — backend (features 2026-08-22)

Formato: decisión → motivo → estado, mismo criterio que
`TekoApp-Frontend-Mobile/openspec/decisions.md`.

## Por qué existe este archivo

Nace el 2026-08-23 junto con el resto de `openspec/` en este repo, para documentar las decisiones
de diseño de las 6 features grandes pedidas por José el 2026-08-22. El backlog original completo
(con la redacción exacta del pedido de José) vive en
`TekoApp-Frontend-Mobile/openspec/decisions.md`, sección "Backlog — features grandes pedidas
2026-08-22" — este archivo no lo copia, lo referencia, y agrega las decisiones específicas del
lado backend a medida que aparecen durante el diseño/implementación de `openspec/specs/` y
`openspec/changes/`.

## Tabla polimórfica para disclosure de IA y consentimiento de contenido: `entityType` + `entityReferenceId`, sin FK real

**Motivo**: `openspec/specs/ai-content-disclosure.md` y `openspec/specs/data-and-media-consent.md`
necesitan aplicar a contenido de tipos muy distintos (documentos, fotos de bitácora, presupuestos)
y a tipos que todavía no existen. Una FK real de Postgres por tipo de contenido obligaría a
agregar una columna nueva (o una tabla de unión nueva) por cada tipo de contenido futuro. Se opta
por guardar `entityReferenceId` como el `referenceId` (UUID) de la entidad marcada, sin constraint
de FK a nivel de base — la integridad referencial la garantiza la capa de aplicación (un helper
`AiDisclosureHelper`/`ConsentHelper` que resuelve `entityType` a su tabla real), no Postgres.

**Trade-off aceptado**: se pierde el `ON DELETE CASCADE` automático — si se borra físicamente una
entidad de contenido (algo que hoy no se hace, se usa `isActive`/soft-delete en todo el proyecto),
su disclosure/consentimiento queda huérfano. Aceptable porque el proyecto ya usa soft-delete como
patrón general, no hard-delete de entidades de negocio.

**Estado**: decidido, e implementado para `0006` (2026-08-25) — `ContentConsentGrants`/
`DataRetentionPolicies.contentType` ya usan `entityReferenceId`-style sin FK real. `0005`
(`AiContentDisclosures` en sí) sigue sin implementar, ver sección nueva más abajo sobre por qué el
enum se introdujo antes que la tabla.

## `Contracts.contentSnapshot` es inmutable (JSON congelado), no un join en vivo

**Motivo**: si el contrato (`openspec/specs/service-contracts.md`) leyera `BudgetOptions`/
`BudgetLineItems` en vivo, un cambio posterior al catálogo de materiales o al presupuesto
alteraría el contenido de un contrato ya firmado — inaceptable para algo con valor probatorio.

**Estado**: decidido, ver el modelo de datos en `openspec/specs/service-contracts.md`.

## Fase 0006 — Consentimiento legal: implementado 2026-08-25, decisiones tomadas durante la implementación

**`AiDisclosureEntityType` introducido en la migración de `0006`, no en `0005`.** El enum
"pertenece" conceptualmente a `ai-content-disclosure.md` (Fase 0005), pero `ContentConsentGrants`/
`DataRetentionPolicies` (Fase 0006, implementada primero por ser la fundacional) ya lo necesitan
como tipo de columna — un enum de Postgres debe existir antes de usarse. Cuando se implemente
`0005`, solo agrega `AiContentDisclosures` + `AiDisclosureSource`, reusando este mismo enum sin
duplicarlo.

**`RequiresActiveConsentGuard` vive en `src/api/legal-consents/guards/`, no en `common/` como decía
la spec original.** La spec de diseño (`data-and-media-consent.md`) decía "en `common/`" en un
sentido conceptual (compartido/reusable), pero `CLAUDE.md` de este repo prohíbe explícitamente
conexiones a DB o lógica de negocio en `common/` ("solo para utilidades compartidas"). El guard
necesita consultar `UserConsents` (vía `LegalConsentsDbService` inyectado), así que es lógica de
negocio real — se sigue el patrón ya existente de `PermissionsGuard` (vive en
`modules/auth/guards/`, junto a su lógica, mientras que el decorator `Permissions` puro —
`SetMetadata`, sin DB— sí vive en `common/decorators/`). Mismo split acá:
`RequiresActiveConsent` (decorator) en `common/decorators/`, `RequiresActiveConsentGuard` (guard)
en `api/legal-consents/guards/`, exportado desde `LegalConsentsModule` para que `0001`/`0002` lo
importen cuando se implementen.

**Limitación real, documentada, no resuelta**: `Users` no tiene ningún campo de país hoy (el
negocio es Paraguay-only, ver `.claude/rules/datetime.md`). La spec asume "documentos pendientes
por país del usuario" — sin ese campo, `findPendingVersionsForUser`/`hasActiveConsent` filtran
únicamente contra `LegalDocumentVersions.countryId: null` (versión internacional/paraguas). No se
agregó un campo de país a `Users` en esta fase (sería scope creep de una feature de consentimiento
a una migración de modelo de usuario) — cuando el negocio se expanda a más países, esta misma query
extiende con `OR countryId: user.countryId` sin romper nada de lo ya implementado.

**Algoritmo de `acceptanceHash`**: no especificado en la spec original. Se implementó como
`sha256(userId:legalDocumentVersionId:acceptedAt.toISOString())` — una huella de auditoría del
evento de aceptación (qué se aceptó, quién, cuándo exacto), no una firma criptográfica de
identidad ni un hash del contenido legal en sí. Documentado acá por si en el futuro se necesita
verificar/reproducir este hash desde otro proceso.

**Amendment 2026-08-25 (durante el punto 2 del roadmap, Mobile 0012)**: se detectó que
`HttpExceptionFilter` no exponía ningún identificador máquina-legible para distinguir
`CONSENT_REQUIRED`/`LEGAL_HOLD_ACTIVE` de cualquier otro 403/409 genérico — solo `message` (texto
humano, cambia con el idioma) y `error` (nombre genérico de la excepción). El resto del proyecto
hoy resuelve esto confiando en que el status code sea inequívoco por endpoint (ej. 409 en
`POST /payments` solo puede significar "ya existe"), pero un interceptor GLOBAL de dio en Mobile
(como pide `data-and-media-consent.md`) necesita distinguir un 403 de consentimiento de cualquier
otro 403 en cualquier endpoint. Se agregó un campo `errorCode` opcional en la respuesta de error
(`HttpExceptionFilter`, con test nuevo) y se actualizaron `RequiresActiveConsentGuard`/
`revokeContentConsent` para setearlo (`CONSENT_REQUIRED`/`LEGAL_HOLD_ACTIVE`) — cambio aditivo,
no rompe ninguna excepción existente (el campo se omite si no se define). Suite completa (86
suites, 1087 tests) verificada en verde después del cambio, dado que toca un filtro global.

**Sin specs de controller** (`legal-consents.controller.spec.ts`/
`admin-legal-consents.controller.spec.ts`) — se priorizaron los tests de la capa de negocio real
(guard + servicio api + servicio db, 17 tests) dado el tamaño de esta fase (10 endpoints, 4 modelos
nuevos). Los controllers son passthroughs delgados hacia el servicio ya testeado; verificado en su
lugar con un boot real de la app + `curl` contra un endpoint real (401 correcto sin token, las 10
rutas se registran con el path/verbo exacto de la spec). Pendiente si se quiere cobertura formal de
controller más adelante — no bloqueante para este checkpoint.

## Fase 0005 — Disclosure de contenido generado por IA (implementado 2026-08-25)

`AiContentDisclosures` (polimórfica, `@@unique([entityType, entityReferenceId])`) +
`AiDisclosureSource` (`PLATFORM_AI`/`USER_DECLARED_AI`) — `AiDisclosureEntityType` ya existía desde
la Fase 0006 (ver nota en `schema.prisma`, se reusa sin duplicar). `src/api/ai-disclosures/` +
`src/modules/ai-disclosures-db/`, mismo patrón de capas que `legal-consents`.

**Resolución de dueño — solo 2 tipos con resolver real hoy.** El endpoint `PUT /ai-disclosures`
exige que el usuario sea dueño de la entidad referenciada (403 si no), pero la tabla es polimórfica
y no tiene FK real a la entidad — se necesita un lookup específico por `entityType` para saber quién
es el dueño. Hoy solo existen 2 formularios reales en Mobile que producen contenido declarable
(`SERVICE_DESCRIPTION` → `Services.userId`, `PROFESSIONAL_DESCRIPTION` → `Professionals.userId`,
confirmado grepeando `TekoApp-Frontend-Mobile/lib/features/` antes de implementar — no se asumió la
lista de ejemplo de la spec). `AiDisclosuresService.resolveOwnerUserId()` es un `switch` que solo
conoce esos 2 casos; cualquier otro `entityType` resuelve a dueño `null` → `404`. `APP_CONFIG.KEY`
(`aiDisclosure.userDeclarableTypes`, ver más abajo) limita `PUT` a esos mismos 2 tipos con un `400`
explícito antes de llegar al resolver, así que agregar un tipo nuevo requiere tocar ambos lugares a
la vez (la lista de config y el `case` del switch) — no hay forma de habilitar un tipo a medias.

**`aiDisclosure.userDeclarableTypes` vive en `core/config/config-loader.ts`, NO en la clase
`AppConfig` de `app.config.ts`.** Error real cometido y corregido en esta misma tarea: `app.config.ts`
tiene una clase `AppConfig` con getters (`pagination`, `files`, etc.) que parece el lugar obvio para
"config nueva en `core/config`", pero esa clase **no está registrada en ningún módulo de Nest** — no
es lo que resuelve `@Inject(APP_CONFIG.KEY)` en ningún service real (`auth-api.service.ts`,
`web-push-provider.service.ts`, etc. inyectan `ConfigType<AppConfigType>`, cuyo tipo real es
`typeof APP_CONFIG` de `config-loader.ts`, un `registerAs('config', () => ({...}))` con un objeto
plano derivado de `process.env`). Agregar el getter a `AppConfig` habría sido código muerto — ESLint
lo delató solo (`no-unsafe-member-access`/`no-unsafe-call` al acceder `configService.aiDisclosure`,
porque esa propiedad no existe en el tipo real). Fix: el array se agregó directo al objeto que
retorna la factory de `config-loader.ts` (mismo criterio que `pagination` de `AppConfig`: valor de
negocio fijo, no secreto de env var, así que no necesita entrada en `config-schema.ts`/Joi).

**`retract` (retirar la propia declaración) valida contra `declaredByUserId` de la fila del
disclosure, no contra un segundo lookup a la entidad.** Mismo patrón que
`revokeContentConsent`/`ContentConsentGrants.uploaderUserId` de la Fase 0006 — el actor que declaró
queda grabado en la fila en el momento de la declaración (ya pasó la verificación de dueño ahí), así
que retirar es más barato y no depende de que el resolver de esa entidad siga existiendo. Efecto
lateral intencional: un disclosure `PLATFORM_AI` (sin `declaredByUserId`) no es retirable por ningún
usuario vía este endpoint — correcto, esa acción no le pertenece a un usuario.

**Sin controller specs** — mismo criterio que Fase 0006 (controllers son passthroughs delgados);
14 tests nuevos cubren servicio + capa db (declarar propio, tipo no declarable → 400, entidad
inexistente → 404, no-dueño → 403 en `declare` y en `retract`, resolución por `Professionals` para
`PROFESSIONAL_DESCRIPTION`). Suite completa verificada en verde (88 suites, 1101 tests) tras tocar
`config-loader.ts` (archivo global).

## Fase 0002 — Bitácora de trabajo: implementado 2026-08-27 (solo backend — Web/Mobile pendientes)

`src/api/service-progress/` + `src/modules/service-progress-db/`, modelo `ServiceProgressEntries` +
`Category.requiresProgressLog`, config `progressLog.*` (JOI), extensión de `completeService` con
`400 PROGRESS_LOG_REQUIRED`. Migración corrida contra Postgres local
(`20260827150844_add_service_progress_entries`).

**Decisión de alcance confirmada con José**: sí, el staff de `TekoApp-Frontend-Web` puede ver la
bitácora — se agregó el permiso `service-progress.audit:read` (mismo patrón que
`ai-disclosure.audit:read`) y `GET /services/:id/progress` autoriza tanto a los 2 participantes
(cliente dueño, profesional asignado) como a cualquier usuario con ese permiso o `admin:all`. Sin
endpoint `/admin/...` dedicado — es el mismo GET, según lo confirmado (ver
`openspec/specs/work-progress-log.md`).

**2 correcciones a la spec original, encontradas al implementar (verificando contra el código real,
no asumiendo)**:
- El POST no es multipart — el patrón real de este backend para imágenes es subir cada foto antes
  vía `POST /uploads/image` (ya existente) y mandar solo las keys de S3 en el body JSON del create.
- El consentimiento de imagen (`RequiresActiveConsentGuard`) no se aplicó como guard estático —
  bloquearía también las entradas solo-texto (`note` sin `images`). Se implementó el mismo chequeo
  inline en el service, condicionado a que la entrada realmente incluya fotos.

**Estado**: backend implementado y verificado (`pnpm run lint`/`test`/`format` en verde — 90
suites, 1122 tests). Pendiente: asignar el permiso nuevo a un rol real (tarea de datos, no de
código — confirmar con José a qué rol), la pestaña de Web (`src/app/admin/services`), y Mobile
(Fase 0008, ver `TekoApp-Frontend-Mobile/openspec/changes/0008-work-progress-log.md`).

## Fase 0001 — Documentos y antecedentes del profesional: rename `DocumentTypes` → `ProfessionalDocumentTypes` (2026-08-27, antes de implementar)

El roadmap ya marcaba el riesgo ("ojo con la colisión de nombre") — confirmado con José antes de
tocar el schema: `DocumentsType` (ya existe, `Users.documentTypeId`) es **documento de identidad
de la persona** (Cédula paraguaya, DNI argentino, Pasaporte, CIP brasileño, RUC — KYC de cualquier
usuario). El modelo nuevo de esta fase es **documento de habilitación/antecedente del profesional
en su rol de tal** (título técnico, título universitario, certificado de curso, antecedentes
policiales/judiciales) — un concepto de negocio completamente distinto que solo comparte la
palabra "tipo de documento" en español.

Rename aplicado en los 3 repos, antes de escribir código, para no arrastrar la ambigüedad:

- Modelo Prisma: `DocumentTypes` → `ProfessionalDocumentTypes` (tabla `document_types` →
  `professional_document_types`), mismo prefijo que su tabla hija `ProfessionalDocuments`.
- FK en `ProfessionalDocuments`: `documentTypeId` → `professionalDocumentTypeId` — `Users` YA
  tiene un campo `documentTypeId` (apunta a `DocumentsType`, el de identidad); dejar el mismo
  nombre de campo apuntando a una tabla distinta era exactamente la trampa que el roadmap
  anticipaba.
- Endpoints: `/document-types` → `/professional-document-types` (y su contraparte admin).
- DTOs: `CreateDocumentTypeRequestDTO`/`UpdateDocumentTypeRequestDTO` →
  `CreateProfessionalDocumentTypeRequestDTO`/`UpdateProfessionalDocumentTypeRequestDTO`.
- Mismo rename propagado a `TekoApp-Frontend-Mobile/openspec/specs/professional-documents.md` y
  `TekoApp-Frontend-Web/openspec/specs/professional-documents.md` (specs de referencia
  actualizadas, código de esos 2 repos: pendiente, se hace en su fase correspondiente).

**Estado**: solo el rename en las specs — la implementación real del modelo arranca después de
esta entrada.

## Fase 0001 — Documentos y antecedentes del profesional: implementado 2026-08-27

`src/api/professional-document-types/` + `src/modules/professional-document-types-db/` (catálogo),
`src/api/professional-documents/` + `src/modules/professional-documents-db/` (carga/revisión),
`ProfessionalVerificationHelper.recompute()`, migración
`20260827164759_add_professional_documents`. Rename `DocumentTypes` → `ProfessionalDocumentTypes`
ya documentado arriba, antes de escribir código.

**Decisiones tomadas al implementar (no estaban resueltas en la spec, o la contradecían):**

- **`professionalDocumentTypeReferenceId` (UUID), no un id numérico**, en
  `CreateProfessionalDocumentRequestDTO` — la spec original tenía `{ documentTypeId, issuedAt? }`
  con `documentTypeId` Int. Corregido contra la regla global del proyecto (nunca exponer el `id`
  interno en un DTO público, `.claude/rules/database-conventions.md`) — la spec de esta fase
  puntual no la respetaba, aplicada igual.
- **Catálogo NO paginado** (`GET /professional-document-types` devuelve `{data: [...]}` plano) —
  mismo criterio que `Category`/`findAll()`, que tampoco pagina: es un catálogo acotado (decenas de
  filas), no un log de auditoría potencialmente grande como `ai-disclosures`. La spec de Web
  mencionaba `--paginated` para el generador de scaffolding, pero eso es una decisión de Web sobre
  su propio `DataTable`, no obliga al contrato del backend.
- **Job de expiración: `@Cron`, no un `@Processor`/`@Process` de Bull** — la spec decía "mismo
  mecanismo que ya usa `NotificationsProcessor`", pero ese es un CONSUMIDOR de cola (reacciona a
  jobs encolados), no algo que corre solo de forma periódica. Para un barrido programado diario,
  `@Cron` (`ScheduleModule.forRoot()`, ya registrado globalmente) es el mecanismo real de NestJS —
  sí se reusa la cola de notificaciones (`NotificationsService.create()`) para el aviso al
  profesional, que es lo que la spec realmente buscaba lograr.
- **Consentimiento**: `LegalDocumentType.DATA_PROCESSING_CONSENT`, no `IMAGE_USAGE_CONSENT`
  (usado en la Fase 5/service-progress) — los documentos acá son datos personales/profesionales
  sensibles (antecedentes, títulos), no solo imágenes de contenido. Aplicado como
  `@UseGuards(RequiresActiveConsentGuard)` estático (a diferencia de service-progress, que lo
  aplicó inline) porque acá TODA llamada al endpoint sube un archivo — no hay el caso "entrada
  sin fotos" que forzó la excepción en service-progress.
- **Mapeo explícito de response, no cast crudo** (`professional-documents-response.helper.ts`) —
  a diferencia de `ai-disclosures` (que castea la entidad Prisma cruda al DTO), acá el modelo trae
  campos internos sensibles (`id`, `professionalId`, `createdBy`, `checksum`...) que
  `ClassSerializerInterceptor` NO filtra sobre un objeto plano (solo transforma instancias de clase
  con decorators de `class-transformer` — un objeto Prisma crudo no califica). Construir la
  respuesta a mano evita que esos campos internos lleguen al cliente.
- **`requiresStaffReview=false` → auto-aprobación implementada ya**, no dejada solo como flag de
  schema para "el futuro" (la spec decía "deja la puerta abierta... sin cambiar el modelo" sin
  pedir la lógica en sí) — se implementó igual porque es una rama condicional barata y el flag ya
  existe en el catálogo, sin sentido dejarlo inerte.
- **`verified` vacuamente cierto con 0 tipos requeridos aplicables** — se sigue la definición
  matemática de la spec tal cual ("todos los... obligatorios están aprobados"), sin agregar una
  excepción no pedida. Si en el uso real resulta confuso (verificado sin haber verificado nada),
  es un ajuste de una línea en `ProfessionalVerificationHelper`, señalado para revisar con José si
  aparece como problema real.

**Estado**: implementado y verificado — `pnpm lint`/`format`/`test` en verde (96 suites, 1154
tests, incluye 32 tests nuevos). Pendiente: Mobile (Fase 0007) y Web (Fase 0001) — no tocados en
esta sesión.

## Corrección post-implementación (2026-08-27, mismo día): colisión real con `verificationStatus`

Al empezar Web (Fase 0001) se encontró que `Professionals.verificationStatus` YA tenía un
escritor: `ProfessionalsService.verifyProfessional()` (`POST /professionals/:id/verify`, ya
existente desde antes de esta fase — aprobación MANUAL de staff sobre la cuenta del profesional
durante el onboarding, setea `verificationStatus` a `"verified"`/`"rejected"` JUNTO con `status`
ProfessionalStatus). Mi `ProfessionalVerificationHelper.recompute()` escribía sobre el MISMO
campo con vocabulario distinto (`"verified"`/`"unverified"`) — 2 escritores independientes sobre
el mismo campo, con semánticas distintas (aprobación de cuenta vs. estado de documentos), se
hubieran pisado entre sí en producción.

**Fix**: campo nuevo y separado, `Professionals.requiredDocumentsVerified` (Boolean,
`@default(false)`, migración `20260827172801_add_required_documents_verified`).
`ProfessionalVerificationHelper` escribe SOLO acá — `verificationStatus` queda intacto, sin
tocarlo desde esta fase. Expuesto en `ProfessionalDetailResponseDTO.requiredDocumentsVerified`.
Mobile (Fase 0007) ya corregido para leer este campo en vez de `verificationStatus`.

**Por qué no se encontró antes**: ni la spec de esta fase ni la implementación original
verificaron si `verificationStatus` ya tenía un escritor — se asumió libre. Grepear
`verificationStatus` en el repo ANTES de reusar un campo con nombre genérico hubiera evitado esto
— lección para la próxima fase que toque un campo que ya existe en el schema.

**Estado**: corregido, `pnpm lint`/`test` en verde (96 suites, 1154 tests) tras el fix.

## Endpoint faltante encontrado al empezar Web: `GET /admin/professional-documents` (cola global)

La spec de endpoints de esta fase (`openspec/specs/professional-documents.md`) solo tenía
`GET /admin/professionals/:referenceId/documents` (por UN profesional puntual) — pero la spec de
Web (`TekoApp-Frontend-Web/openspec/specs/professional-documents.md`) diseñó una
`PendingDocumentsTable` que asume una cola GLOBAL (todos los profesionales, paginada, filtrable
por estado/categoría). Sin esa ruta, staff tendría que saber de antemano qué profesional revisar
— inutilizable como cola real. Agregado antes de tocar Web:

- `GET /admin/professional-documents?status=&category=&page=&pageSize=` —
  `AdminProfessionalDocumentsController.queue()`, mismo guard/permiso que el resto del controller
  (`PROFESSIONAL_DOCUMENTS.REVIEW`/`ADMIN.ALL`).
- `ProfessionalDocumentsDbService.findPaginatedForAdmin()` — pagina con `PrismaPaginationUtil`,
  incluye `professional.user` para que la fila muestre nombre real, no solo el id.
- Respuesta: `AdminProfessionalDocumentResponseDTO` (extiende el DTO de documento + `professional:
  {referenceId, firstName, lastName}`), paginada (`AdminProfessionalDocumentsListResponseDTO`) —
  a diferencia del catálogo de tipos y de los otros listados de esta fase (no paginados), ESTE sí
  pagina porque es potencialmente grande (todos los documentos de todos los profesionales, no un
  catálogo acotado).

**Estado**: implementado y verificado (`pnpm lint`/`test` en verde, 96 suites, 1157 tests, incluye
3 tests nuevos).

## Extensión de Fase 0006 (2026-08-27) — habilitar auditoría de consentimiento en Web (punto 7 del roadmap)

Al verificar `TekoApp-Frontend-Web/openspec/specs/data-and-media-consent-admin.md` contra el código
real antes de que Web empezara a implementar, aparecieron 2 brechas reales — ver el detalle completo
en `openspec/changes/0006-data-and-media-consent.md` (sección "Extensión 2026-08-27"). Resumen:

- `GET /admin/legal/consents` no tenía filtros (solo paginación) — se agregaron
  `documentType`/`countryId`/`userReferenceId`/rango de fecha.
- No existía ningún endpoint admin para auditar `ContentConsentGrants` — se agregó
  `GET /admin/legal/content-consents`, mismo permiso que el de `UserConsents`.
- `UserConsentResponseDTO` no exponía IP/user-agent/hash/usuario (funcionaba en runtime por el cast
  crudo, pero no estaba tipado en Swagger) — nuevo `UserConsentAuditResponseDTO` con mapeo explícito
  (campos sensibles, no cast crudo), sin tocar el contrato de `POST .../accept`.
- **Lección de infra reusable**: `PrismaPaginationUtil` aplica cualquier `startDate`/`endDate`
  incondicionalmente sobre una columna `createdAt` hardcodeada — no configurable vía `options`. Para
  tablas sin esa columna (`UserConsents.acceptedAt`, `ContentConsentGrants.grantedAt`), el fix es
  armar el rango de fecha a mano en el `where` del service y eliminar esas keys del objeto que se le
  pasa a `paginate()` — no tocar el util compartido (usado por muchos otros dominios que sí tienen
  `createdAt`).
- Rol "compliance": confirmado con José que los permisos van tanto a `admin` como a un rol
  `compliance` nuevo — tarea de datos/seed pendiente, no de código.

**Estado**: implementado y verificado — `pnpm run lint`/`pnpm run build`/`pnpm run test` en 0
errores/warnings (96 suites, 1161 tests, incluye 8 tests nuevos).

## Fase 0003 — Presupuestos multi-opción: implementado 2026-08-28

`src/api/material-catalog/` + `src/modules/material-catalog-db/`, `src/api/budgets/` +
`src/modules/budgets-db/`. Ver `openspec/changes/0003-multi-option-quotes.md` para el detalle
completo de tareas y checkpoint pendiente.

**Decisión de diseño confirmada con José antes de implementar** (marcada como pendiente en la spec
original): `Service.finalAmount` cuando el servicio se acepta vía una opción de presupuesto (no
tarifa por hora) — se agregó una rama nueva en `ServicesService.completeService()` (mismo patrón
que la rama de `hourlyRate`): si no hay tarifa por hora, se busca la `BudgetOptions` con
`isSelected: true` para el servicio y su `totalPrice` alimenta `finalAmount` al completar.
`finalAmount` sigue siendo la única fuente de verdad del monto final; el flujo de pago
(`PaymentsService.createPayment`, que toma `dto.amount` del cliente) no se tocó — es una capa
separada, fuera de alcance de esta decisión.

**Resumen de lo no trivial**:
- `MaterialCatalog` sin DELETE (solo `PATCH isActive`) — mismo criterio que
  `ProfessionalDocumentTypes`, evita romper la FK de `BudgetLineItems.catalogItemId` en
  presupuestos históricos si se borrara un ítem de catálogo referenciado.
- `PUT .../budget-options` reemplaza el set completo solo mientras la `ServiceRequests` sigue
  `PENDING` — simplificación equivalente a "borra las anteriores no seleccionadas" de la redacción
  original (mientras está PENDING nunca hay una ya seleccionada), pero con transacción más simple
  (borra todas, crea las nuevas).
- `BudgetOptions` califica para `fn_attach_audit_triggers()` (montos financieros reales, mismo
  criterio que `ServiceRequests`/`Payments`); `MaterialCatalog`/`BudgetLineItems` quedan afuera a
  propósito (catálogo de configuración / detalle inmutable sin `created_by`).
- Los line items referencian el catálogo por `catalogItemReferenceId` (UUID) en el body de
  entrada/salida, nunca el id interno — se resuelve server-side antes de escribir, y se valida que
  todo `catalogItemReferenceId` recibido exista antes de crear cualquier opción.
- `select` extiende la transacción existente de `acceptRequestTransaction`
  (`BudgetsDbService.selectOptionTransaction`) en vez de componer dos `$transaction` separados —
  necesario para que el marcado de la opción elegida sea atómico junto con el rechazo de
  competidoras.

**Estado**: implementado y verificado — `pnpm run build`/`pnpm run lint`/`pnpm run test` en 0
errores/warnings (100 suites, 1188 tests, incluye 27 tests nuevos + 2 en `services.service.spec.ts`
para la rama de `finalAmount`). Boot real contra la DB confirmando que las 5 rutas nuevas
(`GET/POST/PATCH material-catalog`, `PUT/GET/PATCH budget-options`) se registran y responden `401`
sin token. Pendiente de José (no de código): checkpoint de negocio con un profesional/cliente
reales armando y aceptando un presupuesto end-to-end.

## Qué NO se decidió todavía (pendiente explícito)

- Si `Category` necesita un flag `requiresProfessionalSignature` para contratos donde el
  profesional no firma (ver `openspec/specs/service-contracts.md`, sección de parametrización) —
  no implementado en la primera versión por no haber sido pedido explícitamente.

## Fase 0004 — Contratos desde presupuesto aceptado: implementado 2026-08-28

Modelo `Contracts` + `ContractStatus` migrados (`add_service_contracts`), enum `LegalDocumentType`
extendido con `SERVICE_CONTRACT_TERMS`. Endpoints: `POST /budget-options/:referenceId/generate-
contract`, `GET /contracts` (mío), `GET /contracts/:referenceId`, `POST /contracts/:referenceId
/sign`, `GET /contracts/:referenceId/pdf`, `GET /admin/contracts` (staff, permiso
`contracts.audit:read` nuevo).

**Copy legal — decisión explícita de José (2026-08-28)**: todavía no existe el texto legal real.
Se usa un placeholder genérico (`CONTRACT_LEGAL_DISCLAIMER_PLACEHOLDER` en
`src/api/contracts/const/contracts.const.ts`, incluido en el PDF) marcado con `TODO(legal)` —
reemplazar por la cláusula definitiva de asesoría legal antes de producción. No bloquea el
desarrollo, coordinado a propósito para más adelante.

**Librería de PDF — decisión explícita de José (2026-08-28)**: se descartó Puppeteer/Chromium
headless (pesado, no encaja con el free tier de Render donde corre el backend). Se usa `pdfmake`
(ya era dependencia del proyecto, sin uso real todavía) vía el módulo `src/modules/report/`
existente — `ReportService.generate(..., { pdfEngine: 'native' })` con `PdfNativeGenerator`
(`pdfmake`, sin navegador). Este es el PRIMER consumidor real de `ReportModule`/`ReportService`,
que existía en el repo completo pero sin ningún caller (no registrado en `api.module.ts` — sigue
sin registrarse ahí porque no expone endpoints propios, solo se inyecta como dependencia). Mobile
solo visualiza el PDF generado por el backend, nunca lo genera — una sola fuente de verdad que
ambas partes ven igual.

**`legalTermsVersionId` — limitación de país heredada, no resuelta acá**: la spec pedía resolverlo
"según el país del `Service`", pero ni `Services` ni `Users` tienen un campo de país todavía (el
negocio es Paraguay-only — misma limitación ya documentada en
`LegalConsentsDbService.findPendingVersionsForUser`/`hasActiveConsent`). Se agregó
`findActiveVersionByType()` a `LegalConsentsDbService` con el mismo criterio (`countryId: null`,
última versión publicada) en vez de inventar una resolución de país que no existe en el dominio
real.

**Endpoint agregado que no estaba en la spec original**: `GET /contracts` (listado de contratos
propios, cliente o profesional, sin paginar — mismo criterio que
`ProfessionalDocumentsService.myDocuments`). La spec de backend solo listaba `GET /contracts
/:referenceId` (por uno) y `GET /admin/contracts` (staff) — pero el spec de Mobile
(`0010-contracts-from-accepted-budget.md`) pide explícitamente una pantalla "listado de contratos
propios", que no tenía dónde apoyarse. Se agregó ahora en vez de dejarlo como bloqueo para cuando
Mobile lo necesitara.

**Idempotencia de `generateContract`**: `Contracts.budgetOptionId` es `@unique` — un segundo
intento de generar contrato para la misma opción no falla, devuelve el contrato ya existente
(mismo criterio que la protección P2002 de `ratings.service.ts` documentada en
`.claude/rules/typescript.md`).

**Verificado**: 102 suites/1209 tests, `pnpm run build`/`lint`/`format` en 0 warnings, boot real
contra la DB de desarrollo confirmando que las 6 rutas nuevas se registran
(`ContractsController`, `BudgetOptionContractController`, `AdminContractsController`) y el trigger
de auditoría se re-adjuntó a `contracts` (`SELECT fn_attach_audit_triggers()`, aplicado manualmente
contra la DB real vía `prisma db execute` porque la migración ya se había corrido cuando se agregó
la línea al `.sql`, mismo procedimiento que fases anteriores).

## Fase 0008 — id/referenceId estandarizado (2026-08-28)

Ver `openspec/changes/0008-id-referenceid-standardization.md` para el detalle completo. Resumen:
ejecuta la "Decisión final (2026-08-08)" de `.claude/rules/database-conventions.md`, pendiente
desde esa fecha. Alcance real verificado contra código (no coincidía 100% con el backlog
original): 5 dominios (Services, ServiceRequests, PaymentMethodEntity, Payments, Rating) tenían un
mapper de respuesta (`exposeReferenceAsId` o reimplementación manual del mismo patrón) que borraba
el `id` interno y sobreescribía la clave `id` con el UUID — `PaymentTransaction` no existe como
entidad propia (es un campo string dentro de `Payments`), se cae del alcance. Fix: los mappers ya
no tocan `id`/`referenceId`, se exponen ambos tal cual vienen de Prisma; DTOs actualizados (`id:
number`, `referenceId: string` nuevo). Helper `reference-id.helper.ts` eliminado por quedar sin
callers. Sin cambio de rutas HTTP ni de FKs entre entidades (fuera de alcance, ver el archivo de
change). Breaking change deliberado sin shim de compatibilidad (proyecto sin usuarios reales
todavía) — Mobile/Web deben migrar toda navegación que usaba `entity.id` (antes UUID) a
`entity.referenceId`. Verificado: `pnpm run build`/`lint`/`test`(102/1211)/`format` en verde, 13
tests de spec actualizados para reflejar el contrato nuevo.

## Fase 0009 — Ratings: anonimato real + KPIs (2026-08-28)

Ver `openspec/changes/0009-ratings-anonymity-and-kpis.md` para el detalle completo. Resumen:
`isAnonymous` existía en el modelo pero nunca se aplicaba en ningún endpoint de
`RatingsController` — se agregó `RatingViewerContext`/`isAuthor()` y se aplicó masking real
(oculta el campo del AUTOR según `type`, nunca el del calificado) en todos los endpoints
party-facing; `GET /ratings` (ve todo) quedó guardado con el permiso nuevo
`ratings.audit:read`/`admin:all`. **3 bugs reales encontrados y corregidos, no anticipados**:
`aggregateUserStats` comparaba `Users.id` contra `Professionals.id` (siempre 0); las
transiciones `update`/`remove`/`reportRating` comparaban `rating.userId` a ciegas, rompiendo
autorización real para calificaciones `PROFESSIONAL_TO_CLIENT` (un profesional no podía editar
su propia calificación; un cliente no podía reportar la que un profesional le hizo); y — el más
severo — `GET /professionals/:id/reviews` (consumido hoy por `TekoApp-Frontend-Web`,
`/pro/calificaciones`) hacía un cast crudo de Prisma que filtraba la fila COMPLETA de `Users` a
cualquier usuario logueado, ignorando `isAnonymous` por completo. Se agregó también `GET
/ratings/me/stats` (resuelve el userId desde el token — `GET /auth/scope` nunca expone el id
interno) para que Mobile/Web pudieran construir pantallas de KPIs propias sin ese id. Verificado:
102 suites/1221 tests, build/lint/format en verde.

## Fase 0010 — Propinas (2026-08-28)

Ver `openspec/changes/0010-tips.md` para el detalle completo. Resumen: entidad `Tips` separada
(nunca fusionada a `Payment.totalAmount`, nunca pasa por `fee-calculator.service.ts`) + `TipConfig`
parametrizable (mismo criterio de resolución por país que `LegalDocumentVersions`, sin seed —
fallback seguro en código si no hay fila cargada, mismo patrón que `PlatformCommissionConfig`).
3 endpoints nuevos (`GET /tips/config`, `POST`/`GET /payments/:id/tip`) + `tip` anidado en
`GET /payments`/`GET /payments/:id`. **Hallazgo real**: el pago de este backend es simulado/
interno (no hay integración real con Stripe, `transactionId` es un `uuidv4()` local) — no hay
restricción técnica de "misma transacción de cobro" que forzara el diseño, la separación fue una
decisión de dominio. Verificado: 106 suites/1242 tests, build/lint/format en verde, boot real
contra Supabase confirmando las 3 rutas nuevas.

### Extensión (2026-08-28, mismo día): `GET /payments/me` + corrección de autorización en `payments`

José preguntó por qué la propina había quedado sin UI de creación en el modo cliente de Web si ese
repo sí tiene un `(client)` route group — la respuesta real era que Web nunca tuvo NINGUNA pantalla
de pagos propios (ni de lectura) fuera de `/admin/payments`, algo más grande que el alcance de
"propinas". Al construir esa pantalla nueva se encontró un gap de autorización real y previo,
no introducido por esta sesión pero sí agravado por exponerlo a un cliente ahora:

- **`GET /payments`** (`findAll`) aceptaba `userId`/`professionalId` arbitrarios por query sin
  ningún guard — cualquier usuario autenticado podía listar los pagos de cualquier otro. Igual que
  `GET /payments/summary`/`GET /payments/trends` (agregados de toda la plataforma, sin ownership
  check, y sin ningún consumidor real hoy — confirmado con grep en Web/Mobile). Fix: guardados con
  `PermissionsGuard` + `PERMISSIONS.PAYMENTS.AUDIT_VIEW`/`ADMIN.ALL` — mismo patrón que
  `RatingsController.findAll` (Fase 0009).
- **`GET /payments/:id`** (`findOne`) no verificaba que el pago perteneciera a quien lo pedía —
  cualquier usuario logueado podía leer el detalle financiero completo de un pago ajeno con solo
  conocer su `referenceId` (UUID, no adivinable en la práctica pero sin control alguno). Fix: nuevo
  `PaymentApiService.getPaymentByIdForViewer(id, user)` — permite ver si `payment.userId === user.id`
  o si el viewer tiene `PAYMENTS.AUDIT_VIEW`/`ADMIN.ALL`, si no lanza `ForbiddenException`. El
  `getPaymentById(id)` original (sin viewer) se mantiene intacto para los call sites internos ya
  confiables (`cancelPayment`, `refundPayment`, `updatePayment`), evitando tocar sus tests.
- **`GET /payments/me` (nuevo)** — lista los pagos propios resolviendo `userId` desde el token
  (nunca un query param), mismo criterio que `GET /ratings/me/stats` (Fase 0009). Es lo que
  consume la pantalla nueva de Web (`(client)/mis-pagos`). Ruta declarada antes de `:id` en el
  controller (mismo motivo que `methods`).
- Permiso nuevo: `PERMISSIONS.PAYMENTS.AUDIT_VIEW` (`payments.audit:read`).
- **Alcance deliberadamente NO ampliado**: no se agregó una vista de "mis pagos como profesional"
  (nadie la pidió, ni Web ni Mobile tienen esa pantalla) — `getPaymentByIdForViewer` solo compara
  contra `payment.userId` (el pagador), no contra `payment.professionalId`. `GET /payments/:id/tip`
  se dejó sin guard adicional (el tip por sí solo no expone PII).

Verificado: 106 suites/1248 tests, build/lint/format en verde.

## Fase 0011 — Marco legal/tributario multi-país (2026-08-28)

Ver `openspec/changes/0011-tax-config-and-content-liability-disclaimer.md` para el detalle
completo. Resumen: de los 3 sub-ítems del backlog original, 2 ya estaban resueltos por la Fase
0006 — solo faltaban (1) un valor nuevo de enum `USER_CONTENT_LIABILITY_DISCLAIMER` en
`LegalDocumentType` (reusa el 100% de la infra genérica de consentimiento, sin gatear ninguna ruta
todavía — decisión de producto/legal pendiente, no técnica) y (2) `TaxConfig`, modelo nuevo
parametrizable por país (mismo criterio de resolución que `TipConfig`) para IVA, expuesto vía
`GET /tax/config` con default seguro deshabilitado (`isEnabled: false`, `rate: 0`).

**Corrección de un gap pre-existente encontrado de paso**: Web nunca reflejó `SERVICE_CONTRACT_TERMS`
(agregado en Fase 0004/contratos) en su dropdown de tipo de documento legal — se agregó junto con el
tipo nuevo.

### Extensión el mismo día: `Payments.tax` renombrado de hecho (wireado a `platformFee`/`tax` reales)

José pidió explícitamente corregir la confusión de nombres en vez de dejarla solo documentada:
`Payments.tax` guardaba, antes de este fix, la **comisión de la plataforma**
(`FeeCalculatorService.calculatePlatformFee()`), no un impuesto gubernamental — Web ya mostraba esa
columna como "Impuesto" en el detalle de pago, así que el dato mostrado bajo ese label era
incorrecto (aunque la etiqueta en sí ya era la correcta). Resuelto sin necesidad de renombrar la
columna del schema: `Payments` ya tenía un segundo campo, `platformFee`, correctamente nombrado
pero **nunca escrito** (siempre `0.00` — confirmado que `analytics-db.service.ts` lo lee para
`platformRevenue`, que por eso daba 0 siempre). El fix real fue en
`PaymentApiService.createPayment`:

- Lo que antes se calculaba como `tax` (vía `calculatePlatformFee`) ahora se guarda en
  `platformFee` — el campo que siempre tuvo el nombre correcto para ese dato.
- `tax` ahora se calcula de verdad con `TaxService.calculateTax(platformFee)` (IVA sobre la
  comisión de la plataforma — criterio técnico elegido y documentado en `tax.service.ts`, ver
  `openspec/changes/0011-*.md`). Con la config default deshabilitada, da `0`, así que
  `totalAmount` sigue calculando exactamente igual que antes (`amount + fee + platformFee + 0`) —
  cero cambio de comportamiento numérico hasta que exista una tasa real cargada por asesoría
  fiscal.
- `TaxModule` ahora se exporta e importa desde `PaymentsModule` (`TaxService` inyectado en
  `PaymentApiService`).
- **No se tocó `professionalNetAmount`** (otro campo dormido, siempre `null`, encontrado de paso en
  la misma investigación) — no fue parte del pedido explícito y calcularlo bien exige definir una
  fórmula de negocio (¿el profesional paga la comisión del proveedor o la absorbe la plataforma?)
  que nadie pidió resolver acá.

**Migración aplicada contra Supabase** (autorización explícita de José para tocar la DB compartida
esta sesión): `npx prisma migrate dev` detectó que la migración `20260828194041_add_tips` había
sido modificada después de aplicada (por el `SELECT fn_attach_audit_triggers();` agregado a mano en
la Fase 0010) y pedía un `migrate reset` completo. En vez de resetear (que hubiera borrado datos
reales sin necesidad), se corrigió el `checksum` de esa fila en `_prisma_migrations` directamente
(`UPDATE ... SET checksum = <sha256 real del archivo>`, verificado con `sha256sum`) — un fix de
metadata no destructivo, sin pérdida de datos ni necesidad de reseed. Con eso resuelto, la migración
nueva se aplicó limpia. Se re-invocó `SELECT fn_attach_audit_triggers();` para incluir `tax_config`.
Boot real contra Supabase confirmando: Postgres/Mongo/Redis arriba, `GET /tax/config` registrada,
sin errores de DI.

Verificado: 109 suites/1258 tests, build/lint/format en verde. Migración aplicada y boot real
confirmado contra Supabase — sin pendientes.
