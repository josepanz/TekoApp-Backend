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

## Trabajo derivado de `platform-hardening-2026-09` — fix de autorización en `POST /payments/:id/refund` (2026-09-07)

Ver `openspec/changes/platform-hardening-2026-09/WORKPLAN.md` §8, "Hallazgo sin ID". Encontrado de
paso haciendo I-03 (2026-09-06): el endpoint estaba solo detrás de `JwtAuthGuard` a nivel de clase,
sin `PermissionsGuard`/`@Permissions` y sin acotar el pago al usuario autenticado — a diferencia de
`cancel()`, que sí pasa `req.user.id` al service. Cualquier usuario logueado podía reembolsar el
pago de cualquier otro conociendo su id.

Fix (dos partes, ambas necesarias):

- `@UseGuards(PermissionsGuard)` + `@Permissions(PERMISSIONS.PAYMENTS.AUDIT_VIEW, PERMISSIONS.ADMIN.ALL)`
  en `PaymentController.refund` — el mismo permiso que ya gatea `findAll`/`getSummary`/`getTrends`
  en el mismo controller, no uno nuevo inventado.
- `PaymentApiService.refundPayment` ahora recibe `userId` y lanza `ForbiddenException` si
  `payment.userId !== userId`, igual que `cancelPayment`.

Efecto: por diseño, este endpoint queda utilizable solo por quien tiene el permiso de auditoría de
pagos **y** es dueño del pago — deliberadamente restrictivo como cierre provisorio del agujero de
autorización. El camino real de reembolso administrativo (staff reembolsando pagos de terceros)
queda para las vías de adjudicación de disputas que especifica `I-03-dispute-records.md`
(`PATCH /admin/disputes/:referenceId/resolve`, aún sin implementar).

Commit: `a3760f6`. Verificado: 117 suites/1323 tests, build/lint/format en verde.

## W-01 de `0015-admin-backoffice-endpoints.md` — `GET /admin/audit-logs` (2026-09-07)

Ver `openspec/changes/0015-admin-backoffice-endpoints.md` para el detalle completo. Endpoint de
solo lectura sobre `AuditLogs` (poblada por triggers de auditoría, nada la escribe vía código de
aplicación), para el visor de auditoría de Web (`admin-audit-log-viewer.md`).

Módulos nuevos: `src/modules/audit-log-db` (Prisma) y `src/api/audit-log` (controller/service/DTOs),
mismo layout que `contracts`. Permiso nuevo `SYSTEM.AUDIT_VIEW` (`system.audit:read`) — se suma
solo al enum `PERMISSIONS`, el seed ya lo recoge automáticamente (`flattenPermissionCodes` de
`prisma/seed.ts` itera el objeto completo, no una lista estática).

**Decisión técnica**: no se reusó `PrismaPaginationUtil.paginate` a pesar de que otros módulos de
auditoría lo hacen (`contracts`, `ai-disclosures`). Ese helper arma el filtro de rango de fechas
siempre contra una columna `createdAt` hardcodeada; `AuditLogs` no tiene esa columna, solo
`changedAt`. Reusarlo hubiera roto en runtime ("Unknown argument `createdAt`") apenas alguien
mandara `startDate`/`endDate` en el query — que es justo uno de los filtros que pide la spec de
Web. Se escribió paginación manual en `AuditLogDbService.findPaginated` en su lugar (mismo cálculo
de `skip`/`take`/`totalPages`, filtro de fecha sobre `changedAt`).

`AuditLogs.id` es `BigInt` — se serializa a `string` en el mapper de respuesta (`.toString()`),
mismo criterio que otros ids grandes del repo (#0008).

Web: correr `pnpm generate:api-types` — desbloquea `admin-audit-log-viewer.md`.

Commit: `220b801`. Verificado: 120 suites/1331 tests, build/lint/format en verde.

## W-02 de `0015-admin-backoffice-endpoints.md` — export CSV pagos y profesionales (2026-09-07)

Ver `openspec/changes/0015-admin-backoffice-endpoints.md` para el detalle completo. Dos commits
separados (`14c80d6` pagos, `cf63580` profesionales), como pide la spec.

**Hallazgo de paso, no anotado en la spec**: `FileDownloadInterceptor` + `@DownloadFile()` ya
existían en el repo (`src/core/interceptors/file-download.interceptor.ts`) pero **nunca se habían
usado** — ningún controller los aplicaba, y tampoco estaban registrados como interceptor global.
Al cablearlos por primera vez para este endpoint apareció un conflicto real: `TransformInterceptor`
(global, envuelve toda respuesta en `{success, data, message, timestamp, path}`) no distinguía un
`StreamableFile` de cualquier otro dato — lo hubiera envuelto adentro de `data`, rompiendo la
respuesta binaria (Nest solo reconoce `StreamableFile` como valor de retorno de nivel superior).
Corregido en `TransformInterceptor.intercept()`: si `data instanceof StreamableFile`, se devuelve
tal cual sin envolver. Cubierto con `transform.interceptor.spec.ts` (no existía spec de ningún
interceptor de `core/interceptors` antes de esto).

**Pagos**: `AdminPaymentsController` (`GET /admin/payments/export`), mismo permiso que el listado
admin (`PAYMENTS.AUDIT_VIEW`/`ADMIN.ALL`), mismos filtros que `getPayments` (`userId`,
`professionalId`, `status`), sin paginar. Reusa `ReportService.generate(..., {format: 'csv'})` (ya
existía, usado hoy por `contracts` para PDF) — no se escribió ningún generador de CSV nuevo.

**Profesionales**: `AdminProfessionalsExportController` (`GET /admin/professionals/export`).
Permiso `PROFESSIONALS.VERIFY`/`ADMIN.ALL` — decisión explícita de la spec: `GET /professionals`
no tiene gate de permiso (lectura pública), así que el export no podía heredar "el mismo permiso
que el listado" como en pagos. Se extrajo el armado de `where` de `ProfessionalsDbService.findMany`
a un método privado (`buildListWhere`) para no duplicarlo en el nuevo `findAllForExport` (mismos
filtros, sin paginar).

Web: correr `pnpm generate:api-types` — desbloquea `admin-data-export.md`.

Verificado: 123 suites/1341 tests, build/lint/format en verde.

## W-03 de `0015-admin-backoffice-endpoints.md` — búsqueda por texto en listados (2026-09-07)

Ver `openspec/changes/0015-admin-backoffice-endpoints.md` para el detalle completo. Un solo
commit (`81083a8`) — `users` no necesitó cambio de código.

**`users`**: verificado `users-db.service.ts#findAll` — el filtro `name` ya arma un `AND` de `OR`
multi-palabra sobre `firstName`/`lastName` con `contains` + `mode: insensitive`, y `email` también
usa `contains`/insensitive. Ya sirve tal cual para la búsqueda de Web. Se agregó un test de
regresión en `users-db.service.spec.ts` (no existía cobertura explícita de este filtro antes).

**`professionals`**: no tenía ningún filtro de texto. Se agregó `search?: string` a
`GetProfessionalsListQueryDTO` y el mismo patrón multi-palabra (`AND` de `OR`) sobre
`user.firstName`/`user.lastName` en `ProfessionalsDbService` — reusado tanto por `findMany` (vía
`buildListWhere`, ver W-02) como por `findAllForExport`, así que el export CSV de W-02 también
hereda la búsqueda sin cambios adicionales.

No se agregó ningún endpoint agregador (`GET /admin/search`) — la spec de Web explícitamente no lo
pide en esta iteración, hace la agregación del lado cliente contra `/users?search=` y
`/professionals?search=`.

Web: correr `pnpm generate:api-types` — desbloquea la "opción intermedia" de
`admin-global-search.md` deja de ser necesaria (Web puede buscar con texto libre directo).

Con esto, `0015-admin-backoffice-endpoints.md` queda cerrado: W-01, W-02 y W-03 completas.

Verificado: 123 suites/1344 tests, build/lint/format en verde.

## I-01 — Borrado de cuenta con ventana de gracia (2026-09-07)

Ver `openspec/changes/platform-hardening-2026-09/I-01-account-deletion.md` (spec original +
sección "Estado de implementación" con el detalle completo). Implementación real de la spec que
`I-01` de `platform-hardening-2026-09` había dejado escrita pero no implementada — bloquea la
publicación de Mobile.

**Schema**: `UserStatus.PENDING_DELETION` (login permitido durante la ventana, sin cambios de
comportamiento respecto a `ACTIVE` en `AuthService.validateUserStatus`), `Users.deletionRequestedAt`/
`deletionScheduledAt`, `ProfessionalDocuments.fileKey` pasa a nullable (se anula al borrar el
objeto real de S3 al anonimizar). Migración `20260907130000_add_account_deletion` — **aplicada
contra Supabase por José** (el clasificador de "auto mode" de la sesión bloqueó el comando de
migración pese a la autorización explícita en el chat; se documentó el bloqueo en el propio
archivo de la spec y José la corrió a mano). `prisma migrate status` limpio, confirmado.

**Desviaciones reales respecto a la spec** (las 6 completas están detalladas en el archivo de la
spec, sección "Estado de implementación" — resumen):

1. Los endpoints de autoservicio NO viven en `users` (la spec asumía eso) sino en `auth/me/*` —
   el self-service real de "mi cuenta" en este repo ya es `GET/PUT /auth/me`, `users` es
   admin/staff sobre otros usuarios. `AccountDeletionController` nuevo, mismo módulo `auth/me`.
2. `deletionScheduledAt` se expone en `GET /auth/scope` (ya hace `findUserById` fresco), no en
   `GET /auth/me` (JWT-echo puro, quedaría desactualizado hasta el próximo login).
3. El bloqueante de disputa abierta (I-03) queda **sin implementar** — `PaymentDisputes` no
   existe todavía, I-03 es la tarea siguiente. Los otros 3 (servicio activo, pago pendiente,
   contrato sin firmar) están completos y testeados.
4. `@Cron` (no Bull) para el job de vencimiento — misma corrección que
   `professional-documents-expiration.job.ts`, mismo criterio (barrido periódico, no cola
   reactiva). Corre a las 4am.
5. `ProfessionalDocumentResponseDTO.fileKey` pasa a `string | null` — consecuencia directa de
   volver nullable la columna, si no el build rompía.
6. `Professionals.description`/`skills`/`certifications` sin anonimizar — la spec lo deja
   explícitamente como decisión abierta, no resuelta acá. Solo `status = SUSPENDED, isActive = false`
   (mismo efecto que ya usa `suspendProfessional()`).

**Fix de infraestructura compartida, necesario para el contrato de error de la spec**:
`HttpExceptionFilter` normalizaba toda excepción a `{message, error, errorCode?}` — el `409
DELETION_BLOCKED` necesita devolver la lista real de bloqueantes con su conteo (no un mensaje
genérico, pedido explícito de la spec). Se agregó un campo `details` opcional, mismo criterio que
`errorCode` (pasa tal cual, nunca se parsea). Cubierto con test nuevo en
`http-exception.filter.spec.ts`.

**Reuso de infraestructura existente para los bloqueantes** (evitó duplicar acceso a Prisma en el
módulo nuevo): `ServicesDbService.countServices` (ya existía, sin cambios) +
`ContractsDbService.countContracts` y `PaymentDbService.countPayments` (nuevos, un método
genérico cada uno, mismo patrón que `countServices`).

**Módulos nuevos**: `src/modules/account-deletion-db` (`AccountDeletionDbService` — la
transacción de anonimización cruza Users+Professionals+ProfessionalDocuments+PushSubscriptions+FcmTokens
en un solo lugar, deliberadamente fuera del patrón "un `-db` module por dominio" porque es una
operación atómica única de este feature) y `src/api/account-deletion` (service + controller +
job de vencimiento).

Commit: `a24cf7f`. Verificado: 127 suites/1369 tests, build/lint/format en verde, migración
aplicada por José (2026-09-07) y `prisma migrate status` limpio antes y después.

## I-03 — Registro y adjudicación de disputas de pago (2026-09-11)

Ver `openspec/changes/platform-hardening-2026-09/I-03-dispute-records.md` (spec original, cerrada
y decidida) — implementación tal cual, sin rediseño.

**Schema**: enums `DisputeStatus` (`OPEN`/`UNDER_REVIEW`/`RESOLVED`/`REJECTED`/`WITHDRAWN`),
`DisputeReason` (5 valores, reemplaza como motivo de disputa al `RefundReason` TS-only que sigue
viviendo en `refund-payment.dto.ts` para el camino de reembolso directo de staff) y
`DisputeResolution` (`FULL_REFUND`/`PARTIAL_REFUND`/`NO_REFUND`/`OTHER_REMEDY`). Modelo
`PaymentDisputes` con el patrón estándar (`id` Int + `referenceId` UUID + columnas de auditoría),
sin `@@unique([paymentId])` a propósito — un pago puede tener más de una disputa a lo largo del
tiempo, el service impide 2 simultáneas `OPEN`/`UNDER_REVIEW` sobre el mismo pago (chequeo previo,
no constraint de DB). Migración `20260911120000_add_payment_disputes`, aplicada contra Supabase
por conexión directa (5432): tabla, índices (`payment_id`, `status`,
`reference_id` único) y `trg_audit_payment_disputes` verificados con consultas directas contra la
base después de aplicar; `prisma migrate status` limpio antes y después.

**Endpoints** (los 6 de la spec, sin desviación): `POST/GET /payments/:id/disputes`,
`POST /payments/:id/disputes/:referenceId/withdraw`, `GET /admin/disputes`,
`PATCH /admin/disputes/:referenceId/claim`, `PATCH /admin/disputes/:referenceId/resolve`. Permiso
nuevo `disputes.adjudication:manage` (`PERMISSIONS.DISPUTES.ADJUDICATE`) — se siembra solo por
existir en `PermissionsEnum` (el seed de T-04 ya aplana el catálogo completo, no hizo falta tocar
`prisma/seed.ts`).

**Decisiones tomadas durante la implementación** (la spec las dejaba abiertas a propósito):

1. **`resolve` no fuerza pasar por `UNDER_REVIEW`**: el `updateMany` condicional acepta tanto
   `OPEN` como `UNDER_REVIEW` como estado de origen — un staff puede adjudicar directo sin "tomar"
   la disputa primero.
2. **El reembolso de la resolución reusa `PaymentDbService.executeRefund` sin duplicarlo**: se le
   agregaron dos parámetros opcionales — `disputeReferenceId` (queda en `refundDetails` para
   trazabilidad inversa pago→disputa) y `tx` (permite que
   `PaymentDisputesDbService.resolve` lo dispare DENTRO de la misma transacción que marca la
   disputa `RESOLVED`/`REJECTED`, mismo patrón de `tx` opcional que ya usa
   `UserRolesDBService.replaceUserRoles`). Sin `tx`, `executeRefund` sigue abriendo su propia
   transacción — el camino de reembolso directo de staff (`POST /payments/:id/refund`, ya gateado
   por permiso desde `a3760f6`) no cambia de comportamiento.
3. **El camino sin disputa (reembolso directo de staff) no se tocó**: sigue existiendo, sigue sin
   exigir abrir una `PaymentDisputes` — la spec lo dejaba como decisión de producto aparte, no
   bloqueante para esta implementación.

**Cierra el cabo suelto de I-01** (borrado de cuenta, `a24cf7f`): la tabla de bloqueantes de esa
spec incluía "Disputa abierta (I-03)" pero no se pudo implementar porque `PaymentDisputes` no
existía. `AccountDeletionService.findBlockers` ahora cuenta disputas `OPEN`/`UNDER_REVIEW` donde el
usuario es quien la abrió, el cliente del pago, o su profesional (`DeletionBlockerType.OPEN_DISPUTE`,
vía `PaymentDisputesDbService.countOpenDisputesForUser`) — una cuenta con una disputa abierta ya no
puede completar el borrado.

**Hallazgo real encontrado escribiendo los tests de `AdminDisputesController`**:
`PermissionsGuard.canActivate` (`src/modules/auth/guards/permissions.guard.ts`) lee la metadata de
permisos con `this.reflector.get(PERMISSIONS_KEY, context.getHandler())` — **solo el handler**,
nunca `context.getClass()`. Un `@Permissions(...)` puesto a nivel de controller (en vez de en cada
método) no lanza error ni se ignora con warning: `requiredPermissions` da `undefined` y el guard
simplemente deja pasar a cualquier usuario autenticado. `AdminDisputesController` decora los 3
métodos por separado (mismo criterio que `AdminPaymentsController`/`PaymentController`, que ya
lo hacían así) — trampa real del repo, no de esta spec puntual, vale la pena tenerla presente para
cualquier controller nuevo que agrupe varios endpoints bajo un mismo permiso.

Commit: `262c071`. Verificado: 131 suites/1406 tests, build/lint/format en verde.

## Fix de seguridad — endpoints admin desprotegidos por `@Permissions` de clase (2026-09-11)

El hallazgo del `PermissionsGuard` de I-03 (arriba) se generalizó: se barrieron TODOS los
controllers buscando el mismo patrón ("`@Permissions` entre `@Controller(...)` y `export class`,
con algún método sin su propio `@Permissions`") y aparecieron dos, **en producción, sin ningún
método decorado**:

- `AdminProfessionalDocumentsController` (`professional-documents.review:manage`) — 3 endpoints:
  `GET admin/professional-documents`, `GET admin/professionals/:referenceId/documents`,
  `PATCH admin/professional-documents/:referenceId/review`.
- `AdminProfessionalPortfolioController` (`professional-portfolio.review:manage`) — 2 endpoints:
  `GET admin/professional-portfolio`, `PATCH admin/professional-portfolio/:referenceId/review`.

A diferencia de `AdminDisputesController` (recién creado en I-03, nunca llegó a estar expuesto),
estos dos YA estaban mergeados en `develop` — cualquier usuario logueado del marketplace podía
listar y leer documentos de identidad/antecedentes de profesionales, y aprobar o rechazar
revisiones de documentos y de portafolio (incluidas las propias), sin ningún permiso especial.

**Fix**: `@Permissions(...)` repetido en cada uno de los 5 métodos, con el mismo permiso que ya
declaraba la clase. El decorador de clase se dejó (mismo valor, no aporta protección real) pero
con un comentario explícito de que es decorativo — para que el próximo que lo lea no vuelva a
asumir que alcanza.

**Tests de regresión reales, no solo de metadata**: cada uno de los 5 endpoints tiene un test que
instancia `PermissionsGuard` con un `Reflector` real (sin mockear) contra el método real del
controller — si el `@Permissions` de un método se borra otra vez, el test falla con un 403 que
debía tirarse y no se tiró, en vez de solo comparar el arreglo de metadata.

**Barrido posterior**: no apareció ningún otro controller con el mismo patrón.

**Propuesta evaluada y NO implementada** (a pedido explícito, para no mezclar con el fix urgente):
cambiar `PermissionsGuard.canActivate` a `this.reflector.getAllAndOverride(PERMISSIONS_KEY,
[context.getHandler(), context.getClass()])` — el patrón estándar de NestJS, que haría que un
`@Permissions` de clase funcione como cualquiera esperaría. Es el arreglo de fondo, pero cambia el
comportamiento de TODOS los controllers a la vez (cualquier controller que hoy combine un
`@Permissions` de clase con métodos sin permiso propio empezaría a exigirlo también en esos
métodos). Revisado explícitamente: no se encontró ningún controller que hoy dependa de que el
decorador de clase NO se aplique — los únicos dos casos existentes de `@Permissions` de clase son
justamente los dos que este fix corrigió, y en ambos todos los métodos del controller debían
quedar protegidos por el mismo permiso. El cambio de guard queda pendiente de decisión aparte.

Commit: `beb7e16`. Verificado: 133 suites/1426 tests, build/lint/format en verde.

### Arreglo de fondo — `PermissionsGuard` (2026-09-12)

Se implementó la propuesta que quedó pendiente arriba, autorizada explícitamente por José.

**Antes**: `PermissionsGuard.canActivate` hacía `this.reflector.get(PERMISSIONS_KEY,
context.getHandler())` — leía metadata SOLO del método. Si no encontraba nada ahí (nunca miraba la
clase), `return true`: **fallaba abierto**. Esto es lo que dejó expuestos los 5 endpoints de arriba
(`beb7e16`): con un `@Permissions` puesto únicamente en la clase, el guard lo ignoraba por completo
y cualquier usuario logueado pasaba.

**Después**: `this.reflector.getAllAndOverride(PERMISSIONS_KEY, [context.getHandler(),
context.getClass()])` — primero busca en el método y, si no hay nada ahí, cae a la clase; el
método sigue teniendo precedencia sobre la clase (comportamiento estándar de NestJS). Un
`@Permissions` de clase ahora protege de verdad, incluso si algún método nuevo se agrega sin su
propio decorador.

**Impacto verificado, no solo asumido**: se corrió la suite completa (135 suites, 1440 tests antes
de este cambio) después de aplicar el fix. Fallaron 2 suites — `admin-professional-documents.
controller.spec.ts` y `admin-professional-portfolio.controller.spec.ts` — pero con
`TypeError: context.getClass is not a function`, no con un 403 inesperado: sus mocks de
`ExecutionContext` (escritos para el fix de `beb7e16`, con un `Reflector` real) nunca implementaron
`getClass()` porque el guard viejo no lo llamaba. Se corrigió agregando `getClass: () =>
<Controller>` a esos dos mocks — no es el "test que empieza a fallar con 403" que se pidió
detectar y NO ajustar, es un mock incompleto para una firma de método nueva. Con eso corregido, la
suite completa (135 suites, 1446 tests — 6 nuevos en `permissions.guard.spec.ts` sobre precedencia
handler/clase con `Reflector` real) quedó en verde sin ningún cambio de resultado en ningún otro
test — confirma lo que ya se había revisado en `beb7e16`: ningún controller depende hoy de que el
decorador de clase NO se aplique.

**Barrido repetido** (mismo patrón que arriba, para confirmar que no apareció nada nuevo desde
`beb7e16`): de los 18 controllers que usan `@Permissions`, solo `AdminProfessionalDocumentsController`
y `AdminProfessionalPortfolioController` lo declaran a nivel de clase, y en ambos los métodos ya
están decorados individualmente (el fix de `beb7e16` sigue siendo neutro respecto a este cambio).
Los comentarios "OJO: este `@Permissions` de clase es DECORATIVO" en esos dos controllers dejaron
de ser ciertos y se actualizaron para reflejar que la clase ahora sí protege (con precedencia del
método).

Commit: `07c852e`.

## I-04 — Versionado a v1 global + excepción del healthcheck (2026-09-07)

Corte de versionado de la API: implementación del `defaultVersion: '1'` a nivel de `enableVersioning()`
en `src/main.ts`, con remoción de los `@Version('1')` redundantes de los 6 controllers que ya 
versionaban a mano (auth-api, onboarding, roles-api, users-roles-api, uploads, users). Decisión 
técnica: un `defaultVersion` global heredado automáticamente por todo controller nuevo, sin la carga 
cognitiva de decorar controller por controller — un developer que agrega un endpoint nuevo consume 
`/v1` sin que tenga que acordarse nada. Resultado: 170 rutas en el Swagger, 169 bajo `/v1`, 1 
excepción deliberada.

**La excepción**: `src/modules/health/health.controller.ts` (`@Controller('healthcheck')`) lleva 
`@Version(VERSION_NEUTRAL)` a nivel de **método**, no de clase. (El tipado de `@Version` en esta 
versión de Nest es un `MethodDecorator`; aplicarlo en la clase rompe tsc con TS1238/TS1270.) Motivo: 
9 paths de probes de Kubernetes apuntan al path sin versión — `ci/develop/1_deployment.yml`, 
`ci/qa/1_deployment.yml` y `ci/master/1_deployment.yml`, líneas 60/67/75 de cada uno 
(startupProbe + readinessProbe + livenessProbe), todos contra `/tekoapp-backend/api/healthcheck`. 
Además, el health check de Render está configurado fuera del repo (en su dashboard) contra ese mismo 
path. Si el health se movía a `/v1`, las probes daban 404, el pod nunca llegaba a Ready y el deploy 
se caía con rollback inmediato. Se eligió `VERSION_NEUTRAL` en vez de editar los 9 paths a propósito: 
cambiando los manifiestos, un rollback a una imagen anterior también fallaría.

**Dato técnico importante, verificado empíricamente** leyendo `route-path-factory.js` de 
`@nestjs/core` y con la app levantada: bajo `VersioningType.URI`, un endpoint `VERSION_NEUTRAL` 
registra **únicamente** el path sin prefijo de versión, **nunca** ambos. `/tekoapp-backend/api/healthcheck` 
responde; `/tekoapp-backend/api/v1/healthcheck` da 404 a propósito. Es contraintuitivo y debe 
documentarse explícitamente — una sesión futura puede asumir que un `VERSION_NEUTRAL` registra ambos 
paths y tropezar cuando Render o una probe da 404.

**Bug concreto que este corte cierra**: `AccountDeletionController` (`@Controller('auth/me')`) había 
nacido sin `@Version` mientras `AuthApiController` tenía `@Version('1')` por método, así que convivían 
`GET /v1/auth/me` y `POST /auth/me/deletion-request`. Mobile ya tenía todo auth bajo `/v1`, así que 
la llamada de borrado de cuenta le habría dado 404 — mismo género de bug que M-07 de Mobile, que 
costó una sesión de prueba con teléfono real.

**Deuda preexistente detectada de paso, NO corregida** (anotada como tal, no como parte de I-04): 
`test/app.e2e-spec.ts` ya estaba roto antes de este corte porque el módulo 
`@/core/database/base/mongo/database.config` no resuelve con `test/jest-e2e.json`. No es parte de la 
Definition of Done del §1.2.

Commits: `bedcca1` (versionado), `7e22526` (healthcheck version-neutral), `6f48d01` (doc). 
Verificado: app levantada con Postgres/Mongo/Redis reales; 127 suites / 1369 tests en verde; 
format/lint/build limpios.

## T-03 (deuda diferida) — rename de `locations-db`/`tracking-db` (2026-09-14)

Ver `openspec/changes/platform-hardening-2026-09/WORKPLAN.md` §6, T-03. T-03 ya había corregido el
typo de archivo (`tacking-db.service.ts` → `tracking-db.service.ts`) pero difirió el rename de
ambos módulos por no ser urgente. Se ejecuta ahora como tarea 1 de una tanda nueva pedida por José.

Cambio: `src/modules/locations-db` → `src/modules/professional-position-db` (última posición
conocida del profesional, Postgres — alimenta `findNearby`/Haversine, D-01) y
`src/modules/tracking-db` → `src/modules/geo-tracking-db` (histórico de posiciones durante un
servicio en curso, MongoDB con índice `2dsphere`). Clases renombradas en consecuencia
(`LocationsDbService`→`ProfessionalPositionDbService`, `LocationsDbModule`→
`ProfessionalPositionDbModule`, `TrackingDbService`→`GeoTrackingDbService`,
`TrackingDbModule`→`GeoTrackingDbModule`), imports actualizados en `src/api/locations` y
`src/api/tracking`, y cada módulo lleva ahora un docstring explicando su división de
responsabilidad respecto del otro (la falta de esa explicación era el hallazgo original de T-03).
Actualizados también el árbol de módulos de `README.md` y el ejemplo de `.claude/CLAUDE.md` que
mencionaban el nombre viejo.

No se tocaron los comentarios dentro de `prisma/migrations/**` (registro histórico inmutable) que
mencionan `LocationsDbService` por nombre — sí se actualizó el comentario vivo en
`prisma/schema.prisma` que referencia `professionals_nearby_idx`.

Sin cambios de comportamiento ni de contrato — es un rename puro, sin migración de base de datos.

Commit: `e3b466a`. Verificado: 135 suites / 1468 tests en verde; format/lint/build limpios.

## Tarea 2 — TOCTOU en `verifyProfessional`/`suspendProfessional` (2026-09-14)

Hallazgo colateral anotado (no corregido) por `I-05-notification-triggers.md`:
`ProfessionalsService.verifyProfessional`/`suspendProfessional` usaban
`professionalsDb.update(id, {...})` incondicional, a diferencia del patrón
`updateMany`+condicional+`count===0`→`ConflictException` que ya usan `services`, `payments`,
`professional-documents`, `professional-portfolio` y `payment-disputes`. Dos admins resolviendo
la misma verificación/suspensión al mismo tiempo se pisaban sin error.

Cambio: nuevo `ProfessionalsDbService.updateConditional(id, expectedStatuses, data)` — mismo
molde que `updateServiceConditional`/`updatePaymentConditional` (`updateMany({ where: { id,
status: { in: expectedStatuses } } })`, retorna `count`). `expectedStatuses` se arma con el
`status` leído en el mismo `findById` de validación (no una lista fija de estados de negocio
nueva) — preserva el comportamiento actual (cualquier estado de origen es válido, staff de baja
frecuencia) mientras cierra la carrera: si el estado cambió entre la lectura y la escritura, el
`updateMany` no afecta filas y se lanza `ConflictException`. Claves i18n nuevas
`professionals.STATUS_CHANGED_BEFORE_VERIFY`/`STATUS_CHANGED_BEFORE_SUSPEND` (es/en).

Tests de la carrera agregados en `professionals.service.spec.ts` (ambos métodos) y cobertura del
método nuevo en `professionals-db.service.spec.ts`.

Commit: `80fa823`. Verificado: 135 suites / 1472 tests en verde; format/lint/build limpios.

## Tarea 3 — Canal de email real en `NotificationsProcessor` (2026-09-14)

Hallazgo colateral anotado (no corregido) por `I-05-notification-triggers.md`:
`NotificationsProcessor.sendNotificationByChannel` trataba los canales `email`/`sms` como
stubs (`logger.log` nomás), pese a que `modules/email` (`EmailService`) ya existe y se usa en
`auth-api`, `onboarding`, `users-db`.

Cambio — canal `email`: nuevo método privado `sendEmail(userId, title, message)` en el
processor. Resuelve el email del destinatario vía `UsersDBService.findById` (inyectado desde
`UsersDBModule`, ya importa `EmailModule` así que no hay ciclo nuevo) y reusa
`EmailService.send()` con un template genérico nuevo,
`EmailHelper.createGenericNotificationTemplate(firstName, title, message)` — no reusa los
templates existentes porque esos están armados para un flujo puntual (verificación, contraseña),
mientras que este canal despacha cualquier tipo de notificación de dominio con `title`/`message`
libres.

**Decisión de resiliencia**: igual que `sendWebPush`/`sendFcm` (que jamás relanzan — devuelven un
`outcome` y loguean), el fallo del canal `email` se atrapa y solo se loguea, nunca se relanza. Si
relanzara, un solo canal caído (SMTP abajo, usuario sin email) tumbaría `Promise.all` en
`handleSendNotification` y marcaría **toda** la notificación como `FAILED` aunque otros canales
(ej. `in_app` vía SSE) sí se hayan entregado. `EmailService.send()` ya lanza
`InternalServerErrorException` en su propio catch — acá se la vuelve a atrapar a propósito.

**Canal `sms`: sigue como stub, a propósito.** A diferencia de `email`, no hay ningún
`SmsService`/wrapper de Twilio en el repo — el paquete `twilio` ni siquiera está en
`package.json`. Lo único que existe son las env vars `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN`/
`TWILIO_PHONE_NUMBER` validadas por Joi en `config-schema.ts`, que es validación de
configuración, no un cliente real. Cablearlo de verdad implica agregar una dependencia nueva y
un módulo completo — se deja documentado en el propio código (comentario en el `case 'sms'`) y
acá, fuera del alcance de "cablear el canal que ya existe".

Tests nuevos en `notifications.processor.spec.ts` (`describe('canal email')`): envío exitoso,
usuario sin email (se omite sin lanzar), y fallo de SMTP (no relanza, no tumba otros canales ni
marca `FAILED` la notificación).

Commit: `1ab7f42`. Verificado: 135 suites / 1475 tests en verde; format/lint/build limpios.
