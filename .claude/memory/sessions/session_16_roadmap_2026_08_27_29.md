# Sesión 16 — 2026-08-27/29 — Cierre completo del roadmap (bitácora, documentos, presupuestos, contratos, id/referenceId, ratings, propinas, IVA)

## Qué se hizo

Cierre de TODO el roadmap que quedó pendiente al final de la sesión 15 (puntos 5-9 del plan
`staged-booping-pillow.md`), más un segundo roadmap completo de 5 features grandes pedidas después.
Detalle completo de cada fase en `openspec/decisions.md` — acá solo el resumen ejecutivo.

- **Fase 0002 — Bitácora de trabajo** (`ServiceProgressEntries`): timeline de avance de un
  servicio, fotos opcionales (guard de consentimiento condicional, solo si la entrada trae fotos),
  config parametrizable (`PROGRESS_LOG_MAX_IMAGES_PER_ENTRY`/`EDIT_WINDOW_MINUTES`/
  `REQUIRE_NOTE_OR_IMAGE`), `NotificationType.DOCUMENT_EXPIRED` agregado de paso.
- **Fase 0001 — Documentos y antecedentes del profesional**: `ProfessionalDocumentTypes` (rename
  de `DocumentTypes` por colisión), `ProfessionalDocuments`, cola de revisión admin, campo
  `requiredDocumentsVerified` separado de `verificationStatus` (que ya tenía otro escritor).
- **Extensión Fase 0006 — Auditoría de consentimiento**: endpoint completo de auditoría de
  `ContentConsentGrants` que faltaba, filtros nuevos en la auditoría de `UserConsents`.
- **Fase 0003 — Presupuestos multi-opción**: `MaterialCatalog`/`BudgetOptions`/`BudgetLineItems`,
  rama nueva en `completeService()` para `finalAmount` cuando el servicio no tiene tarifa por hora,
  `Category.maxBudgetOptionsPerRequest` expuesto en los DTOs (existía en Prisma, nunca se exponía).
- **Fase 0004 — Contratos desde presupuesto aceptado**: `Contracts` + máquina de estados de 5
  pasos, firma secuencial, PDF vía `pdfmake`/`report` module, copy legal `TODO(legal)` explícito.
- **Fase 0008 — id/referenceId estandarizado**: `exposeReferenceAsId()` eliminado, 5 dominios
  (Services/ServiceRequests/PaymentMethod/Payments/Rating) exponen `id` (PK, Int) y `referenceId`
  (UUID) por separado — breaking change real para los clientes, sin shim de compatibilidad.
- **Fase 0009 — Ratings: anonimato real + KPIs**: `isAnonymous` nunca se aplicaba en ningún
  endpoint — corregido con `RatingViewerContext`/`isAuthor()`. Hallazgo más severo: `GET
  /professionals/:id/reviews` filtraba la fila completa de `Users` (email, teléfono) a cualquier
  usuario logueado, ignorando `isAnonymous` — corregido con un mapper dedicado.
- **Fase 0010 — Propinas**: `Tips` separada de `Payment` (nunca fusionada al monto ni a la
  comisión), `TipConfig` parametrizable por país.
- **Fase 0011 — Marco legal/tributario + extensión de autorización de pagos**: `TaxConfig`
  parametrizable (IVA, deshabilitado por default), `LegalDocumentType.USER_CONTENT_LIABILITY_DISCLAIMER`
  nuevo. Extensión a pedido de José: `GET /payments`/`summary`/`trends` ahora requieren
  `payments.audit:read`/`admin:all` (antes sin ningún guard — cualquier usuario podía listar pagos
  ajenos), `GET /payments/:id` ahora valida dueño (`getPaymentByIdForViewer`), `GET /payments/me`
  nuevo. Y el fix de nombres: `Payments.tax` volvió a significar IVA real (antes guardaba, mal
  nombrado, la comisión de la plataforma) — `Payments.platformFee` (dormido desde siempre) ahora sí
  se escribe con la comisión real.

## Errores encontrados y su solución

- **Migración con drift real** (`add_tips` modificada después de aplicada, por el paso manual de
  `fn_attach_audit_triggers()`) — en vez de `prisma migrate reset` (destructivo), se corrigió el
  `checksum` de esa fila en `_prisma_migrations` a mano (`UPDATE` con el sha256 real del archivo).
  Ver memoria de usuario `feedback_prisma_migration_drift_fix_no_reset` para el procedimiento
  completo — aplica a cualquier fase futura que edite un `.sql` ya aplicado.
- **Bug de PII real**: `professionals.service.ts#getProfessionalReviews` hacía `as unknown as DTO`
  sobre una fila cruda de Prisma, filtrando `Users` completo (incluye password hash implícito en
  el objeto, aunque no se serializaba, y sí email/teléfono) a cualquier usuario autenticado.
- **`Payments.tax`/`platformFee` invertidos** — confusión de nombres arrastrada desde antes de
  esta sesión, corregida (ver arriba). `analytics-db.service.ts#platformRevenue` daba 0 siempre
  por leer un campo (`platformFee`) que nunca se escribía — ahora sí refleja datos reales.
- **Clasificador de permisos de auto mode bloqueó `prisma migrate reset`** incluso con el env var
  de consentimiento de Prisma (`PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION`) seteado — se
  resolvió el problema real (drift de checksum) sin necesitar esa acción.

## Estado al cierre

- Backend: 109 suites / 1258 tests, `pnpm lint`/`format`/`build` en verde.
- Los 9 puntos del roadmap 1 (sesión 15) y los 5 puntos del roadmap 2 (backlog post-Fase 0004)
  están **cerrados por completo**, sin código pendiente.
- Migraciones aplicadas contra Supabase (autorización explícita de José para tocar la DB
  compartida esta sesión), boot real confirmado.
- `PENDING.md` nuevo en la raíz del repo — consolida TODOS los pendientes reales (decisiones de
  negocio/legal/fiscal, deuda técnica conocida, permisos sin asignar a rol, checkpoints de negocio
  con datos reales, roadmap futuro sin spec) en un solo lugar, para no tener que recorrer
  `decisions.md` fase por fase. Mantenerlo actualizado.
- PR #36 (`feature/consent-ai-disclosure-and-account-recovery-spec` → `develop`) actualizado con
  todos los commits de este roadmap — la nota "no mergear todavía hasta cerrar el roadmap" ya no
  aplica, el roadmap está cerrado.

## Pendiente para la próxima sesión

Ver `PENDING.md` en la raíz del repo para el detalle completo y actualizado. Puntos más
relevantes: rol `compliance` sin crear (tarea de datos), tasas reales de `TaxConfig` pendientes de
asesoría fiscal, copy legal de contratos pendiente de asesoría legal, `USER_CONTENT_LIABILITY_DISCLAIMER`
sin gatear en ninguna ruta (decisión de producto pendiente), checkpoints de negocio con los 3 repos
corriendo juntos y datos reales.
