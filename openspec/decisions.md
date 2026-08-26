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

## Qué NO se decidió todavía (pendiente explícito)

- Si `Category` necesita un flag `requiresProfessionalSignature` para contratos donde el
  profesional no firma (ver `openspec/specs/service-contracts.md`, sección de parametrización) —
  no implementado en la primera versión por no haber sido pedido explícitamente.
- Si el staff de `TekoApp-Frontend-Web` necesita un endpoint dedicado de listado de bitácora de
  trabajo para disputas, o alcanza con extender la vista de detalle de servicio ya existente (ver
  `openspec/specs/work-progress-log.md`, límite explícito) — pendiente de confirmación de José.
