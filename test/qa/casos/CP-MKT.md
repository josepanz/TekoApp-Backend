# CP-MKT — M4 Marketplace: ciclo de vida de servicios (Backend)

Especificación según `C:\workspace\QA-DOC-STANDARD.md` §2. Casos CP-BE-MKT-001..038 de la ola W2 (Tier 4 del plan e2e). Los marcados `[DEF ...]` quedaron corregidos y su test es un `it` normal.

## Naming `serviceId` vs `serviceRequestId` (TRAMPA histórica, verificada en `schema.prisma` y controllers)

El modelo tiene DOS entidades: `Services` (la solicitud del cliente, nace PENDING) y `ServiceRequests` (la oferta/propuesta de un profesional sobre un servicio). El nombre "service request" se usa para ambas cosas. Qué id espera cada ruta (todos son UUID públicos `referenceId`, salvo indicación):

| Ruta | Parámetro | Entidad real |
|---|---|---|
| `POST /services` | — | crea un `Services` (referenceId en la respuesta) |
| `GET/PUT/DELETE /services/:id`, `POST /services/:id/accept\|start\|complete` | `:id` | `Services.referenceId` |
| `POST/GET /services/:id/requests` | `:id` | `Services.referenceId` (crea/lista ofertas de ese servicio) |
| `PUT /services/:id/requests/:requestId` | `:id` / `:requestId` | `Services.referenceId` / `ServiceRequests.referenceId` (la oferta) |
| `PUT/GET /services/:id/requests/:requestId/budget-options`, `PATCH .../:optionReferenceId/select` | `:id` / `:requestId` | servicio / oferta |
| `GET/POST/DELETE /services/:id/progress` | `:id` | `Services.referenceId` |
| `POST /ratings` (body) y `GET /ratings/service/:serviceRequestId` | `serviceRequestId` | **`Services.referenceId`** (se resuelve con `findServiceByReferenceId`): el nombre dice "request" pero es el servicio |
| `POST /ratings/professional-to-client` (body) | `serviceRequestId` | idem: `Services.referenceId` |
| Prisma `BudgetOptions.serviceRequestId` (Int) | FK | `ServiceRequests.id` (la oferta, sí es una oferta) |
| `GET /locations/professional/:id` | `:id` | `Professionals.id` (Int, NO UUID) |

Regla práctica: en `/services/**` el primer id siempre es el servicio; solo `:requestId` es una oferta. Fuera de ahí, `serviceRequestId` en ratings es el servicio. Las respuestas exponen `id` (Int, solo ordenamiento) y `referenceId` (UUID, el único que viaja en URLs); `ServiceRequests.serviceId` en la respuesta es el `referenceId` del servicio padre.

## Decisiones y casos no automatizables

- **Dos caminos al estado ACCEPTED:** (a) aceptación directa del profesional `POST /services/:id/accept`; (b) oferta del profesional + `PUT /services/:id/requests/:requestId` del cliente con ACCEPTED (transacción que acepta el servicio y rechaza las demás ofertas). Ambos usan actualización condicional (`updateMany ... where status`), por eso el perdedor de una carrera recibe 409.
- **Concurrencia (x20):** 3 variantes (dos profesionales, el mismo profesional dos veces, el cliente aceptando dos ofertas) con `Promise.all`, 20 iteraciones cada una (CP-BE-MKT-022..024). Antes del fix de DEF-BE-019 el perdedor recibía 400 o 409 según el timing; ahora siempre 409.
- **Posición exacta:** se prueba por REST (`GET /locations/professional/:id`). `subscribeToProfessional` (WebSocket) usa la misma regla `canViewExactLocation`; no hay `socket.io-client` en el repo, por lo que queda cubierto por `src/api/locations/gateway/locations.gateway.spec.ts` y como caso manual (conectar con JWT del cliente y emitir `subscribeToProfessional` antes y después de COMPLETED).
- **Auditoría de IDOR en `/services/:id/progress` y `/requests/:requestId/budget-options` (lectura y escritura):** sin defectos. Bitácora: crear solo el profesional asignado, leer cliente dueño, asignado y staff (`service-progress.audit:read` o admin), borrar solo el autor. Presupuestos: reemplazar solo el profesional autor de la oferta PENDING, leer el cliente dueño o el autor, elegir solo el cliente dueño (el admin no tiene acceso: decisión de producto para M5). Quedan como casos de regresión en `CP-UPL.md` (CP-BE-UPL-017 y 018).
- **Brechas:** contratos (M5) y pagos (M6) no se prueban en esta oleada.


### CP-BE-MKT-001 — El cliente publica una solicitud: queda PENDING, sin profesional, con UUID público

| Campo | Contenido |
|---|---|
| ID | CP-BE-MKT-001 |
| Título | El cliente publica una solicitud: queda PENDING, sin profesional, con UUID público |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M4 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 4 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | cliente_a publica una solicitud.<br>`GET /services/my-services?role=client`. |
| Datos de prueba | título único, plomería, tipo 1, lat/lng Asunción |
| Resultado esperado | 201 PENDING, `professionalId` null, `referenceId` UUID; aparece en my-services. |
| Automatizado en | `test/e2e-real/marketplace.e2e-real-spec.ts` — `el cliente publica una solicitud: queda PENDING, sin profesional, con UUID público` |

### CP-BE-MKT-002 — Oferta del profesional -> el cliente la acepta -> ACCEPTED con el profesional asignado y la oferta ACCEPTED

| Campo | Contenido |
|---|---|
| ID | CP-BE-MKT-002 |
| Título | Oferta del profesional -> el cliente la acepta -> ACCEPTED con el profesional asignado y la oferta ACCEPTED |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M4 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 4 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Profesional aprobado oferta (`POST /services/:id/requests`).<br>El cliente responde `PUT /services/:id/requests/:requestId` con ACCEPTED. |
| Datos de prueba | proposedPrice 80000 |
| Resultado esperado | Oferta nace PENDING; servicio queda ACCEPTED con `professionalId` del profesional; la oferta figura ACCEPTED. |
| Automatizado en | `test/e2e-real/marketplace.e2e-real-spec.ts` — `oferta del profesional -> el cliente la acepta -> ACCEPTED con el profesional asignado y la oferta ACCEPTED` |

### CP-BE-MKT-003 — Start (IN_PROGRESS) y complete (COMPLETED) por el profesional asignado, con startedAt/completedAt y finalAmount

| Campo | Contenido |
|---|---|
| ID | CP-BE-MKT-003 |
| Título | Start (IN_PROGRESS) y complete (COMPLETED) por el profesional asignado, con startedAt/completedAt y finalAmount |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M4 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 4 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | El profesional asignado hace `POST /services/:id/start` y `/complete`. |
| Datos de prueba | — |
| Resultado esperado | IN_PROGRESS con `startedAt`; COMPLETED con `completedAt` y `finalAmount`. |
| Automatizado en | `test/e2e-real/marketplace.e2e-real-spec.ts` — `start (IN_PROGRESS) y complete (COMPLETED) por el profesional asignado, con startedAt/completedAt y finalAmount` |

### CP-BE-MKT-004 — Aceptación directa del profesional (POST /services/:id/accept) deja ACCEPTED con él asignado

| Campo | Contenido |
|---|---|
| ID | CP-BE-MKT-004 |
| Título | Aceptación directa del profesional (POST /services/:id/accept) deja ACCEPTED con él asignado |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M4 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 4 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | `POST /services/:id/accept` por un profesional aprobado. |
| Datos de prueba | — |
| Resultado esperado | 201; ACCEPTED con él asignado. |
| Automatizado en | `test/e2e-real/marketplace.e2e-real-spec.ts` — `aceptación directa del profesional (POST /services/:id/accept) deja ACCEPTED con él asignado` |

### CP-BE-MKT-005 — Rechazar una oferta la deja REJECTED y el servicio sigue PENDING y abierto a otras ofertas

| Campo | Contenido |
|---|---|
| ID | CP-BE-MKT-005 |
| Título | Rechazar una oferta la deja REJECTED y el servicio sigue PENDING y abierto a otras ofertas |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M4 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 4 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | El cliente rechaza una oferta; otro profesional oferta después. |
| Datos de prueba | — |
| Resultado esperado | Oferta REJECTED, servicio PENDING y abierto a nuevas ofertas (201). |
| Automatizado en | `test/e2e-real/marketplace.e2e-real-spec.ts` — `rechazar una oferta la deja REJECTED y el servicio sigue PENDING y abierto a otras ofertas` |

### CP-BE-MKT-006 — Al aceptar una oferta, las demás ofertas pendientes pasan a REJECTED

| Campo | Contenido |
|---|---|
| ID | CP-BE-MKT-006 |
| Título | Al aceptar una oferta, las demás ofertas pendientes pasan a REJECTED |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M4 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 4 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Dos profesionales ofertan; el cliente acepta una. |
| Datos de prueba | — |
| Resultado esperado | Una ACCEPTED y la otra REJECTED. |
| Automatizado en | `test/e2e-real/marketplace.e2e-real-spec.ts` — `al aceptar una oferta, las demás ofertas pendientes pasan a REJECTED` |

### CP-BE-MKT-007 — El profesional ve el servicio asignado en my-services?role=professional y el cliente en role=client

| Campo | Contenido |
|---|---|
| ID | CP-BE-MKT-007 |
| Título | El profesional ve el servicio asignado en my-services?role=professional y el cliente en role=client |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P2 |
| Trazabilidad | M4 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 4 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Consultar `my-services` como profesional (`role=professional&status=ACCEPTED`) y como cliente. |
| Datos de prueba | — |
| Resultado esperado | El servicio figura en ambos listados. |
| Automatizado en | `test/e2e-real/marketplace.e2e-real-spec.ts` — `el profesional ve el servicio asignado en my-services?role=professional y el cliente en role=client` |

### CP-BE-MKT-008 — El cliente cancela un servicio PENDING: CANCELLED con motivo y cancelledAt

| Campo | Contenido |
|---|---|
| ID | CP-BE-MKT-008 |
| Título | El cliente cancela un servicio PENDING: CANCELLED con motivo y cancelledAt |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M4 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 4 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | `DELETE /services/:id` con motivo por el cliente. |
| Datos de prueba | reason "Cambié de idea" |
| Resultado esperado | 200 CANCELLED con motivo y `cancelledAt`. |
| Automatizado en | `test/e2e-real/marketplace.e2e-real-spec.ts` — `el cliente cancela un servicio PENDING: CANCELLED con motivo y cancelledAt` |

### CP-BE-MKT-009 — El cliente y el profesional asignado pueden cancelar un servicio ACCEPTED

| Campo | Contenido |
|---|---|
| ID | CP-BE-MKT-009 |
| Título | El cliente y el profesional asignado pueden cancelar un servicio ACCEPTED |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M4 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 4 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Cancelar un servicio ACCEPTED como cliente y otro como profesional asignado. |
| Datos de prueba | — |
| Resultado esperado | 200 CANCELLED en ambos. |
| Automatizado en | `test/e2e-real/marketplace.e2e-real-spec.ts` — `el cliente y el profesional asignado pueden cancelar un servicio ACCEPTED` |

### CP-BE-MKT-010 — Cancelar sin motivo -> 400; un tercero (cliente_b, otro profesional) -> 403 y el servicio no cambia

| Campo | Contenido |
|---|---|
| ID | CP-BE-MKT-010 |
| Título | Cancelar sin motivo -> 400; un tercero (cliente_b, otro profesional) -> 403 y el servicio no cambia |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M4 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 4 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Cancelar sin motivo; cancelar con cliente_b y con otro profesional. |
| Datos de prueba | — |
| Resultado esperado | 400; 403 con envelope uniforme; el servicio sigue ACCEPTED. |
| Automatizado en | `test/e2e-real/marketplace.e2e-real-spec.ts` — `cancelar sin motivo -> 400; un tercero (cliente_b, otro profesional) -> 403 y el servicio no cambia` |

### CP-BE-MKT-011 — No se puede cancelar un servicio IN_PROGRESS, COMPLETED ni CANCELLED: 409 con envelope uniforme [DEF-BE-019: Corregido (ace979a)]

| Campo | Contenido |
|---|---|
| ID | CP-BE-MKT-011 |
| Título | No se puede cancelar un servicio IN_PROGRESS, COMPLETED ni CANCELLED: 409 con envelope uniforme [DEF-BE-019: Corregido (ace979a)] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M4 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 4; DEF-BE-019 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Cancelar en cada uno de esos estados. |
| Datos de prueba | — |
| Resultado esperado | 409 con envelope uniforme y el estado no cambia. |
| Automatizado en | `test/e2e-real/marketplace.e2e-real-spec.ts` — `DEF-BE-019: no se puede cancelar un servicio IN_PROGRESS, COMPLETED ni CANCELLED: 409 con envelope uniforme` |

### CP-BE-MKT-012 — Completar sin iniciar -> 409 con envelope uniforme [DEF-BE-019: Corregido (ace979a)]

| Campo | Contenido |
|---|---|
| ID | CP-BE-MKT-012 |
| Título | Completar sin iniciar -> 409 con envelope uniforme [DEF-BE-019: Corregido (ace979a)] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M4 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 4; DEF-BE-019 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | `POST /services/:id/complete` sobre un ACCEPTED. |
| Datos de prueba | — |
| Resultado esperado | 409 con envelope uniforme (antes: 400); sigue ACCEPTED. |
| Automatizado en | `test/e2e-real/marketplace.e2e-real-spec.ts` — `DEF-BE-019: completar sin iniciar -> 409 con envelope uniforme` |

### CP-BE-MKT-013 — Iniciar un servicio ya iniciado, o aceptar uno no PENDING -> 409 [DEF-BE-019: Corregido (ace979a)]

| Campo | Contenido |
|---|---|
| ID | CP-BE-MKT-013 |
| Título | Iniciar un servicio ya iniciado, o aceptar uno no PENDING -> 409 [DEF-BE-019: Corregido (ace979a)] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M4 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 4; DEF-BE-019 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Start dos veces; accept sobre un ACCEPTED; complete dos veces. |
| Datos de prueba | — |
| Resultado esperado | 409 en todos. |
| Automatizado en | `test/e2e-real/marketplace.e2e-real-spec.ts` — `DEF-BE-019: iniciar un servicio ya iniciado, o aceptar uno no PENDING -> 409` |

### CP-BE-MKT-014 — Iniciar un servicio PENDING (sin profesional asignado) -> 403/409, nunca avanza

| Campo | Contenido |
|---|---|
| ID | CP-BE-MKT-014 |
| Título | Iniciar un servicio PENDING (sin profesional asignado) -> 403/409, nunca avanza |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M4 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 4 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | `start` por un profesional sobre un servicio sin asignar. |
| Datos de prueba | — |
| Resultado esperado | 403 o 409 con envelope; el servicio sigue PENDING. |
| Automatizado en | `test/e2e-real/marketplace.e2e-real-spec.ts` — `iniciar un servicio PENDING (sin profesional asignado) -> 403/409, nunca avanza` |

### CP-BE-MKT-015 — Enviar una oferta a un servicio que ya no está PENDING -> 409 [DEF-BE-019: Corregido (ace979a)]

| Campo | Contenido |
|---|---|
| ID | CP-BE-MKT-015 |
| Título | Enviar una oferta a un servicio que ya no está PENDING -> 409 [DEF-BE-019: Corregido (ace979a)] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M4 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 4; DEF-BE-019 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Un segundo profesional oferta a un servicio ACCEPTED. |
| Datos de prueba | — |
| Resultado esperado | 409 con envelope uniforme (antes: 400). |
| Automatizado en | `test/e2e-real/marketplace.e2e-real-spec.ts` — `DEF-BE-019: enviar una oferta a un servicio que ya no está PENDING -> 409` |

### CP-BE-MKT-016 — La oferta duplicada del mismo profesional -> 409 [DEF-BE-019: Corregido (ace979a)]

| Campo | Contenido |
|---|---|
| ID | CP-BE-MKT-016 |
| Título | La oferta duplicada del mismo profesional -> 409 [DEF-BE-019: Corregido (ace979a)] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P2 |
| Trazabilidad | M4 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 4; DEF-BE-019 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | El mismo profesional oferta dos veces. |
| Datos de prueba | — |
| Resultado esperado | 201 y luego 409 (antes: 400). |
| Automatizado en | `test/e2e-real/marketplace.e2e-real-spec.ts` — `DEF-BE-019: la oferta duplicada del mismo profesional -> 409` |

### CP-BE-MKT-017 — Una oferta ya aceptada no se puede rechazar después (la oferta y el servicio no quedan incoherentes) [DEF-BE-020: Corregido (8742cb6)]

| Campo | Contenido |
|---|---|
| ID | CP-BE-MKT-017 |
| Título | Una oferta ya aceptada no se puede rechazar después (la oferta y el servicio no quedan incoherentes) [DEF-BE-020: Corregido (8742cb6)] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M4 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 4; DEF-BE-020 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | El cliente acepta una oferta y luego intenta rechazarla. |
| Datos de prueba | — |
| Resultado esperado | 409; la oferta sigue ACCEPTED (antes: 200 y quedaba REJECTED con el servicio ACCEPTED). |
| Automatizado en | `test/e2e-real/marketplace.e2e-real-spec.ts` — `DEF-BE-020: una oferta ya aceptada no se puede rechazar después (la oferta y el servicio no quedan incoherentes)` |

### CP-BE-MKT-018 — Responder una oferta con un estado distinto de ACCEPTED/REJECTED -> 400 y no la modifica

| Campo | Contenido |
|---|---|
| ID | CP-BE-MKT-018 |
| Título | Responder una oferta con un estado distinto de ACCEPTED/REJECTED -> 400 y no la modifica |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P2 |
| Trazabilidad | M4 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 4 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Responder con status CANCELLED. |
| Datos de prueba | — |
| Resultado esperado | 400 y la oferta sigue PENDING. |
| Automatizado en | `test/e2e-real/marketplace.e2e-real-spec.ts` — `responder una oferta con un estado distinto de ACCEPTED/REJECTED -> 400 y no la modifica` |

### CP-BE-MKT-019 — PUT /services/:id: el dueño edita en PENDING; fuera de PENDING/ACCEPTED -> 409 [DEF-BE-019: Corregido (ace979a)]

| Campo | Contenido |
|---|---|
| ID | CP-BE-MKT-019 |
| Título | PUT /services/:id: el dueño edita en PENDING; fuera de PENDING/ACCEPTED -> 409 [DEF-BE-019: Corregido (ace979a)] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M4 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 4; DEF-BE-019 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | El dueño edita en PENDING; luego se acepta e inicia y vuelve a editar. |
| Datos de prueba | title nuevo |
| Resultado esperado | 200 con el título nuevo; en IN_PROGRESS 409 (antes: 400). |
| Automatizado en | `test/e2e-real/marketplace.e2e-real-spec.ts` — `DEF-BE-019: PUT /services/:id: el dueño edita en PENDING; fuera de PENDING/ACCEPTED -> 409` |

### CP-BE-MKT-020 — Ids inexistentes o mal formados -> 404 / 400 con envelope uniforme

| Campo | Contenido |
|---|---|
| ID | CP-BE-MKT-020 |
| Título | Ids inexistentes o mal formados -> 404 / 400 con envelope uniforme |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P2 |
| Trazabilidad | M4 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 4 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | GET con UUID inexistente y con "no-es-uuid"; accept sobre inexistente. |
| Datos de prueba | — |
| Resultado esperado | 404, 400, 404 con envelope uniforme. |
| Automatizado en | `test/e2e-real/marketplace.e2e-real-spec.ts` — `ids inexistentes o mal formados -> 404 / 400 con envelope uniforme` |

### CP-BE-MKT-021 — Crear una solicitud con datos inválidos (sin título, coordenadas fuera de rango, categoría inexistente) -> 400/404

| Campo | Contenido |
|---|---|
| ID | CP-BE-MKT-021 |
| Título | Crear una solicitud con datos inválidos (sin título, coordenadas fuera de rango, categoría inexistente) -> 400/404 |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P2 |
| Trazabilidad | M4 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 4 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Sin título y latitud 200; categoría inexistente; sin JWT. |
| Datos de prueba | — |
| Resultado esperado | 400 con campos `title` y `latitude`; 400/404; 401. |
| Automatizado en | `test/e2e-real/marketplace.e2e-real-spec.ts` — `crear una solicitud con datos inválidos (sin título, coordenadas fuera de rango, categoría inexistente) -> 400/404` |

### CP-BE-MKT-022 — Dos profesionales aceptan el mismo servicio en paralelo: 20/20 con un solo 2xx y un 409

| Campo | Contenido |
|---|---|
| ID | CP-BE-MKT-022 |
| Título | Dos profesionales aceptan el mismo servicio en paralelo: 20/20 con un solo 2xx y un 409 |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M4 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 4 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Crear servicio.<br>`Promise.all` de dos `accept` por proX y proY.<br>Repetir 20 veces. |
| Datos de prueba | 20 iteraciones |
| Resultado esperado | Cada iteración exactamente un 201 y un 409; el servicio queda ACCEPTED con el ganador. 20/20. |
| Automatizado en | `test/e2e-real/marketplace.e2e-real-spec.ts` — `dos profesionales aceptan el mismo servicio en paralelo: 20/20 con un solo 2xx y un 409` |

### CP-BE-MKT-023 — El mismo profesional acepta dos veces en paralelo: 20/20 con un solo 2xx y un 409

| Campo | Contenido |
|---|---|
| ID | CP-BE-MKT-023 |
| Título | El mismo profesional acepta dos veces en paralelo: 20/20 con un solo 2xx y un 409 |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M4 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 4 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | `Promise.all` de dos `accept` del mismo profesional; 20 iteraciones. |
| Datos de prueba | 20 iteraciones |
| Resultado esperado | Cada iteración 201 y 409. 20/20. |
| Automatizado en | `test/e2e-real/marketplace.e2e-real-spec.ts` — `el mismo profesional acepta dos veces en paralelo: 20/20 con un solo 2xx y un 409` |

### CP-BE-MKT-024 — El cliente acepta dos ofertas distintas en paralelo: 20/20 con un solo 200 y un 409, y una sola oferta ACCEPTED

| Campo | Contenido |
|---|---|
| ID | CP-BE-MKT-024 |
| Título | El cliente acepta dos ofertas distintas en paralelo: 20/20 con un solo 200 y un 409, y una sola oferta ACCEPTED |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M4 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 4 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Dos ofertas; `Promise.all` de dos respuestas ACCEPTED; 20 iteraciones. |
| Datos de prueba | 20 iteraciones |
| Resultado esperado | Cada iteración 200 y 409 y una sola oferta ACCEPTED. 20/20. |
| Automatizado en | `test/e2e-real/marketplace.e2e-real-spec.ts` — `el cliente acepta dos ofertas distintas en paralelo: 20/20 con un solo 200 y un 409, y una sola oferta ACCEPTED` |

### CP-BE-MKT-025 — Cliente_b no puede ver el detalle de un servicio de cliente_a (403/404) [DEF-BE-021: Corregido (5a38afb)]

| Campo | Contenido |
|---|---|
| ID | CP-BE-MKT-025 |
| Título | Cliente_b no puede ver el detalle de un servicio de cliente_a (403/404) [DEF-BE-021: Corregido (5a38afb)] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M4 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 4; DEF-BE-021 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | cliente_b `GET /services/:id` de un servicio PENDING y de uno ACCEPTED de cliente_a. |
| Datos de prueba | — |
| Resultado esperado | 403/404 en ambos (antes: 200 con dirección y coordenadas). |
| Automatizado en | `test/e2e-real/marketplace.e2e-real-spec.ts` — `DEF-BE-021: cliente_b no puede ver el detalle de un servicio de cliente_a (403/404)` |

### CP-BE-MKT-026 — Cliente_b no puede listar las ofertas de un servicio de cliente_a [DEF-BE-021: Corregido (5a38afb)]

| Campo | Contenido |
|---|---|
| ID | CP-BE-MKT-026 |
| Título | Cliente_b no puede listar las ofertas de un servicio de cliente_a [DEF-BE-021: Corregido (5a38afb)] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M4 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 4; DEF-BE-021 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | cliente_b `GET /services/:id/requests`. |
| Datos de prueba | — |
| Resultado esperado | 403/404 (antes: 200 con precios y mensajes). |
| Automatizado en | `test/e2e-real/marketplace.e2e-real-spec.ts` — `DEF-BE-021: cliente_b no puede listar las ofertas de un servicio de cliente_a` |

### CP-BE-MKT-027 — Cliente_b no puede editar, cancelar ni responder ofertas de un servicio de cliente_a; el servicio no cambia

| Campo | Contenido |
|---|---|
| ID | CP-BE-MKT-027 |
| Título | Cliente_b no puede editar, cancelar ni responder ofertas de un servicio de cliente_a; el servicio no cambia |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M4 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 4 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | cliente_b intenta PUT, DELETE y responder una oferta de cliente_a. |
| Datos de prueba | — |
| Resultado esperado | 403/404 y el servicio no cambia. |
| Automatizado en | `test/e2e-real/marketplace.e2e-real-spec.ts` — `cliente_b no puede editar, cancelar ni responder ofertas de un servicio de cliente_a; el servicio no cambia` |

### CP-BE-MKT-028 — My-services de cliente_b no incluye servicios de cliente_a

| Campo | Contenido |
|---|---|
| ID | CP-BE-MKT-028 |
| Título | My-services de cliente_b no incluye servicios de cliente_a |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M4 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 4 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | cliente_b consulta `my-services`. |
| Datos de prueba | — |
| Resultado esperado | No incluye servicios de cliente_a. |
| Automatizado en | `test/e2e-real/marketplace.e2e-real-spec.ts` — `my-services de cliente_b no incluye servicios de cliente_a` |

### CP-BE-MKT-029 — Un profesional no asignado no puede iniciar ni completar (403) y el estado no cambia

| Campo | Contenido |
|---|---|
| ID | CP-BE-MKT-029 |
| Título | Un profesional no asignado no puede iniciar ni completar (403) y el estado no cambia |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M4 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 4 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | proY intenta start y complete de un servicio de proX; los clientes intentan start. |
| Datos de prueba | — |
| Resultado esperado | 403 con envelope uniforme y el estado no cambia. |
| Automatizado en | `test/e2e-real/marketplace.e2e-real-spec.ts` — `un profesional no asignado no puede iniciar ni completar (403) y el estado no cambia` |

### CP-BE-MKT-030 — Un usuario sin perfil profesional no puede aceptar ni ofertar (403)

| Campo | Contenido |
|---|---|
| ID | CP-BE-MKT-030 |
| Título | Un usuario sin perfil profesional no puede aceptar ni ofertar (403) |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M4 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 4 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | cliente_b intenta accept y ofertar. |
| Datos de prueba | — |
| Resultado esperado | 403. |
| Automatizado en | `test/e2e-real/marketplace.e2e-real-spec.ts` — `un usuario sin perfil profesional no puede aceptar ni ofertar (403)` |

### CP-BE-MKT-031 — Un profesional PENDING o SUSPENDIDO no puede aceptar ni ofertar (403) [DEF-BE-022: Corregido (fce2887)]

| Campo | Contenido |
|---|---|
| ID | CP-BE-MKT-031 |
| Título | Un profesional PENDING o SUSPENDIDO no puede aceptar ni ofertar (403) [DEF-BE-022: Corregido (fce2887)] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M4 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 4; DEF-BE-022 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Un postulante PENDING y un suspendido intentan accept y ofertar. |
| Datos de prueba | — |
| Resultado esperado | 403 (antes: 201 y el servicio quedaba asignado a un no aprobado). |
| Automatizado en | `test/e2e-real/marketplace.e2e-real-spec.ts` — `DEF-BE-022: un profesional PENDING o SUSPENDIDO no puede aceptar ni ofertar (403)` |

### CP-BE-MKT-032 — GET /services (listado) no expone servicios ajenos a un cliente sin perfil profesional [DEF-BE-021: Corregido (5a38afb)]

| Campo | Contenido |
|---|---|
| ID | CP-BE-MKT-032 |
| Título | GET /services (listado) no expone servicios ajenos a un cliente sin perfil profesional [DEF-BE-021: Corregido (5a38afb)] |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M4 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 4; DEF-BE-021 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | cliente_b `GET /services?status=PENDING`. |
| Datos de prueba | — |
| Resultado esperado | 403 o sin servicios ajenos (antes: 200 con todos). |
| Automatizado en | `test/e2e-real/marketplace.e2e-real-spec.ts` — `DEF-BE-021: GET /services (listado) no expone servicios ajenos a un cliente sin perfil profesional` |

### CP-BE-MKT-033 — Un profesional ve los servicios PENDING del marketplace (listado) y admin ve todo

| Campo | Contenido |
|---|---|
| ID | CP-BE-MKT-033 |
| Título | Un profesional ve los servicios PENDING del marketplace (listado) y admin ve todo |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M4 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 4 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | proX y admin consultan el listado PENDING y el detalle. |
| Datos de prueba | — |
| Resultado esperado | 200 con el servicio presente. |
| Automatizado en | `test/e2e-real/marketplace.e2e-real-spec.ts` — `un profesional ve los servicios PENDING del marketplace (listado) y admin ve todo` |

### CP-BE-MKT-034 — El profesional que ofertó no puede responder su propia oferta (solo el cliente dueño)

| Campo | Contenido |
|---|---|
| ID | CP-BE-MKT-034 |
| Título | El profesional que ofertó no puede responder su propia oferta (solo el cliente dueño) |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M4 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 4 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | El profesional que ofertó intenta responder su oferta. |
| Datos de prueba | — |
| Resultado esperado | 403; el servicio sigue PENDING. |
| Automatizado en | `test/e2e-real/marketplace.e2e-real-spec.ts` — `el profesional que ofertó no puede responder su propia oferta (solo el cliente dueño)` |

### CP-BE-MKT-035 — El cliente no ve la posición exacta del profesional mientras el servicio está PENDING; el propio profesional y admin sí

| Campo | Contenido |
|---|---|
| ID | CP-BE-MKT-035 |
| Título | El cliente no ve la posición exacta del profesional mientras el servicio está PENDING; el propio profesional y admin sí |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M4 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 4 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Con una oferta sin aceptar: cliente, el propio profesional y admin piden `GET /locations/professional/:proId`. |
| Datos de prueba | cliente nuevo (aislado) |
| Resultado esperado | Cliente 403; profesional y admin 200. |
| Automatizado en | `test/e2e-real/marketplace.e2e-real-spec.ts` — `el cliente no ve la posición exacta del profesional mientras el servicio está PENDING; el propio profesional y admin sí` |

### CP-BE-MKT-036 — ACCEPTED e IN_PROGRESS autorizan al cliente del servicio; COMPLETED revoca; un tercero nunca

| Campo | Contenido |
|---|---|
| ID | CP-BE-MKT-036 |
| Título | ACCEPTED e IN_PROGRESS autorizan al cliente del servicio; COMPLETED revoca; un tercero nunca |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P0 |
| Trazabilidad | M4 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 4 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Aceptar, consultar; cliente_b consulta; iniciar, consultar; completar, consultar. |
| Datos de prueba | cliente nuevo y profesional dedicado |
| Resultado esperado | 200 con `latitude` correcta; cliente_b 403; 200 en IN_PROGRESS; 403 en COMPLETED. |
| Automatizado en | `test/e2e-real/marketplace.e2e-real-spec.ts` — `ACCEPTED e IN_PROGRESS autorizan al cliente del servicio; COMPLETED revoca; un tercero nunca` |

### CP-BE-MKT-037 — CANCELLED también revoca el acceso a la posición exacta

| Campo | Contenido |
|---|---|
| ID | CP-BE-MKT-037 |
| Título | CANCELLED también revoca el acceso a la posición exacta |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P1 |
| Trazabilidad | M4 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 4 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | Aceptar, consultar, cancelar, consultar. |
| Datos de prueba | — |
| Resultado esperado | 200 y luego 403. |
| Automatizado en | `test/e2e-real/marketplace.e2e-real-spec.ts` — `CANCELLED también revoca el acceso a la posición exacta` |

### CP-BE-MKT-038 — Sin JWT /locations/professional/:id -> 401

| Campo | Contenido |
|---|---|
| ID | CP-BE-MKT-038 |
| Título | Sin JWT /locations/professional/:id -> 401 |
| Tipo / Nivel | e2e real (stack docker-compose.e2e.yml) |
| Prioridad | P2 |
| Trazabilidad | M4 del plan maestro (§3); openspec/specs/e2e-test-plan.md Tier 4 |
| Precondiciones | Stack e2e arriba y sembrado (`pnpm e2e:up` + `pnpm e2e:seed`, o `pnpm qa:e2e`); Basic Auth web `tekoapp-web`. Fixtures admin y cliente_a. Los usuarios se crean por API con email único por corrida. |
| Pasos | `GET /locations/professional/:id` sin token. |
| Datos de prueba | — |
| Resultado esperado | 401. |
| Automatizado en | `test/e2e-real/marketplace.e2e-real-spec.ts` — `sin JWT /locations/professional/:id -> 401` |

## Estado de defectos (rama test/e2e-w2-onboarding-marketplace)

| DEF | Sev. | Casos | Estado |
|---|---|---|---|
| DEF-BE-019 | Medio | CP-BE-MKT-011, 012, 013, 015, 016, 019 | Corregido (ace979a): transiciones inválidas 400 -> 409 |
| DEF-BE-020 | Medio | CP-BE-MKT-017 | Corregido (8742cb6): una oferta ya respondida no se vuelve a responder (409) |
| DEF-BE-021 | Crítico | CP-BE-MKT-025, 026, 032 | Corregido (5a38afb): IDOR de lectura de servicios, ofertas y listados |
| DEF-BE-022 | Alto | CP-BE-MKT-031 | Corregido (fce2887): solo profesionales APPROVED y activos aceptan u ofertan |
