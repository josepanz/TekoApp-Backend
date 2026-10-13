# CP-ONB — M3 Onboarding profesional (Backend)

Especificación según `C:\workspace\QA-DOC-STANDARD.md` §2. Casos CP-BE-ONB-001..034 de la ola W2 (Tier 3 del plan e2e). Los marcados `[DEF ...]` quedaron corregidos y su test es un `it` normal; DEF-BE-023 sigue abierto y su test es `it.failing` (pasa mientras el defecto exista; hay que quitar `.failing` al corregirlo).

## Decisiones y casos no automatizables

- **Subida de documentos:** el flujo real NO usa un URL presignado de subida. `POST /professionals/me/documents` recibe un multipart (`file` + `professionalDocumentTypeReferenceId`), valida tipo y tamaño (5 MB) y sube a MinIO desde el backend. El presigned URL (`GET /uploads/presigned-url?key=`) es solo de **descarga**; el test lo usa para comprobar contra el MinIO real que los bytes llegaron (CP-BE-ONB-011).
- **Arnés Jest:** el SDK de S3 usa `import()` dinámico, que dentro de la VM de Jest falla con `ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING_FLAG` (500 al subir). `pnpm test:e2e:real` agrega `--experimental-vm-modules` (`scripts/e2e/cli.ts`). Es una limitación del arnés; la app corre en Node normal.
- **Job de expiración:** `ProfessionalDocumentsExpirationJob.run()` es público y se invoca directo con `app.get(...)`; el test vence un documento en la DB y verifica EXPIRED y el recálculo (CP-BE-ONB-020). El disparo por cron (`EVERY_DAY_AT_3AM`) no se prueba: caso manual, ejecutar con `NODE_ENV` normal y comprobar el log "Venciendo N documento(s)".
- **Consentimiento:** los consentimientos solo consideran versiones `countryId: null` (los usuarios no tienen país). Antes del fix de DEF-BE-014 el seed las creaba con país y nadie podía aceptarlas.
- **Brecha conocida:** el listado público `GET /professionals` y los lookups por id/referenceId no filtran por estado ni distinguen admin (DEF-BE-023, abierto, requiere decisión de alcance con Web admin que reutiliza el endpoint). `GET /uploads/presigned-url?key=` firma cualquier `key` para cualquier usuario autenticado: observación pendiente para M9 (cumplimiento).
- **Datos que cambian de forma observable pero no se prueban acá:** notificaciones de revisión/verify/suspend (M11).


### CP-BE-ONB-001 — Un usuario registrado se postula y queda PENDING, no disponible

| Campo | Contenido |
|---|---|
| ID | CP-BE-ONB-001 |
| Título | Un usuario registrado se postula y queda PENDING, no disponible |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M3 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Registrar usuario (POST /onboarding) y loguear.<br>`POST /professionals` con categoría plomería.<br>`GET /professionals/me`. |
| Datos de prueba | categoryId plomería, hourlyRate 40000, skills, 3 años |
| Resultado esperado | 201; `status` PENDING, `isAvailable` false, `verificationStatus` UNVERIFIED, `requiredDocumentsVerified` false; `/me` devuelve el mismo referenceId. |
| Automatizado en | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` — `un usuario registrado se postula y queda PENDING, no disponible` |

### CP-BE-ONB-002 — La doble postulación (USER_ALREADY_PROFESSIONAL) debe responder 409 [DEF-BE-015: Corregido (c6467a1)]

| Campo | Contenido |
|---|---|
| ID | CP-BE-ONB-002 |
| Título | La doble postulación (USER_ALREADY_PROFESSIONAL) debe responder 409 [DEF-BE-015: Corregido (c6467a1)] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M3 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3; DEF-BE-015 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Postular dos veces con el mismo usuario. |
| Datos de prueba | mismo body |
| Resultado esperado | 409 (antes del fix: 400) con envelope uniforme y mensaje "ya es un profesional". |
| Automatizado en | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` — `DEF-BE-015: la doble postulación (USER_ALREADY_PROFESSIONAL) debe responder 409` |

### CP-BE-ONB-003 — Una categoría inexistente se rechaza con 400 y mensaje claro

| Campo | Contenido |
|---|---|
| ID | CP-BE-ONB-003 |
| Título | Una categoría inexistente se rechaza con 400 y mensaje claro |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M3 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Postular con `categoryId` inexistente.<br>`GET /professionals/me`. |
| Datos de prueba | categoryId 999999 |
| Resultado esperado | 400 con mensaje de categoría; el usuario sigue sin perfil (`/me` 404). |
| Automatizado en | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` — `una categoría inexistente se rechaza con 400 y mensaje claro` |

### CP-BE-ONB-004 — Body inválido (sin categoryId, tarifa negativa, descripción vacía) -> 400 con detalle por campo

| Campo | Contenido |
|---|---|
| ID | CP-BE-ONB-004 |
| Título | Body inválido (sin categoryId, tarifa negativa, descripción vacía) -> 400 con detalle por campo |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P2 |
| Trazabilidad | M3 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Enviar body sin categoryId, descripción vacía y tarifa negativa. |
| Datos de prueba | `{description:"", hourlyRate:-5}` |
| Resultado esperado | 400 con errores por campo `categoryId`, `description`, `hourlyRate`. |
| Automatizado en | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` — `body inválido (sin categoryId, tarifa negativa, descripción vacía) -> 400 con detalle por campo` |

### CP-BE-ONB-005 — Sin JWT -> 401

| Campo | Contenido |
|---|---|
| ID | CP-BE-ONB-005 |
| Título | Sin JWT -> 401 |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P2 |
| Trazabilidad | M3 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Llamar sin Authorization. |
| Datos de prueba | — |
| Resultado esperado | 401. |
| Automatizado en | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` — `sin JWT -> 401` |

### CP-BE-ONB-006 — Un usuario sin perfil profesional recibe 404 en GET /professionals/me

| Campo | Contenido |
|---|---|
| ID | CP-BE-ONB-006 |
| Título | Un usuario sin perfil profesional recibe 404 en GET /professionals/me |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P2 |
| Trazabilidad | M3 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Con cliente_a (sin perfil) llamar `/professionals/me`. |
| Datos de prueba | — |
| Resultado esperado | 404 con envelope `success:false`. |
| Automatizado en | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` — `un usuario sin perfil profesional recibe 404 en GET /professionals/me` |

### CP-BE-ONB-007 — Las versiones legales activas aparecen como pendientes para un usuario nuevo [DEF-BE-014: Corregido (1659312)]

| Campo | Contenido |
|---|---|
| ID | CP-BE-ONB-007 |
| Título | Las versiones legales activas aparecen como pendientes para un usuario nuevo [DEF-BE-014: Corregido (1659312)] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M3 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3; DEF-BE-014 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Registrar usuario nuevo y pedir los consentimientos pendientes. |
| Datos de prueba | seed con versiones `countryId null` |
| Resultado esperado | Incluye `DATA_PROCESSING_CONSENT` e `IMAGE_USAGE_CONSENT` (antes del fix: lista vacía). |
| Automatizado en | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` — `DEF-BE-014: las versiones legales activas aparecen como pendientes para un usuario nuevo` |

### CP-BE-ONB-008 — Sin DATA_PROCESSING_CONSENT subir un documento da 403 CONSENT_REQUIRED; tras aceptarlo funciona

| Campo | Contenido |
|---|---|
| ID | CP-BE-ONB-008 |
| Título | Sin DATA_PROCESSING_CONSENT subir un documento da 403 CONSENT_REQUIRED; tras aceptarlo funciona |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M3 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Postular.<br>Subir un documento sin consentimiento.<br>Aceptar el consentimiento vía legal-consents.<br>Reintentar. |
| Datos de prueba | tipo QUALIFICATION_CERTIFICATE, PDF mínimo |
| Resultado esperado | 403 con `errorCode: CONSENT_REQUIRED`; tras aceptar, 201 con `status` PENDING. |
| Automatizado en | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` — `sin DATA_PROCESSING_CONSENT subir un documento da 403 CONSENT_REQUIRED; tras aceptarlo funciona` |

### CP-BE-ONB-009 — Aceptar dos veces la misma versión -> 409 y deja de figurar como pendiente

| Campo | Contenido |
|---|---|
| ID | CP-BE-ONB-009 |
| Título | Aceptar dos veces la misma versión -> 409 y deja de figurar como pendiente |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P2 |
| Trazabilidad | M3 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Aceptar el consentimiento.<br>Pedir pendientes.<br>Aceptar de nuevo la misma versión. |
| Datos de prueba | — |
| Resultado esperado | Deja de figurar como pendiente; el segundo accept da 409. |
| Automatizado en | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` — `aceptar dos veces la misma versión -> 409 y deja de figurar como pendiente` |

### CP-BE-ONB-010 — El listado propio muestra cada tipo aplicable sin documento al inicio

| Campo | Contenido |
|---|---|
| ID | CP-BE-ONB-010 |
| Título | El listado propio muestra cada tipo aplicable sin documento al inicio |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M3 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Listar los documentos propios de un profesional recién postulado. |
| Datos de prueba | — |
| Resultado esperado | Una fila por tipo aplicable, todas con `document: null`; BG_CHECK_CRIMINAL_PY con `isRequired` true. |
| Automatizado en | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` — `el listado propio muestra cada tipo aplicable sin documento al inicio` |

### CP-BE-ONB-011 — La subida llega a MinIO: el URL presignado devuelve los mismos bytes

| Campo | Contenido |
|---|---|
| ID | CP-BE-ONB-011 |
| Título | La subida llega a MinIO: el URL presignado devuelve los mismos bytes |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M3 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Subir un PDF multipart.<br>Pedir `GET /uploads/presigned-url?key=<fileKey>`.<br>Hacer `fetch` del URL desde el test. |
| Datos de prueba | PDF de ~200 bytes |
| Resultado esperado | 201 con `fileKey` .pdf y `expiresAt` (validityDays 180); el GET al MinIO real devuelve 200 y los mismos bytes. |
| Automatizado en | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` — `la subida llega a MinIO: el URL presignado devuelve los mismos bytes` |

### CP-BE-ONB-012 — Rechaza archivo inválido: tipo no permitido, > 5 MB, sin archivo, tipo de documento desconocido o UUID inválido

| Campo | Contenido |
|---|---|
| ID | CP-BE-ONB-012 |
| Título | Rechaza archivo inválido: tipo no permitido, > 5 MB, sin archivo, tipo de documento desconocido o UUID inválido |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M3 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Subir .exe, archivo > 5 MB, sin archivo, tipo de documento desconocido y UUID inválido. |
| Datos de prueba | x.exe, 5 MB + 1 byte |
| Resultado esperado | 400, 400, 400, 404 y 400, todos con envelope uniforme. |
| Automatizado en | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` — `rechaza archivo inválido: tipo no permitido, > 5 MB, sin archivo, tipo de documento desconocido o UUID inválido` |

### CP-BE-ONB-013 — Un usuario sin perfil profesional (con consentimiento) no puede subir documentos: 4xx, nunca 500

| Campo | Contenido |
|---|---|
| ID | CP-BE-ONB-013 |
| Título | Un usuario sin perfil profesional (con consentimiento) no puede subir documentos: 4xx, nunca 500 |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M3 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Usuario sin perfil, con consentimiento, intenta subir un documento. |
| Datos de prueba | — |
| Resultado esperado | 403 o 404, nunca 500. |
| Automatizado en | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` — `un usuario sin perfil profesional (con consentimiento) no puede subir documentos: 4xx, nunca 500` |

### CP-BE-ONB-014 — La cola de admin lista el documento PENDING con filtros y un usuario común recibe 403

| Campo | Contenido |
|---|---|
| ID | CP-BE-ONB-014 |
| Título | La cola de admin lista el documento PENDING con filtros y un usuario común recibe 403 |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M3 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Admin lista `GET /admin/professional-documents?status=PENDING&pageSize=100`.<br>cliente_a intenta lo mismo y `/admin/professionals/:ref/documents`. |
| Datos de prueba | — |
| Resultado esperado | Admin 200 con `pagination.pageSize` 100 y filas; cliente_a 403 en ambos; admin ve los documentos del profesional. |
| Automatizado en | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` — `la cola de admin lista el documento PENDING con filtros y un usuario común recibe 403` |

### CP-BE-ONB-015 — Rechazar sin motivo -> 400 con el campo rejectionReason y el documento sigue PENDING

| Campo | Contenido |
|---|---|
| ID | CP-BE-ONB-015 |
| Título | Rechazar sin motivo -> 400 con el campo rejectionReason y el documento sigue PENDING |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M3 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Subir un documento.<br>`PATCH /admin/professional-documents/:ref/review` con `REJECTED` sin motivo.<br>Listar documentos propios. |
| Datos de prueba | `{status:"REJECTED"}` |
| Resultado esperado | 400 con error en `rejectionReason`; el documento sigue PENDING. |
| Automatizado en | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` — `rechazar sin motivo -> 400 con el campo rejectionReason y el documento sigue PENDING` |

### CP-BE-ONB-016 — Un usuario común no puede revisar (403); estado inválido 400, inexistente 404 y doble revisión 409

| Campo | Contenido |
|---|---|
| ID | CP-BE-ONB-016 |
| Título | Un usuario común no puede revisar (403); estado inválido 400, inexistente 404 y doble revisión 409 |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M3 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Revisar con un usuario común.<br>Revisar con status PENDING.<br>Revisar un UUID inexistente.<br>Aprobar y volver a revisar. |
| Datos de prueba | — |
| Resultado esperado | 403, 400, 404 y 409 (ya revisado). |
| Automatizado en | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` — `un usuario común no puede revisar (403); estado inválido 400, inexistente 404 y doble revisión 409` |

### CP-BE-ONB-017 — El rechazo con motivo se refleja en el listado propio y no verifica al profesional

| Campo | Contenido |
|---|---|
| ID | CP-BE-ONB-017 |
| Título | El rechazo con motivo se refleja en el listado propio y no verifica al profesional |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M3 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Admin rechaza con motivo.<br>El profesional lista sus documentos y su perfil. |
| Datos de prueba | motivo "Documento vencido" |
| Resultado esperado | 200 REJECTED con `rejectionReason`; el listado propio lo refleja y `requiredDocumentsVerified` sigue false. |
| Automatizado en | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` — `el rechazo con motivo se refleja en el listado propio y no verifica al profesional` |

### CP-BE-ONB-018 — RequiredDocumentsVerified se recalcula tras cada revisión: false con 1 de N aprobados, true con todos, estable al rechazar uno no requerido

| Campo | Contenido |
|---|---|
| ID | CP-BE-ONB-018 |
| Título | RequiredDocumentsVerified se recalcula tras cada revisión: false con 1 de N aprobados, true con todos, estable al rechazar uno no requerido |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M3 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Subir un documento por cada tipo requerido.<br>Aprobar uno a uno consultando `/professionals/me`.<br>Rechazar un documento no requerido. |
| Datos de prueba | tipos requeridos del catálogo |
| Resultado esperado | false con 1 de N aprobados, true con todos; el rechazo de uno no requerido no lo revierte. |
| Automatizado en | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` — `requiredDocumentsVerified se recalcula tras cada revisión: false con 1 de N aprobados, true con todos, estable al rechazar uno no requerido` |

### CP-BE-ONB-019 — El endpoint público solo muestra documentos APROBADOS de tipos visibles al cliente

| Campo | Contenido |
|---|---|
| ID | CP-BE-ONB-019 |
| Título | El endpoint público solo muestra documentos APROBADOS de tipos visibles al cliente |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P2 |
| Trazabilidad | M3 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Subir y aprobar un tipo visible al cliente y uno no visible.<br>cliente_a consulta `/professionals/:ref/documents/public` antes y después. |
| Datos de prueba | QUALIFICATION_CERTIFICATE vs BG_CHECK_CRIMINAL_PY |
| Resultado esperado | Vacío antes; después solo el documento visible al cliente. |
| Automatizado en | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` — `el endpoint público solo muestra documentos APROBADOS de tipos visibles al cliente` |

### CP-BE-ONB-020 — Expiración: el job vence el documento aprobado y recalcula requiredDocumentsVerified (run() invocado directo)

| Campo | Contenido |
|---|---|
| ID | CP-BE-ONB-020 |
| Título | Expiración: el job vence el documento aprobado y recalcula requiredDocumentsVerified (run() invocado directo) |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M3 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Aprobar los documentos requeridos.<br>Vencer uno en la DB (`expiresAt` en el pasado).<br>Invocar `ProfessionalDocumentsExpirationJob.run()` directamente (`app.get`). |
| Datos de prueba | expiresAt = ayer |
| Resultado esperado | El documento pasa a EXPIRED, los otros siguen APPROVED y `requiredDocumentsVerified` vuelve a false. No se espera el cron de las 3 AM. |
| Automatizado en | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` — `expiración: el job vence el documento aprobado y recalcula requiredDocumentsVerified (run() invocado directo)` |

### CP-BE-ONB-021 — Sin permiso (cliente, el propio profesional postulado) verify y suspend -> 403 y el estado no cambia

| Campo | Contenido |
|---|---|
| ID | CP-BE-ONB-021 |
| Título | Sin permiso (cliente, el propio profesional postulado) verify y suspend -> 403 y el estado no cambia |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M3 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | cliente_a y el propio postulante llaman `verify` y `suspend`.<br>`/professionals/me`. |
| Datos de prueba | `{isVerified:true}`, `{reason:"Incumplimiento"}` |
| Resultado esperado | 403 en los cuatro intentos y el estado queda PENDING/UNVERIFIED. |
| Automatizado en | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` — `sin permiso (cliente, el propio profesional postulado) verify y suspend -> 403 y el estado no cambia` |

### CP-BE-ONB-022 — Admin verifica: APPROVED + VERIFIED; admin rechaza: REJECTED; id inexistente 404; sin JWT 401

| Campo | Contenido |
|---|---|
| ID | CP-BE-ONB-022 |
| Título | Admin verifica: APPROVED + VERIFIED; admin rechaza: REJECTED; id inexistente 404; sin JWT 401 |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M3 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Admin verifica (true) a un postulante y rechaza (false) a otro.<br>verify a id inexistente; verify sin JWT. |
| Datos de prueba | notes opcionales |
| Resultado esperado | 201 con APPROVED+VERIFIED / REJECTED+REJECTED; 404; 401. |
| Automatizado en | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` — `admin verifica: APPROVED + VERIFIED; admin rechaza: REJECTED; id inexistente 404; sin JWT 401` |

### CP-BE-ONB-023 — Suspender exige motivo (400) y deja SUSPENDED/isActive=false

| Campo | Contenido |
|---|---|
| ID | CP-BE-ONB-023 |
| Título | Suspender exige motivo (400) y deja SUSPENDED/isActive=false |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M3 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Verificar y suspender con y sin motivo. |
| Datos de prueba | reason "Conducta inapropiada" |
| Resultado esperado | Sin motivo 400; con motivo SUSPENDED, `isActive` false y `changedReason` guardado. |
| Automatizado en | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` — `suspender exige motivo (400) y deja SUSPENDED/isActive=false` |

### CP-BE-ONB-024 — GET /locations/nearby no debe dar 500 y un profesional suspendido desaparece de /locations/nearby y de la lista de disponibles [DEF-BE-018: Corregido (8aa44de)]

| Campo | Contenido |
|---|---|
| ID | CP-BE-ONB-024 |
| Título | GET /locations/nearby no debe dar 500 y un profesional suspendido desaparece de /locations/nearby y de la lista de disponibles [DEF-BE-018: Corregido (8aa44de)] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M3 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3; DEF-BE-018 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Verificar al profesional, ponerlo disponible, con posición y online.<br>Comprobar que aparece en `/locations/nearby` y en `GET /professionals?isAvailable=true`.<br>Suspenderlo y repetir. |
| Datos de prueba | lat/lng aleatorios cerca de Asunción |
| Resultado esperado | Aparece antes; no aparece en ninguno después. `/locations/nearby` no debe dar 500. |
| Automatizado en | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` — `DEF-BE-018: GET /locations/nearby no debe dar 500 y un profesional suspendido desaparece de /locations/nearby y de la lista de disponibles` |

### CP-BE-ONB-025 — Subir al portafolio exige IMAGE_USAGE_CONSENT (403 CONSENT_REQUIRED) y con él queda PENDING y visible

| Campo | Contenido |
|---|---|
| ID | CP-BE-ONB-025 |
| Título | Subir al portafolio exige IMAGE_USAGE_CONSENT (403 CONSENT_REQUIRED) y con él queda PENDING y visible |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M3 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Subir una foto sin consentimiento, con solo DATA_PROCESSING y con IMAGE_USAGE. |
| Datos de prueba | PNG 1x1 |
| Resultado esperado | 403 CONSENT_REQUIRED, 403, y 201 (PENDING, `isVisible` true) con IMAGE_USAGE_CONSENT. |
| Automatizado en | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` — `subir al portafolio exige IMAGE_USAGE_CONSENT (403 CONSENT_REQUIRED) y con él queda PENDING y visible` |

### CP-BE-ONB-026 — Rechaza archivos que no son imagen (PDF) con 400

| Campo | Contenido |
|---|---|
| ID | CP-BE-ONB-026 |
| Título | Rechaza archivos que no son imagen (PDF) con 400 |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P2 |
| Trazabilidad | M3 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Subir un PDF al portafolio. |
| Datos de prueba | PDF |
| Resultado esperado | 400. |
| Automatizado en | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` — `rechaza archivos que no son imagen (PDF) con 400` |

### CP-BE-ONB-027 — PENDING no aparece en el endpoint público; aprobado sí; ocultar (isVisible:false) lo saca; mostrar lo devuelve

| Campo | Contenido |
|---|---|
| ID | CP-BE-ONB-027 |
| Título | PENDING no aparece en el endpoint público; aprobado sí; ocultar (isVisible:false) lo saca; mostrar lo devuelve |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M3 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Subir (PENDING), aprobar, ocultar (`isVisible:false`) y volver a mostrar; consultar `/professionals/:ref/portfolio/public` en cada paso. |
| Datos de prueba | — |
| Resultado esperado | PENDING ausente; aprobado presente; oculto ausente (pero presente en el listado propio); mostrado de nuevo presente. |
| Automatizado en | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` — `PENDING no aparece en el endpoint público; aprobado sí; ocultar (isVisible:false) lo saca; mostrar lo devuelve` |

### CP-BE-ONB-028 — Reordenar por sortOrder cambia el orden del listado propio y del público

| Campo | Contenido |
|---|---|
| ID | CP-BE-ONB-028 |
| Título | Reordenar por sortOrder cambia el orden del listado propio y del público |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P2 |
| Trazabilidad | M3 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Subir y aprobar 3 fotos; PATCH `sortOrder` 900/901/899; listar propio y público; sortOrder "x". |
| Datos de prueba | — |
| Resultado esperado | Orden c, a, b en ambos listados; sortOrder inválido 400. |
| Automatizado en | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` — `reordenar por sortOrder cambia el orden del listado propio y del público` |

### CP-BE-ONB-029 — Borrar quita el item del listado propio y del público; ajeno -> 403; ya borrado -> 404

| Campo | Contenido |
|---|---|
| ID | CP-BE-ONB-029 |
| Título | Borrar quita el item del listado propio y del público; ajeno -> 403; ya borrado -> 404 |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M3 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Otro profesional intenta editar y borrar el item ajeno.<br>El dueño lo borra.<br>Borrar de nuevo. |
| Datos de prueba | — |
| Resultado esperado | 403 y 403; borrado 200 y ausente de ambos listados; segundo borrado 404. |
| Automatizado en | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` — `borrar quita el item del listado propio y del público; ajeno -> 403; ya borrado -> 404` |

### CP-BE-ONB-030 — La revisión de portafolio exige permiso y motivo al rechazar; un item rechazado no es público ni re-revisable

| Campo | Contenido |
|---|---|
| ID | CP-BE-ONB-030 |
| Título | La revisión de portafolio exige permiso y motivo al rechazar; un item rechazado no es público ni re-revisable |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M3 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Revisar con un usuario común.<br>Rechazar sin motivo.<br>Rechazar con motivo.<br>Aprobar el rechazado. |
| Datos de prueba | — |
| Resultado esperado | 403, 400, 200; ausente del público; re-revisar 409. |
| Automatizado en | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` — `la revisión de portafolio exige permiso y motivo al rechazar; un item rechazado no es público ni re-revisable` |

### CP-BE-ONB-031 — Rechazar con motivo vacío o solo espacios debe dar 400 y no cambiar el estado [DEF-BE-016: Corregido (21ba467)]

| Campo | Contenido |
|---|---|
| ID | CP-BE-ONB-031 |
| Título | Rechazar con motivo vacío o solo espacios debe dar 400 y no cambiar el estado [DEF-BE-016: Corregido (21ba467)] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P2 |
| Trazabilidad | M3 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3; DEF-BE-016 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Rechazar con `rejectionReason` "" y "   ". |
| Datos de prueba | — |
| Resultado esperado | 400 y el documento sigue PENDING. |
| Automatizado en | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` — `DEF-BE-016: rechazar con motivo vacío o solo espacios debe dar 400 y no cambiar el estado` |

### CP-BE-ONB-032 — Suspender con motivo solo espacios debe dar 400 y no suspender [DEF-BE-017: Corregido (0f5ceb6)]

| Campo | Contenido |
|---|---|
| ID | CP-BE-ONB-032 |
| Título | Suspender con motivo solo espacios debe dar 400 y no suspender [DEF-BE-017: Corregido (0f5ceb6)] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P2 |
| Trazabilidad | M3 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3; DEF-BE-017 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Suspender con `reason` "   ". |
| Datos de prueba | — |
| Resultado esperado | 400 y el profesional sigue APPROVED. |
| Automatizado en | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` — `DEF-BE-017: suspender con motivo solo espacios debe dar 400 y no suspender` |

### CP-BE-ONB-033 — Rechazar un item de portafolio con motivo vacío o solo espacios -> 400 y sigue PENDING [DEF-BE-016: Corregido (21ba467)]

| Campo | Contenido |
|---|---|
| ID | CP-BE-ONB-033 |
| Título | Rechazar un item de portafolio con motivo vacío o solo espacios -> 400 y sigue PENDING [DEF-BE-016: Corregido (21ba467)] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P2 |
| Trazabilidad | M3 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3; DEF-BE-016 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Rechazar un item con "" y "   ". |
| Datos de prueba | — |
| Resultado esperado | 400 y el item sigue PENDING. |
| Automatizado en | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` — `DEF-BE-016: rechazar un item de portafolio con motivo vacío o solo espacios -> 400 y sigue PENDING` |

### CP-BE-ONB-034 — Un cliente no puede ver el perfil de un postulante PENDING (por id ni por referenceId) [DEF-BE-023: ABIERTO (it.failing)]

| Campo | Contenido |
|---|---|
| ID | CP-BE-ONB-034 |
| Título | Un cliente no puede ver el perfil de un postulante PENDING (por id ni por referenceId) [DEF-BE-023: ABIERTO (it.failing)] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P2 |
| Trazabilidad | M3 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3; DEF-BE-023 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | cliente_a consulta `GET /professionals/:id` y `/professionals/reference/:ref` de un postulante PENDING. |
| Datos de prueba | — |
| Resultado esperado | Esperado 404 para no-admin (admin 200). Hoy 200: DEF-BE-023 abierto. |
| Automatizado en | `test/e2e-real/onboarding-profesional.e2e-real-spec.ts` — `DEF-BE-023: un cliente no puede ver el perfil de un postulante PENDING (por id ni por referenceId)` |

## Estado de defectos (rama test/e2e-w2-onboarding-marketplace)

| DEF | Sev. | Caso | Estado |
|---|---|---|---|
| DEF-BE-014 | Alto | CP-BE-ONB-007 | Corregido (1659312): versiones legales sembradas con `countryId` null |
| DEF-BE-015 | Bajo | CP-BE-ONB-002 | Corregido (c6467a1): doble postulación 400 -> 409 |
| DEF-BE-016 | Medio | CP-BE-ONB-031, 033 | Corregido (21ba467): rechazo de documentos y portafolio exige motivo no vacío |
| DEF-BE-017 | Bajo | CP-BE-ONB-032 | Corregido (0f5ceb6): suspensión exige motivo no vacío |
| DEF-BE-018 | Alto | CP-BE-ONB-024 | Corregido (8aa44de): `/locations/nearby` daba 500 (HAVING sin GROUP BY) |
| DEF-BE-023 | Medio | CP-BE-ONB-034 | ABIERTO: `GET /professionals/:id` y `/reference/:ref` exponen postulantes PENDING a cualquier cliente |
