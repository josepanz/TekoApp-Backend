# Spec: Política de versionado y compatibilidad de API (I-04)

Origen: `openspec/changes/platform-hardening-2026-09/WORKPLAN.md` §5, I-04. Entregable de esta
tarea: **spec, no implementación** — la migración real de controllers queda como trabajo futuro
coordinado entre los 3 repos (ver "Plan de rollout").

## Por qué existe esta spec

`app.enableVersioning()` (`src/main.ts:13`) está activo desde hace tiempo, pero sin política:
cada controller decide por su cuenta si lleva `@Version('1')` o no, sin ninguna regla escrita que
diga cuándo corresponde una cosa u otra. El resultado, verificado el 2026-09-06 contra
`src/api/**/*.controller.ts` (37 controllers reales, sin contar `.spec.ts`):

| Estado | Cantidad | Controllers |
|---|---|---|
| Versionados (`@Version('1')`, viven solo bajo `/v1/...`) | 6 | `auth-api`, `onboarding`, `roles-api`, `users-roles-api`, `uploads`, `users` |
| Sin versionar (viven en la raíz, sin `/v1`) | 31 | el resto — `professionals`, `services`, `locations`, `payments`, `ratings`, `promotions`, `notifications`, `contracts` (3 controllers), `budgets`, `service-progress`, `professional-documents` (2), `professional-document-types`, `professional-portfolio` (2), `legal-consents` (2), `ai-disclosures` (2), `categories`, `countries`, `currencies`, `languages`, `material-catalog`, `tax-config`, `tips` (2), `tracking`, `analytics`, `service-types` |

**Esto ya rompió producción una vez**: `TekoApp-Frontend-Mobile`, WORKPLAN `platform-hardening-2026-09`
M-07 — cada repositorio Dart hardcodea el path a mano, algunos con `/v1` y otros sin él, sin ninguna
fuente de verdad. Un fix parcial (commit `c653576`, solo `auth`/`onboarding`) dejó el resto
(`uploads`, `roles`, `users`) rotos hasta que se detecte a mano. La causa raíz no es un typo: es que
**no hay ninguna regla que diga qué debe versionarse**, así que cada desarrollador (o agente) adivina.

`TekoApp-Frontend-Web` no tiene el mismo problema hoy porque no hardcodea paths por call-site: un
único mapa centralizado (`TekoApp-Frontend-Web/src/core/api-client/backend-paths.ts`, `V1_DOMAINS`)
decide el prefijo por dominio, y el propio archivo ya documenta el problema:

> "TekoApp-Backend tiene versionado de rutas inconsistente: `app.enableVersioning()` sin
> `defaultVersion` en main.ts hace que SOLO los controllers con `@Version('1')` vivan bajo
> `/api/v1/*`; el resto vive en `/api/*` sin versión."

O sea: el propio consumidor ya diagnosticó el problema que esta spec tiene que resolver.

## Qué es un cambio breaking (y qué no)

**Breaking** (exige una versión nueva o coordinación explícita con ambos frontends antes de mergear):

- Remover un campo de una respuesta, o renombrarlo.
- Cambiar el tipo de un campo existente (ej. de `string` a un enum con valores distintos a los que
  ya viajaban — ver la lección de T-02: `verificationStatus` pasó de texto libre a
  `VerificationStatus`; los valores cambiaron de minúscula a MAYÚSCULA, así que un cliente que
  comparaba contra `'verified'` a mano se habría roto en silencio).
- Agregar un campo **requerido** a un DTO de **request** (un cliente viejo que no lo manda hoy
  empieza a fallar).
- Cambiar el código de estado HTTP de éxito o de error de un endpoint existente.
- Cambiar la forma de paginación, el nombre de una ruta, o el método HTTP de un endpoint.
- Remover un endpoint que algún cliente todavía consume.

**No breaking** (no requiere nada especial, se mergea directo):

- Agregar un campo **nuevo y opcional** a una respuesta (un cliente viejo lo ignora).
- Agregar un endpoint nuevo.
- Agregar un valor nuevo a un enum de **respuesta**, siempre que el cliente ya maneje el caso
  "valor desconocido" con un default razonable (si no lo maneja, agregarlo es breaking para ESE
  cliente — hay que confirmarlo, no asumirlo).
- Relajar una validación de request (aceptar más casos que antes).

**Política de campos**: un campo nuevo en una respuesta siempre nace opcional/nullable — nunca
asumas que un frontend ya lo lee, aunque el cambio se haga "para" ese frontend. Un campo se puede
remover recién después de que ningún cliente activo lo consuma, verificado (grep en
`TekoApp-Frontend-Web/src` y `TekoApp-Frontend-Mobile/lib`, mismo patrón que ya usa D-03 de este
WORKPLAN) — no hay un número de versiones de gracia fijo hoy porque no hay telemetría de qué
versión de Mobile está instalada en qué dispositivo (ver limitación en "Fuera de alcance").

## Decisión: versionar por default, no por decorador explícito

**No** se recomienda seguir agregando `@Version('1')` controller por controller — ese es
exactamente el patrón que produjo el estado actual (alguien lo agrega, alguien se olvida, y nadie
se entera hasta que un cliente pega 404). La causa raíz es que versionar hoy es **opt-in por
decorador**, así que un controller nuevo nace sin versión salvo que quien lo escriba se acuerde.

**Cambio recomendado en `src/main.ts`**:

```typescript
app.enableVersioning({
  type: VersioningType.URI,
  defaultVersion: '1',
});
```

Con `defaultVersion: '1'`, **todo controller que no declare `@Version()` explícito pasa a vivir
bajo `/v1/` automáticamente**, sin tocar los 31 controllers uno por uno. Esto:

1. Elimina la clase de bug de M-07 de raíz: no hay forma de que un controller nuevo "se olvide" de
   versionar, porque versionar deja de ser una acción manual.
2. Dado que la app YA está en v1 de hecho (nunca se publicó una v2), este cambio no debería alterar
   el comportamiento semántico de ningún endpoint — solo unifica el path bajo el que responde.
3. Permite borrar la complejidad que cada frontend tuvo que inventar para compensar la
   inconsistencia: `V1_DOMAINS`/`resolveBackendPath` en Web, y el prefijo hardcodeado por
   call-site en Mobile (ver M-07) — ambos se vuelven innecesarios si TODO vive bajo `/v1`.

**Excepción explícita**: si en el futuro un endpoint necesita ser deliberadamente "sin versión"
(ej. un healthcheck consumido por infraestructura externa que no debe romperse nunca por un cambio
de versión), se marca con `@Version(VersioningType.VERSION_NEUTRAL)` en ESE controller puntual —
`src/modules/health/health.controller.ts` es candidato a evaluar para este caso, pero **no se
decide acá**: es una decisión de infraestructura (¿algo externo pega al healthcheck sin pasar por
`/v1`?) que excede el alcance de esta spec.

## Qué controllers deben versionarse (respuesta explícita)

**Los 37, sin excepción salvo la de arriba** — incluidos los 6 que ya lo están hoy (siguen
declarando `@Version('1')` explícito, no hace falta tocarlos) y los 31 de la tabla de arriba, que
lo heredan automáticamente del `defaultVersion` sin necesitar el decorador. No hay un criterio de
"este dominio no lo necesita": la lección de M-07 es que la inconsistencia en sí es el bug, no
qué dominio específico quedó afuera.

## Plan de rollout (coordinado, fuera del alcance de código de esta spec)

Este cambio es **breaking el día que se aplica** para cualquier cliente que hoy pega a uno de los
31 endpoints sin `/v1` — pasan a responder 404 en la raíz hasta que el cliente actualice. Por eso
la implementación (no esta spec) tiene que coordinar, en este orden:

1. **Backend**: aplicar `defaultVersion: '1'`, correr la suite completa (los tests e2e/de
   integración que pegan a rutas reales deben actualizarse para esperar `/v1`).
2. **Web**: eliminar `V1_DOMAINS`/`resolveBackendPath` (o dejarlo como no-op que siempre devuelve
   `v1/`) — Web es BFF server-to-server, se puede desplegar en el mismo release que el backend sin
   depender de que un usuario actualice una app instalada.
3. **Mobile**: a diferencia de Web, una app instalada en un teléfono no se actualiza sola. El
   cambio en Mobile (agregar `/v1` a todos los call-sites que hoy no lo llevan) tiene que
   **desplegarse ANTES o en el mismo momento** que el backend corta el acceso sin versión — si el
   backend corta primero, cualquier instalación de Mobile en el campo que no haya actualizado
   queda rota. Evaluar, al implementar, si el backend puede sostener temporalmente AMBAS rutas
   (con y sin `/v1`) durante una ventana de transición — technically posible sirviendo el mismo
   controller vía `@Version(VERSION_NEUTRAL)` combinado con un middleware que reescriba el path, pero
   **no se diseña acá**: es una decisión de la implementación real, con los números reales de
   versión mínima instalada en el campo (que hoy no se miden, ver limitación abajo).

## El chequeo de versión de Mobile (`lib/core/update/`) — qué es y qué NO es hoy

El WORKPLAN original de esta tarea asume que Mobile ya tiene "el chequeo de versión mínima... para
forzar actualización cuando el backend rompa compatibilidad". **Verificado contra
`TekoApp-Frontend-Mobile/openspec/specs/app-version-update.md`: eso no es exacto.** Lo que existe
hoy es:

- Un chequeo **opcional** de "hay una versión más nueva" contra los GitHub Releases públicos del
  repo Mobile (no contra el backend), con un modal que el usuario puede **cancelar** y seguir
  usando la versión vieja indefinidamente.
- La propia spec de Mobile dice explícitamente, en su sección "Fuera de alcance": **"versión
  mínima soportada forzada desde el backend (feature distinta, si se pide)"** — o sea, hoy no
  existe ningún mecanismo que bloquee el uso de una versión vieja de la app.

**Lo que SÍ deja preparado ese documento** (para cuando se necesite forzar upgrade de verdad, ej.
el día que el rollout de arriba corte compatibilidad): la misma spec de Mobile apunta a que un
futuro "control remoto de versión mínima" se resolvería con un endpoint propio de `APP_CONFIG` del
backend — **mismo mecanismo que ya existe hoy para `aiDisclosure.userDeclarableTypes`**
(`src/api/ai-disclosures/services/ai-disclosures.service.ts`), no una feature nueva desde cero.
Implementar ESE endpoint es trabajo futuro, no de esta spec — se deja anotado acá porque es la
pieza que le falta a esta política para tener un mecanismo de enforcement real en vez de solo una
convención de nombres de ruta.

## Fuera de alcance de esta spec

- La migración real de `src/main.ts` y de los 31 controllers (es la implementación futura descrita
  en "Plan de rollout").
- El endpoint de versión mínima forzada vía `APP_CONFIG` (mencionado como la pieza que falta, no
  diseñado acá).
- Telemetría de qué versión de Mobile está instalada en el campo — sin ese dato, cualquier
  "ventana de gracia en N versiones" es una cifra inventada, no una decisión basada en datos.
- Versionado semántico completo (`v2`, negociación de contenido, etc.) — la API nunca salió de v1
  todavía; esta spec resuelve la consistencia de v1, no el diseño de una v2 futura.

## Riesgos / límites explícitos

- Mientras el rollout de arriba no se ejecute, el estado inconsistente sigue vivo y **puede volver
  a romper Mobile** cada vez que se agregue un controller nuevo sin decidir a mano si necesita
  `@Version('1')` — el `defaultVersion` global es la única forma de que esto deje de depender de
  que alguien se acuerde.
- El corte de compatibilidad para Mobile es real y no reversible por versión: un teléfono con la
  app vieja instalada y sin internet para actualizar queda con la app rota hasta que actualice. No
  hay forma de evitarlo del todo sin telemetría de adopción real (ver "Fuera de alcance").
