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

**Estado**: decidido para el diseño de `0005`/`0006`, no implementado todavía.

## `Contracts.contentSnapshot` es inmutable (JSON congelado), no un join en vivo

**Motivo**: si el contrato (`openspec/specs/service-contracts.md`) leyera `BudgetOptions`/
`BudgetLineItems` en vivo, un cambio posterior al catálogo de materiales o al presupuesto
alteraría el contenido de un contrato ya firmado — inaceptable para algo con valor probatorio.

**Estado**: decidido, ver el modelo de datos en `openspec/specs/service-contracts.md`.

## Qué NO se decidió todavía (pendiente explícito)

- Si `Category` necesita un flag `requiresProfessionalSignature` para contratos donde el
  profesional no firma (ver `openspec/specs/service-contracts.md`, sección de parametrización) —
  no implementado en la primera versión por no haber sido pedido explícitamente.
- Si el staff de `TekoApp-Frontend-Web` necesita un endpoint dedicado de listado de bitácora de
  trabajo para disputas, o alcanza con extender la vista de detalle de servicio ya existente (ver
  `openspec/specs/work-progress-log.md`, límite explícito) — pendiente de confirmación de José.
