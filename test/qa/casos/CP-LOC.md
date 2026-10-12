# CP-LOC — Blindaje de /locations (Backend)

Aplica a REST `/locations/*` y al gateway WS. Todos son tests unitarios con mocks (sin infraestructura).

### CP-BE-LOC-001 — Exige JWT en todos los endpoints de /locations

| Campo | Contenido |
|---|---|
| ID | CP-BE-LOC-001 |
| Título | Exige JWT en todos los endpoints de /locations |
| Tipo / Nivel | unitaria |
| Prioridad | P1 |
| Trazabilidad | Blindaje de /locations (commit f9b53da); M8 del plan maestro (ubicación sin guard) |
| Precondiciones | Jest; el controller se instancia con servicio mockeado. |
| Pasos | 1. Leer la metadata `GUARDS_METADATA` de `LocationsController`.<br>2. Comprobar que incluye `JwtAuthGuard` a nivel de clase. |
| Datos de prueba | — |
| Resultado esperado | Todo endpoint del controller hereda `JwtAuthGuard` (sin token → 401 en runtime). |
| Automatizado en | `src/api/locations/controllers/locations.controller.spec.ts` — `JwtAuthGuard esta aplicado a nivel de clase (todos los endpoints exigen JWT)` |

### CP-BE-LOC-002 — Ofusca de forma determinista por profesional y día

| Campo | Contenido |
|---|---|
| ID | CP-BE-LOC-002 |
| Título | Ofusca de forma determinista por profesional y día |
| Tipo / Nivel | unitaria |
| Prioridad | P1 |
| Trazabilidad | Blindaje de /locations (commit f9b53da); M8 del plan maestro (ubicación sin guard) |
| Precondiciones | Función pura `obfuscateCoordinates`. |
| Pasos | 1. Ofuscar (lat,lng) del profesional 7 con secreto `s` a distintas horas del mismo día.<br>2. Mover la coordenada dentro de la misma celda y ofuscar.<br>3. Variar profesional, día y secreto. |
| Datos de prueba | LAT -25.286712, LNG -57.647031, día 2026-10-12 |
| Resultado esperado | Mismo pin en el mismo día aunque cambie la hora; mismo pin dentro de la misma celda (no promediable); cambia entre profesionales, días y secretos. |
| Automatizado en | `src/api/locations/helpers/location-obfuscation.helper.spec.ts` — `es determinista por profesional y dia (mismo resultado aunque cambie la hora)`; `no se puede promediar: movimientos dentro de la misma celda dan el mismo pin`; `cambia entre profesionales, dias y secretos` |

### CP-BE-LOC-003 — Acota el desplazamiento y nunca devuelve la coordenada exacta en nearby

| Campo | Contenido |
|---|---|
| ID | CP-BE-LOC-003 |
| Título | Acota el desplazamiento y nunca devuelve la coordenada exacta en nearby |
| Tipo / Nivel | unitaria |
| Prioridad | P1 |
| Trazabilidad | Blindaje de /locations (commit f9b53da); M8 del plan maestro (ubicación sin guard) |
| Precondiciones | Helper y `LocationsService` con repositorio mockeado. |
| Pasos | 1. Ofuscar y medir la distancia al punto real (haversine).<br>2. Llamar `findNearbyProfessionals` y revisar posición y distancia devueltas. |
| Datos de prueba | Mismos que CP-BE-LOC-002 |
| Resultado esperado | Desplazamiento < ~330 m y distinto del exacto; nearby entrega posición aproximada y distancia recalculada, nunca la exacta. |
| Automatizado en | `src/api/locations/helpers/location-obfuscation.helper.spec.ts` — `el desplazamiento esta acotado (< ~330 m) y nunca devuelve la coordenada exacta`; `src/api/locations/services/locations.service.spec.ts` — `debe devolver posición aproximada (nunca la exacta) y distancia recalculada` |

### CP-BE-LOC-004 — Permite coordenada exacta solo al propio profesional, a un admin o a un cliente con servicio activo

| Campo | Contenido |
|---|---|
| ID | CP-BE-LOC-004 |
| Título | Permite coordenada exacta solo al propio profesional, a un admin o a un cliente con servicio activo |
| Tipo / Nivel | unitaria |
| Prioridad | P1 |
| Trazabilidad | Blindaje de /locations (commit f9b53da); M8 del plan maestro (ubicación sin guard) |
| Precondiciones | Servicio con permisos y repositorios mockeados. |
| Pasos | 1. Pedir `canViewExactLocation` como el propio profesional.<br>2. Como admin con permisos conocidos (HTTP) y con consulta a DB (WS).<br>3. Como cliente con servicio activo con ese profesional.<br>4. Como otro profesional o cliente sin vínculo. |
| Datos de prueba | professionalId 7; permisos `['admin:all']` |
| Resultado esperado | Reglas (i) propio, (ii) admin, (iii) servicio activo → `true`; sin vínculo → `false`. |
| Automatizado en | `src/api/locations/services/locations.service.spec.ts` — `(i) permite al propio profesional`; `(ii) permite a un admin con permisos ya conocidos (HTTP)`; `(ii) consulta la DB por admin cuando no hay permisos conocidos (WS)`; `(iii) permite a un cliente con servicio activo con ese profesional`; `deniega a otro profesional o cliente sin vinculo` |

### CP-BE-LOC-005 — Responde 403 si no se cumple ninguna regla de coordenada exacta

| Campo | Contenido |
|---|---|
| ID | CP-BE-LOC-005 |
| Título | Responde 403 si no se cumple ninguna regla de coordenada exacta |
| Tipo / Nivel | unitaria |
| Prioridad | P1 |
| Trazabilidad | Blindaje de /locations (commit f9b53da); M8 del plan maestro (ubicación sin guard) |
| Precondiciones | Servicio y controller con mocks. |
| Pasos | 1. Llamar `assertCanViewExactLocation` sin vínculo.<br>2. Llamar `getProfessionalLocation` en el controller con requester no autorizado. |
| Datos de prueba | professionalId 7, permisos `[]` |
| Resultado esperado | `ForbiddenException` (403) y no se lee la coordenada exacta. |
| Automatizado en | `src/api/locations/services/locations.service.spec.ts` — `assert lanza ForbiddenException (403) si no cumple ninguna rama`; `src/api/locations/controllers/locations.controller.spec.ts` — `debe propagar el 403 y no leer la coordenada si el requester no esta autorizado` |

### CP-BE-LOC-006 — Subscribe hace join solo con la regla cumplida y exige WsJwtGuard

| Campo | Contenido |
|---|---|
| ID | CP-BE-LOC-006 |
| Título | Subscribe hace join solo con la regla cumplida y exige WsJwtGuard |
| Tipo / Nivel | unitaria |
| Prioridad | P1 |
| Trazabilidad | Blindaje de /locations (commit f9b53da); M8 del plan maestro (ubicación sin guard) |
| Precondiciones | Gateway con servicio y socket mockeados. |
| Pasos | 1. Suscribirse a `professionalId: '5'` con la regla cumplida.<br>2. Suscribirse sin cumplirla.<br>3. Suscribirse con id no numérico.<br>4. Leer la metadata de guards de subscribe y unsubscribe. |
| Datos de prueba | Usuario `user-ref-1`; ids `'5'` y `'abc'` |
| Resultado esperado | Con regla: `join('professional:5')` y `subscriptionConfirmed`; sin regla: `subscriptionError` y NO join; id inválido: sin consultar permisos ni join; ambos handlers con `WsJwtGuard`. |
| Automatizado en | `src/api/locations/gateway/locations.gateway.spec.ts` — `hace join y confirma cuando la regla de ubicacion exacta se cumple (propio/admin/servicio activo)`; `emite error y NO hace join si no cumple la regla`; `rechaza un professionalId no numerico sin consultar permisos`; `subscribe y unsubscribe tienen WsJwtGuard` |

### CP-BE-LOC-007 — Difunde locationUpdated aproximada al canal global y exactLocationUpdated solo a la sala

| Campo | Contenido |
|---|---|
| ID | CP-BE-LOC-007 |
| Título | Difunde locationUpdated aproximada al canal global y exactLocationUpdated solo a la sala |
| Tipo / Nivel | unitaria |
| Prioridad | P1 |
| Trazabilidad | Blindaje de /locations (commit f9b53da); M8 del plan maestro (ubicación sin guard) |
| Precondiciones | Gateway con servicio mockeado; socket con `professionalId` resuelto en la conexión. |
| Pasos | 1. Emitir `updateLocation` con un professionalId distinto en el payload.<br>2. Repetir con el profesional fuera de línea.<br>3. Repetir con un socket sin professionalId resuelto. |
| Datos de prueba | Profesional 42; exacta (-25.3,-57.6), aproximada (-25.31,-57.61) |
| Resultado esperado | Se usa el id de la conexión; el canal global `locationUpdated` lleva solo la aproximada; la sala del profesional recibe `exactLocationUpdated`; offline no difunde globalmente; sin id propio → `success:false`. |
| Automatizado en | `src/api/locations/gateway/locations.gateway.spec.ts` — `nunca confía en un professionalId mandado por el cliente — usa el resuelto en la conexión`; `no difunde por el canal global si el profesional no esta en linea`; `debe rechazar la actualización si el socket no resolvió un professionalId propio` |

