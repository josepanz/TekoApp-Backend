# CP-UPL — Autorización de archivos S3 y auditoría de IDOR (Backend)

Especificación según `C:\workspace\QA-DOC-STANDARD.md` §2. Casos CP-BE-UPL-001..018: autorización de archivos en S3/MinIO (`GET /uploads/presigned-url`, `GET /uploads/info/:filename`, `DELETE /uploads/:filename`) y auditoría de IDOR en `/services/:id/progress` y `/budget-options`. Los marcados `[DEF ...]` quedaron corregidos y su test es un `it` normal.

## Regla de autorización (el dueño se resuelve desde la DB, nunca desde la key)

`StorageAccessDbService.findOwnerByKey` busca qué registro referencia la key, en este orden de sensibilidad (si una key figura en varios, solo rige el primero: una key forjada en una bitácora no abre un documento). Una key sin registro es 404, también para el admin.

| Estructura de la key | Registro | Lectura | Borrado |
|---|---|---|---|
| `<16 hex>.<ext>` generada por el backend, guardada en `ProfessionalDocuments.fileKey` | documento profesional | dueño, `professional-documents.review:manage`, admin; cualquiera si está aprobado y su tipo es `isVisibleToClient` | dueño, admin |
| idem, en `ProfessionalPortfolioItems.fileKey` | foto de portafolio | dueño, `professional-portfolio.review:manage`, admin; cualquiera si está APPROVED, `isVisible` y activa | dueño, admin |
| idem, en `Users.avatarKey` | avatar | cualquier autenticado | el propio usuario, admin |
| `Contracts.pdfKey` | PDF del contrato | cliente y profesional del contrato, admin | solo admin |
| `ServiceProgressEntries.images[]` | foto de bitácora | cliente del servicio, profesional asignado, `service-progress.audit:read`, admin | profesional autor, admin |
| `Services.images[]` | foto del servicio | cliente, profesional asignado, admin; mientras está PENDING también cualquier profesional APPROVED activo | cliente dueño, admin |
| `onboarding/merchants/<userRef>/1/...` (`/uploads/merchant-docs`) y archivos de `/uploads/image\|document` aún no guardados | sin registro | 404 | 404 |

- **TTL:** el URL presignado dura como máximo 300 s (`S3_PRESIGNED_URL_EXPIRES_IN` se topa en 300 en `config-loader.ts`; antes 900).
- **Consumidores verificados:** Web `features/professional-documents` (revisión de admin y documentos propios), `features/professional-portfolio` (propio, revisión de admin y galería pública), `features/service-progress` (fotos de bitácora) y avatar vía `/auth/me`/`/uploads/avatar`; Mobile `professional_documents_repository`, `professional_portfolio_repository` (+ `ResolvedNetworkImage`) y `service_progress_repository.resolvePhotoUrl`. Todos piden la key de un registro que el usuario puede ver, así que el flujo legítimo sigue funcionando.
- **No cubierto:** (1) `merchant-docs` guarda la key solo en el path y no en la DB, por lo que nadie las puede pedir (404): el flujo está sin uso en Web y Mobile; (2) una imagen subida con `/uploads/image` y no guardada solo se previsualiza con el `url` que devuelve la propia subida, no con `presigned-url`; (3) un profesional suspendido a mitad de servicio mantiene acceso a las fotos de su servicio (es parte asignada); (4) `/uploads/avatar` genera una miniatura (`thumb_*`) que ningún registro referencia y por tanto no se puede pedir.


### CP-BE-UPL-001 — Cliente_b no puede obtener el URL presignado de un documento de un profesional ni descargar sus bytes [DEF-BE-024: Corregido (a4050d5)]

| Campo | Contenido |
|---|---|
| ID | CP-BE-UPL-001 |
| Título | Cliente_b no puede obtener el URL presignado de un documento de un profesional ni descargar sus bytes [DEF-BE-024: Corregido (a4050d5)] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M3/M9 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3 y 6; DEF-BE-024 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Un profesional sube un documento de identidad (BG_CHECK).<br>cliente_b pide `GET /uploads/presigned-url?key=<fileKey>` y, si obtiene el URL, lo descarga. |
| Datos de prueba | PDF de ~200 bytes |
| Resultado esperado | 403 y no se descargan los bytes (antes: 200 y los bytes reales). |
| Automatizado en | `test/e2e-real/uploads-presigned.e2e-real-spec.ts` — `DEF-BE-024: cliente_b no puede obtener el URL presignado de un documento de un profesional ni descargar sus bytes` |

### CP-BE-UPL-002 — Otro profesional tampoco puede; el dueño y el admin sí, con los mismos bytes [DEF-BE-024: Corregido (a4050d5)]

| Campo | Contenido |
|---|---|
| ID | CP-BE-UPL-002 |
| Título | Otro profesional tampoco puede; el dueño y el admin sí, con los mismos bytes [DEF-BE-024: Corregido (a4050d5)] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M3/M9 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3 y 6; DEF-BE-024 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Otro profesional, el dueño y el admin piden el mismo URL. |
| Datos de prueba | — |
| Resultado esperado | Otro profesional 403; dueño y admin 200 y los bytes descargados del MinIO real son idénticos a los subidos. |
| Automatizado en | `test/e2e-real/uploads-presigned.e2e-real-spec.ts` — `DEF-BE-024: otro profesional tampoco puede; el dueño y el admin sí, con los mismos bytes` |

### CP-BE-UPL-003 — Un documento aprobado y visible al cliente lo ve cualquier autenticado; uno aprobado no visible, no [DEF-BE-024: Corregido (a4050d5)]

| Campo | Contenido |
|---|---|
| ID | CP-BE-UPL-003 |
| Título | Un documento aprobado y visible al cliente lo ve cualquier autenticado; uno aprobado no visible, no [DEF-BE-024: Corregido (a4050d5)] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M3/M9 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3 y 6; DEF-BE-024 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | cliente_b pide un documento aprobado de tipo visible al cliente y uno aprobado de tipo no visible. |
| Datos de prueba | QUALIFICATION vs BG_CHECK_JUDICIAL |
| Resultado esperado | El visible 200; el no visible 403. |
| Automatizado en | `test/e2e-real/uploads-presigned.e2e-real-spec.ts` — `DEF-BE-024: un documento aprobado y visible al cliente lo ve cualquier autenticado; uno aprobado no visible, no` |

### CP-BE-UPL-004 — GET /uploads/info/:filename aplica la misma regla [DEF-BE-024: Corregido (a4050d5)]

| Campo | Contenido |
|---|---|
| ID | CP-BE-UPL-004 |
| Título | GET /uploads/info/:filename aplica la misma regla [DEF-BE-024: Corregido (a4050d5)] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M3/M9 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3 y 6; DEF-BE-024 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | `GET /uploads/info/:filename` con cliente_b y con el dueño. |
| Datos de prueba | — |
| Resultado esperado | 403 y 200. |
| Automatizado en | `test/e2e-real/uploads-presigned.e2e-real-spec.ts` — `DEF-BE-024: GET /uploads/info/:filename aplica la misma regla` |

### CP-BE-UPL-005 — Una foto PENDING u oculta (isVisible:false) solo la ven el dueño y el admin [DEF-BE-024: Corregido (a4050d5)]

| Campo | Contenido |
|---|---|
| ID | CP-BE-UPL-005 |
| Título | Una foto PENDING u oculta (isVisible:false) solo la ven el dueño y el admin [DEF-BE-024: Corregido (a4050d5)] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M3/M9 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3 y 6; DEF-BE-024 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Fotos de portafolio PENDING y aprobada-oculta: cliente_b, dueño y admin piden el URL. |
| Datos de prueba | — |
| Resultado esperado | cliente_b 403; dueño y admin 200. |
| Automatizado en | `test/e2e-real/uploads-presigned.e2e-real-spec.ts` — `DEF-BE-024: una foto PENDING u oculta (isVisible:false) solo la ven el dueño y el admin` |

### CP-BE-UPL-006 — Una foto aprobada y visible la ve cualquier usuario autenticado y los bytes se descargan

| Campo | Contenido |
|---|---|
| ID | CP-BE-UPL-006 |
| Título | Una foto aprobada y visible la ve cualquier usuario autenticado y los bytes se descargan |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M3/M9 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3 y 6 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Foto aprobada y visible: cliente_b pide el URL y descarga. |
| Datos de prueba | — |
| Resultado esperado | 200 y los bytes bajan (200). |
| Automatizado en | `test/e2e-real/uploads-presigned.e2e-real-spec.ts` — `una foto aprobada y visible la ve cualquier usuario autenticado y los bytes se descargan` |

### CP-BE-UPL-007 — El avatar de un usuario lo ve cualquier autenticado

| Campo | Contenido |
|---|---|
| ID | CP-BE-UPL-007 |
| Título | El avatar de un usuario lo ve cualquier autenticado |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M3/M9 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3 y 6 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Un usuario sube avatar (`/uploads/avatar`), lo guarda con `PUT /auth/me`; cliente_b pide el URL. |
| Datos de prueba | PNG 1x1 |
| Resultado esperado | 200: los avatares los ve cualquier autenticado. |
| Automatizado en | `test/e2e-real/uploads-presigned.e2e-real-spec.ts` — `el avatar de un usuario lo ve cualquier autenticado` |

### CP-BE-UPL-008 — Una key que ninguna fila referencia (inventada o recién subida sin guardar) -> 404 [DEF-BE-024: Corregido (a4050d5)]

| Campo | Contenido |
|---|---|
| ID | CP-BE-UPL-008 |
| Título | Una key que ninguna fila referencia (inventada o recién subida sin guardar) -> 404 [DEF-BE-024: Corregido (a4050d5)] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M3/M9 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3 y 6; DEF-BE-024 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Pedir una key inventada y una imagen recién subida con `/uploads/image` que ninguna fila referencia; con cliente_b y con admin. |
| Datos de prueba | — |
| Resultado esperado | 404 en todos (antes: 200). |
| Automatizado en | `test/e2e-real/uploads-presigned.e2e-real-spec.ts` — `DEF-BE-024: una key que ninguna fila referencia (inventada o recién subida sin guardar) -> 404` |

### CP-BE-UPL-009 — El URL presignado expira en 5 minutos como máximo [DEF-BE-024: Corregido (a4050d5)]

| Campo | Contenido |
|---|---|
| ID | CP-BE-UPL-009 |
| Título | El URL presignado expira en 5 minutos como máximo [DEF-BE-024: Corregido (a4050d5)] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M3/M9 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3 y 6; DEF-BE-024 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Leer `X-Amz-Expires` del URL firmado. |
| Datos de prueba | — |
| Resultado esperado | Mayor que 0 y como máximo 300 s (antes: 900). |
| Automatizado en | `test/e2e-real/uploads-presigned.e2e-real-spec.ts` — `DEF-BE-024: el URL presignado expira en 5 minutos como máximo` |

### CP-BE-UPL-010 — Sin JWT o sin key -> 401 / 400

| Campo | Contenido |
|---|---|
| ID | CP-BE-UPL-010 |
| Título | Sin JWT o sin key -> 401 / 400 |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M3/M9 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3 y 6 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Pedir presigned, info y delete sin JWT; presigned sin `key`. |
| Datos de prueba | — |
| Resultado esperado | 401, 401, 401 y 400. |
| Automatizado en | `test/e2e-real/uploads-presigned.e2e-real-spec.ts` — `sin JWT o sin key -> 401 / 400` |

### CP-BE-UPL-011 — La foto de un servicio PENDING la ven el cliente, un profesional aprobado y el admin; no un tercero [DEF-BE-024: Corregido (a4050d5)]

| Campo | Contenido |
|---|---|
| ID | CP-BE-UPL-011 |
| Título | La foto de un servicio PENDING la ven el cliente, un profesional aprobado y el admin; no un tercero [DEF-BE-024: Corregido (a4050d5)] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M3/M9 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3 y 6; DEF-BE-024 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | El cliente sube una imagen y crea un servicio PENDING con `images:[key]`; piden el URL el cliente, un profesional aprobado, el admin y cliente_b. |
| Datos de prueba | — |
| Resultado esperado | Cliente, profesional aprobado y admin 200; cliente_b 403. |
| Automatizado en | `test/e2e-real/uploads-presigned.e2e-real-spec.ts` — `DEF-BE-024: la foto de un servicio PENDING la ven el cliente, un profesional aprobado y el admin; no un tercero` |

### CP-BE-UPL-012 — Tras asignarse, la foto del servicio y las de la bitácora solo las ven el cliente, el profesional asignado y el admin [DEF-BE-024: Corregido (a4050d5)]

| Campo | Contenido |
|---|---|
| ID | CP-BE-UPL-012 |
| Título | Tras asignarse, la foto del servicio y las de la bitácora solo las ven el cliente, el profesional asignado y el admin [DEF-BE-024: Corregido (a4050d5)] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M3/M9 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3 y 6; DEF-BE-024 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Servicio asignado e IN_PROGRESS con una foto de bitácora; piden el URL de la foto del servicio y de la bitácora el cliente, el asignado, el admin, cliente_b y otro profesional. |
| Datos de prueba | — |
| Resultado esperado | 200 para los tres primeros; 403 para los dos últimos. |
| Automatizado en | `test/e2e-real/uploads-presigned.e2e-real-spec.ts` — `DEF-BE-024: tras asignarse, la foto del servicio y las de la bitácora solo las ven el cliente, el profesional asignado y el admin` |

### CP-BE-UPL-013 — Adjuntar la key de un documento ajeno a una entrada de bitácora no da acceso a ese documento [DEF-BE-024: Corregido (a4050d5)]

| Campo | Contenido |
|---|---|
| ID | CP-BE-UPL-013 |
| Título | Adjuntar la key de un documento ajeno a una entrada de bitácora no da acceso a ese documento [DEF-BE-024: Corregido (a4050d5)] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M3/M9 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3 y 6; DEF-BE-024 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | El profesional asignado adjunta la key de un documento ajeno a una entrada de bitácora y luego pide ese URL (y el cliente del servicio también). |
| Datos de prueba | key de otro profesional |
| Resultado esperado | 403 en ambos: las reglas del documento prevalecen sobre las de la bitácora (clave forjada). |
| Automatizado en | `test/e2e-real/uploads-presigned.e2e-real-spec.ts` — `DEF-BE-024: adjuntar la key de un documento ajeno a una entrada de bitácora no da acceso a ese documento` |

### CP-BE-UPL-014 — Cliente_b no puede borrar un documento ajeno (403) y el archivo sigue ahí [DEF-BE-025: Corregido (59382c1)]

| Campo | Contenido |
|---|---|
| ID | CP-BE-UPL-014 |
| Título | Cliente_b no puede borrar un documento ajeno (403) y el archivo sigue ahí [DEF-BE-025: Corregido (59382c1)] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M3/M9 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3 y 6; DEF-BE-025 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | cliente_b `DELETE /uploads/:fileKey` de un documento ajeno; el dueño sigue pudiendo pedir y descargar el archivo. |
| Datos de prueba | — |
| Resultado esperado | 403 y el archivo sigue (antes: 200 y se borraba). |
| Automatizado en | `test/e2e-real/uploads-presigned.e2e-real-spec.ts` — `DEF-BE-025: cliente_b no puede borrar un documento ajeno (403) y el archivo sigue ahí` |

### CP-BE-UPL-015 — Borrar una key no referenciada -> 404 [DEF-BE-025: Corregido (59382c1)]

| Campo | Contenido |
|---|---|
| ID | CP-BE-UPL-015 |
| Título | Borrar una key no referenciada -> 404 [DEF-BE-025: Corregido (59382c1)] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M3/M9 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3 y 6; DEF-BE-025 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Borrar una key no referenciada. |
| Datos de prueba | — |
| Resultado esperado | 404. |
| Automatizado en | `test/e2e-real/uploads-presigned.e2e-real-spec.ts` — `DEF-BE-025: borrar una key no referenciada -> 404` |

### CP-BE-UPL-016 — El dueño y el admin pueden borrar el archivo

| Campo | Contenido |
|---|---|
| ID | CP-BE-UPL-016 |
| Título | El dueño y el admin pueden borrar el archivo |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M3/M9 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3 y 6 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | El dueño y el admin borran su archivo. |
| Datos de prueba | — |
| Resultado esperado | 200 en ambos. |
| Automatizado en | `test/e2e-real/uploads-presigned.e2e-real-spec.ts` — `el dueño y el admin pueden borrar el archivo` |

### CP-BE-UPL-017 — Bitácora: un tercero (cliente_b, otro profesional) no puede leer ni escribir; el dueño, el asignado y el admin leen

| Campo | Contenido |
|---|---|
| ID | CP-BE-UPL-017 |
| Título | Bitácora: un tercero (cliente_b, otro profesional) no puede leer ni escribir; el dueño, el asignado y el admin leen |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M3/M9 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3 y 6 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Servicio IN_PROGRESS con una entrada de bitácora: cliente_b y otro profesional intentan leer, crear y borrar; el cliente dueño intenta crear; leen dueño, asignado y admin. |
| Datos de prueba | — |
| Resultado esperado | 403 a los terceros y al cliente al crear; 200 para dueño, asignado y admin. Sin defectos. |
| Automatizado en | `test/e2e-real/uploads-presigned.e2e-real-spec.ts` — `bitácora: un tercero (cliente_b, otro profesional) no puede leer ni escribir; el dueño, el asignado y el admin leen` |

### CP-BE-UPL-018 — Presupuestos: un tercero no puede leer, reemplazar ni elegir opciones; solo el autor edita y solo el cliente dueño elige

| Campo | Contenido |
|---|---|
| ID | CP-BE-UPL-018 |
| Título | Presupuestos: un tercero no puede leer, reemplazar ni elegir opciones; solo el autor edita y solo el cliente dueño elige |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M3/M9 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 3 y 6 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Oferta con opciones de presupuesto: cliente_b y otro profesional intentan leer, reemplazar y elegir; el cliente dueño intenta reemplazar; el autor reemplaza y el dueño lee; el autor intenta elegir. |
| Datos de prueba | — |
| Resultado esperado | 403 a todo lo ajeno; 200 al autor al reemplazar y al dueño al leer; el autor no puede elegir. Sin defectos. |
| Automatizado en | `test/e2e-real/uploads-presigned.e2e-real-spec.ts` — `presupuestos: un tercero no puede leer, reemplazar ni elegir opciones; solo el autor edita y solo el cliente dueño elige` |

## Estado de defectos (rama test/e2e-w2-onboarding-marketplace)

| DEF | Sev. | Casos | Estado |
|---|---|---|---|
| DEF-BE-024 | Crítico | CP-BE-UPL-001..005, 008, 009, 011..013 | Corregido (a4050d5): `presigned-url` e `info` autorizan por dueño, 404 sin registro, TTL <= 300 s |
| DEF-BE-025 | Alto | CP-BE-UPL-014, 015 | Corregido (59382c1): `DELETE /uploads/:filename` solo dueño o admin |
| (auditoría) | — | CP-BE-UPL-017, 018 | Sin IDOR en `/progress` ni `/budget-options`: casos de regresión |
