# WORKPLAN — Endurecimiento de plataforma, tajada Backend (`platform-hardening-2026-09`)

> **Auditoría y especificación**: Opus 5 (2026-09-04), sobre la rama `audit/2026-09-04`,
> partiendo de `develop` en `70ecde5`.
> **Ejecución**: Sonnet, workflow por workflow, en el orden de este archivo.
>
> Este archivo es autocontenido: no hace falta leer la conversación que lo originó ni la
> auditoría transversal. Todo lo que el modelo ejecutor necesita (contexto, causa raíz,
> cambio, tests, criterios de aceptación, comandos de verificación y mensaje de commit) está
> acá.
>
> Auditoría transversal completa (contexto, no requerido para ejecutar):
> `openspec/specs/platform-audit-2026-09.md`.

---

## 0. Cómo usar este archivo

- **Un workflow = una sesión de trabajo.** No mezclar workflows en un mismo commit.
- Cada tarea tiene un ID (`D-01`, `H-02`, …). Al terminarla, marcá su casilla en la tabla del
  §7 y escribí en la misma línea el hash del commit.
- **Antes de cambiar código, ejecutá la "Verificación previa" de la tarea.** Los números de
  línea son del estado de la rama al 2026-09-04 y pueden correrse. Si la verificación previa
  NO reproduce el problema, **no toques nada**: anotalo en §7 como "no reproduce" con lo que
  encontraste, y seguí con la siguiente.
- Los hallazgos marcados **[VERIFICADO A MANO]** los confirmé abriendo el archivo yo mismo.
  Los demás vienen de auditoría delegada y por eso traen verificación previa obligatoria.
- **Este repo ya tiene historia de backlogs que envejecieron mal.** `.claude/rules/database-conventions.md`
  lo dice explícitamente sobre sí mismo, y esta auditoría lo confirmó dos veces más (ver §2,
  "descartados"). Verificá siempre antes de accionar.

---

## 0.1 Protocolo de ejecución y checkpoints

### Dónde para

**Una tarea = un checkpoint.** Al terminar cada tarea:

1. Corré la Definition of Done completa del §1.2.
2. Commiteá con el mensaje indicado en la tarea (uno por tarea, nunca agrupados).
3. Marcá la casilla en la tabla del §7 con el hash.
4. **Pará y reportá.** No sigas con la siguiente por iniciativa propia.

El reporte son 4 líneas: qué reproducía el problema antes, qué cambiaste, cuántos tests hay
ahora y si algo quedó raro.

**Excepción**: si una tarea "no reproduce", anotala en §7 y seguí sin esperar.

### Cómo se le pide (prompts para copiar y pegar)

**Una sola tarea:**

```
Leé openspec/changes/platform-hardening-2026-09/WORKPLAN.md, secciones §0.1, §1 y la de la
tarea <ID>. Ejecutá SOLO la tarea <ID>.

Reglas:
- Hacé primero la "Verificación previa obligatoria". Si el problema no reproduce, no toques
  código: anotalo en §7 y decímelo.
- No re-audites el proyecto ni busques otros bugs: el análisis ya está hecho en el archivo.
- No lances subagentes. La tarea ya tiene los archivos y las líneas: leé esos.
- No leas openspec/decisions.md completo (>1500 líneas) ni GRAPH_REPORT.md: grep a la sección
  puntual.
- Al terminar: DoD del §1.2, commit con el mensaje de la tarea, casilla marcada en §7, y pará.
```

**Varias tareas sueltas:**

```
Leé openspec/changes/platform-hardening-2026-09/WORKPLAN.md, secciones §0.1, §1 y las de las
tareas <ID>, <ID> y <ID>. Ejecutá esas tareas en ese orden, parando y reportando entre cada
una. Mismas reglas que arriba.
```

**Un workflow entero:**

```
Leé openspec/changes/platform-hardening-2026-09/WORKPLAN.md, secciones §0.1, §1 y el
WORKFLOW <N> completo. Ejecutá todas sus tareas en el orden en que aparecen, parando y
reportando después de cada una. Mismas reglas.
```

Los workflows de este archivo: **1** = performance y resiliencia (§3) · **2** = observabilidad
y seguridad de pipeline (§4) · **3** = specs de sostenibilidad (§5) · **4** = deuda de diseño
(§6).

### Economía de tokens (importante)

- **Una sesión nueva por workflow.** El contexto que generó este archivo no aporta a la
  ejecución y se paga en cada mensaje.
- **Sin subagentes.** El archivo ya trae archivo, línea, causa raíz y trampas.
- **`openspec/decisions.md` supera las 1500 líneas** y `graphify-out/GRAPH_REPORT.md` es aún
  más grande. Leerlos enteros por costumbre es el gasto más grande y más evitable de este
  repo. Grep a la sección puntual, o `graphify query "<pregunta>"` si necesitás relaciones.
- El commit por tarea permite tirar el contexto y arrancar limpio: el estado vive en git y en
  la tabla del §7.

---

## 1. Contexto del proyecto (lo mínimo indispensable)

`TekoApp-Backend` es la API NestJS de TekoApp, un marketplace paraguayo que conecta clientes
que piden servicios del hogar/profesionales con los profesionales que los prestan. Un mismo
usuario opera como cliente o profesional con la misma cuenta; el "modo" se deriva de si existe
un `Professionals` vinculado, no de un rol formal.

**Dos clientes consumen esta API**: `TekoApp-Frontend-Web` (Next.js, actúa como BFF — el
browser nunca habla directo con esta API) y `TekoApp-Frontend-Mobile` (Flutter, habla directo).

Arquitectura en dos capas, estricta:
`src/api/<dominio>/` (HTTP: controllers + DTOs + services orquestadores) →
`src/modules/<dominio>-db/` (Prisma, reusable). **`api/*` nunca toca Prisma directo.**

Infra: PostgreSQL (Prisma, con triggers de auditoría), MongoDB (notificaciones, tracking
histórico), Redis (colas Bull, nonces de login), S3, Firebase (push), logging estructurado con
`nestjs-pino` + Seq.

Estado al momento de esta auditoría: rama `audit/2026-09-04` sobre `develop` en `70ecde5`,
**112 suites / 1286 tests en verde**, fases 0001–0014 documentadas.

**Contexto de pagos que importa para varias tareas**: el flujo de pago es **interno/simulado**.
`stripe` está en `package.json` pero **no se importa en ningún archivo de `src/`**. La pasarela
real definida es **Dinelco Checkout (BEPSA)**, todavía no integrada — ver
`openspec/changes/0014-dinelco-checkout-integration.md`.

### 1.1 Convenciones NO negociables

1. **Los commits NUNCA llevan `Co-Authored-By`, ni referencia a Claude, a un modelo o a IA.**
   Autoría exclusiva de `josepanz`.
2. **Conventional Commits en español**, porque semantic-release lee los prefijos.
3. **Nunca commitear directo a `develop`/`qa`/`master`.** Todo va en `audit/2026-09-04`.
4. **`api/*` nunca llama `PrismaDatasource` directo** — siempre a través del módulo `-db`.
5. **Siempre `prisma.extended.*`**, nunca `prisma.<model>` pelado: los triggers de auditoría
   dependen de las GUC de sesión que setea `extended`.
6. **Transiciones de estado con `updateMany` condicional** (`where: { id, status: { in: [...] } }`)
   + chequeo de `count === 0` → `ConflictException`. Nunca `findUnique` + validar + `update`.
7. **DTOs explícitos** de request y response, con class-validator + Swagger. Nunca `any`.
8. **Toda tabla de negocio nueva**: `id` Int autoincrement + `referenceId` UUID único + columnas
   de auditoría, y la migración termina con `SELECT fn_attach_audit_triggers();`.
9. **Un listado vacío es 200 con `data: []`, nunca 404.**
10. Config solo por `core/config` — nunca `process.env` fuera de ahí.
11. Tests: mocks como `const` a nivel de módulo (nunca inline en `useValue`, dispara
    `unbound-method`), AAA, nombres en español describiendo comportamiento.

### 1.2 Definition of Done global (aplica a TODA tarea)

```bash
cd C:\workspace\TekoApp-Backend
pnpm run lint      # 0 errores, 0 warnings
pnpm run format    # sin cambios pendientes
pnpm run test      # 112+ suites / 1286+ tests, TODOS en verde
pnpm run build     # compila
```

Para cualquier tarea que toque Prisma/migraciones, además:

```bash
# La conexión de la app usa el pooler (6543, pgbouncer) que ROMPE prisma migrate.
# Para migrar hay que usar la conexión DIRECTA (5432, session mode):
DATABASE_URL="<misma URL con :5432 en vez de :6543>" npx prisma migrate status
DATABASE_URL="<...:5432...>" npx prisma migrate deploy
```

> **La base de Supabase es COMPARTIDA.** No apliques una migración sin pedir autorización
> explícita primero. `prisma migrate status` debe quedar limpio antes y después.

Si un test existente se rompe: **no lo ajustes para que pase.** Entendé por qué primero.

---

## 2. Inventario de hallazgos

| ID | Sev | Área | Síntoma en una línea |
|---|---|---|---|
| ~~A-01~~ | ~~CRÍTICO~~ | ~~pagos~~ | ~~Webhook permitía alterar pagos con solo tener sesión~~ — **CERRADA**, commit `6979aee` |
| D-01 | ALTO | performance | La búsqueda de profesionales cercanos hace Haversine sobre toda la tabla |
| D-02 | ALTO | seguridad | El límite anti-fuerza-bruta de login existe y nunca se aplica |
| D-03 | MEDIO | contrato | La API publica un campo de pago que siempre viaja `null` |
| H-01 | ALTO | observabilidad | Una excepción no controlada no genera ninguna alerta |
| H-02 | ALTO | CI/CD | El pipeline no tiene etapa de escaneo de seguridad |
| H-03 | MEDIO | observabilidad | Un rechazo por rate limit (429) no deja ninguna línea en el log |
| I-01 | CRÍTICO | legal | No existe borrado de cuenta (bloquea publicar Mobile) |
| I-02 | ALTO | negocio | No hay forma de pagarle al profesional: el ciclo no cierra |
| I-03 | MEDIO | negocio | Hay reembolsos pero ningún registro de disputa que los justifique |
| I-04 | MEDIO | contrato | Un DTO breaking rompe Web y Mobile a la vez, sin versionado |
| T-01 | MEDIO | tests | Los módulos más nuevos son los de cobertura más fina |
| T-02 | BAJO | diseño | Tres señales de verificación conviviendo en `Professionals` |
| T-03 | BAJO | claridad | `locations-db` vs `tracking-db` no explican la división, y hay un typo |
| T-04 | ALTO | datos | El seed no siembra los catálogos que bloquean flujos enteros de la app |

**Descartados explícitamente (auditados y NO son bugs — no los "arregles"):**

- **El `healthcheck` está bien.** `src/modules/health/health.controller.ts` ya cubre Postgres,
  Mongo, Redis, heap y disco. Mejor que lo típico para esta etapa. No lo toques.
- **Los reembolsos YA son TOCTOU-safe.** `payment-db.service.ts` usa `SELECT ... FOR UPDATE` y
  lleva el acumulado de reembolsos parciales. Verificado. No lo "arregles".
- **Las transiciones de estado de servicios/pagos/promociones YA usan el patrón condicional.**
  Un backlog viejo de 2026-07-21 decía lo contrario; se re-auditó y está resuelto.
- **`fn_audit_generic_trigger()` no pisa `created_at`/`last_changed_at`** si el caller los setea:
  ya tiene el guard. Backlog viejo, ya corregido.
- **El guard de `verify`/`suspend` y el anonimato de ratings YA están corregidos** (commits
  `d6c0548` y `ba06dc4`, ambos ancestros de `develop`). No los re-reportes.
- **No hay `NotFoundException` en listados vacíos** en ningún endpoint real — se auditó todo
  `src/api/**/services/*.ts`. El anti-patrón solo estaba en un ejemplo de la documentación.

---

## 3. WORKFLOW 1 — Performance y resiliencia

**Objetivo**: que la consulta más caliente de la plataforma no se degrade bajo carga, y que los
límites de tasa que ya están escritos efectivamente protejan algo.

---

### D-01 · ALTO · `findNearby` hace Haversine sobre toda la tabla sin índice de apoyo

**[VERIFICADO A MANO]** (query completa leída; índices confirmados en `schema.prisma:412-413`)

**Archivos**: `src/modules/locations-db/services/locations-db.service.ts` (~75-105,
`findNearby`), `prisma/schema.prisma` (modelo `Professionals`, índices en 412-413).

**Síntoma**: la búsqueda de profesionales cercanos — el endpoint que alimenta el mapa y el
match de servicios, o sea la consulta más caliente del producto — calcula funciones
trigonométricas sobre **cada fila** de `professionals` antes de poder descartar nada por radio.
Hoy no se nota con pocos profesionales; es el primer lugar que se va a caer al escalar.

**Causa raíz**: es un `$queryRaw` con Haversine en el `SELECT` y otra vez en el `HAVING`:

```sql
SELECT *, (6371 * acos(...)) AS distance
FROM professionals
WHERE current_latitude IS NOT NULL
  AND current_longitude IS NOT NULL
  AND status = 'approved'
  AND verification_status = 'verified'
  ${categoryFilter} ${availableFilter} ${onlineFilter}
GROUP BY id
HAVING (6371 * acos(...)) <= ${radius}
ORDER BY distance ASC, average_rating DESC
LIMIT ${limit}
```

Los únicos índices de `Professionals` son `@@index([status])` y `@@index([isAvailable])`, ambos
de **columna simple**: no cubren el patrón real del `WHERE`, que combina 4-6 predicados.

Tres detalles que la auditoría delegada no vio y que importan para el fix:

1. El `WHERE` filtra por **`verification_status = 'verified'`**, que es el campo `String
   @db.VarChar(20)` de texto libre — el mismo que T-02 marca como deuda de diseño. Cualquier
   índice que armes va a depender de esa columna sin tipar.
2. El `GROUP BY id` es **redundante** (`id` es PK, no hay agregación real). Sacarlo no cambia
   el resultado y le ahorra trabajo al planner.
3. Los predicados `IS NOT NULL` sobre lat/long hacen de esto un candidato claro a **índice
   parcial**, que además queda mucho más chico.

**Verificación previa obligatoria** — medí antes de tocar:

```sql
EXPLAIN ANALYZE
SELECT *, (6371 * acos(cos(radians(-25.28)) * cos(radians(current_latitude)) *
  cos(radians(current_longitude) - radians(-57.63)) +
  sin(radians(-25.28)) * sin(radians(current_latitude)))) AS distance
FROM professionals
WHERE current_latitude IS NOT NULL AND current_longitude IS NOT NULL
  AND status = 'approved' AND verification_status = 'verified'
ORDER BY distance ASC LIMIT 20;
```

Guardá el plan y el tiempo. **Sin esta medición previa no hay forma de justificar el índice** —
y la regla del repo es explícita: todo umbral/optimización se justifica con un número medido.

**Cambio**:

1. Sacá el `GROUP BY id` redundante.
2. Agregá un índice parcial compuesto que cubra el `WHERE` real. Punto de partida a evaluar:
   ```prisma
   @@index([status, verificationStatus, isAvailable, isOnline, categoryId])
   ```
   con la variante parcial en SQL crudo dentro de la migración:
   ```sql
   CREATE INDEX CONCURRENTLY IF NOT EXISTS professionals_nearby_idx
     ON professionals (status, verification_status, is_available, is_online, category_id)
     WHERE current_latitude IS NOT NULL AND current_longitude IS NOT NULL;
   ```
3. Volvé a correr el `EXPLAIN ANALYZE` y **compará**. Si el plan no mejora, el índice está mal
   elegido: probá otro orden de columnas, no lo dejes "por si acaso".
4. La migración termina con `SELECT fn_attach_audit_triggers();` como toda migración de este
   repo.

**Alternativa a evaluar y descartar explícitamente en el commit**: `earthdistance`/PostGIS con
índice GiST es la solución correcta a escala real, pero agrega una extensión de Postgres a la
que Supabase puede poner condiciones. Si la descartás, escribí por qué.

**Criterios de aceptación**: `EXPLAIN ANALYZE` antes y después pegados en el mensaje de commit
o en `decisions.md`, con mejora demostrable; suite en verde; `prisma migrate status` limpio.

**Commit**: `perf(locations): indexar el patron real de busqueda de profesionales cercanos`

---

### D-02 · ALTO · El límite anti-fuerza-bruta de login nunca se aplica

**[VERIFICADO A MANO]** (`middleware.config.ts:52-53` aplica solo `general`; los 5 limiters
confirmados en `rate-limit.config.ts`)

**Archivos**: `src/core/config/middleware.config.ts` (~52-53),
`src/core/config/rate-limit.config.ts` (~34-125).

**Síntoma**: el endpoint de login acepta hasta 100 intentos cada 15 minutos por IP — el límite
genérico de toda la API — en vez de los 5 que el propio código define para autenticación. Lo
mismo para pagos: 100/15min en vez de 20/hora.

**Causa raíz**: `RateLimitConfig.createLimiter()` construye **cinco** limitadores:

| Limitador | Ventana | Máx | ¿Se aplica hoy? |
|---|---|---|---|
| `general` | 15 min | 100 | **Sí** |
| `auth` | 15 min | 5 | **No — código muerto** |
| `upload` | 1 hora | 10 | **No** |
| `payment` | 1 hora | 20 | **No** |
| `search` | 1 min | 30 | **No** |

y `middleware.config.ts` hace únicamente:

```typescript
const limiters = RateLimitConfig.createLimiter(configService);
app.use(limiters.general);
```

Los otros cuatro se construyen y se descartan. No es que falte diseñarlos: están escritos,
configurados y sin usar.

**Verificación previa obligatoria**:

```bash
grep -n "limiters\." src/core/config/middleware.config.ts   # hoy: solo limiters.general
grep -rn "authLimiter\|paymentLimiter\|uploadLimiter\|searchLimiter" src/ --include=*.ts
# hoy: solo su definición en rate-limit.config.ts, ningún consumidor
```

**Cambio**: aplicar cada limitador a sus rutas. Dos caminos:

- **(A)** `MiddlewareConsumer.forRoutes(...)` en `AppModule` — es la forma idiomática de Nest y
  permite expresar rutas por controller/método.
- **(B)** `app.use('<path>', limiters.auth)` en `middleware.config.ts`, junto al general.

Preferí **(A)**: `middleware.config.ts` no conoce las rutas de los dominios y hacerle conocerlas
lo acopla a toda la API.

Mapeo mínimo: `auth` → `auth/login`, `auth/nonce`, `auth/refresh-token`, recuperación de
contraseña · `payment` → el árbol de `payments/*` que muta · `upload` → `uploads/*` y los
endpoints multipart de documentos/portafolio · `search` → los listados con filtros más pesados,
empezando por `locations/nearby`.

**Trampa**: el orden importa. El limitador general ya está aplicado globalmente; agregar uno más
específico **suma**, no reemplaza. Verificá que un login no consuma dos cupos distintos de forma
que el comportamiento resultante sea más estricto de lo que pensás.

**Tests**: e2e o de integración por limitador cableado — el intento número 6 de login dentro de
la ventana devuelve 429; el 5 todavía pasa. Si el repo no tiene infraestructura de test para
middleware, al menos un test unitario de que `forRoutes` recibe las rutas esperadas.

**Commit**: `fix(seguridad): aplicar los limitadores de tasa de auth, pagos, uploads y busqueda`

---

### D-03 · MEDIO · La API publica un campo de pago que siempre viaja `null`

**[VERIFICADO A MANO]** (`professionalNetAmount` aparece en `src/` **solo** en el DTO de
respuesta; ninguna escritura en todo el repo)

**Archivos**: `src/api/payments/dtos/response/payment-detail.response.dto.ts` (~95).

**Síntoma**: `GET /payments/:id` devuelve `professionalNetAmount` en cada respuesta, siempre
`null`. Cualquiera de los dos frontends podría razonablemente construir una pantalla de
liquidación sobre ese campo y descubrir en producción que nunca tiene valor.

**Causa raíz**: la columna existe en el schema y el campo existe en el DTO, pero **ningún
servicio lo escribe nunca**. Es el vestigio de un flujo de payout que no existe (ver I-02).

**Verificación previa obligatoria**:

```bash
grep -rn "professionalNetAmount" src/
# esperado hoy: 1 sola línea, la del DTO de respuesta
```

Si aparece alguna escritura, **no reproduce**: alguien lo implementó, anotalo y seguí.

**Cambio** — **esta decisión NO la tomes solo, preguntale a José.** Las dos opciones son
razonables y llevan a lugares distintos:

- **(a) Quitarlo del DTO** hasta que exista el flujo de payout. Deja la API honesta: no promete
  lo que no cumple. Es un cambio de contrato — hay que verificar que ningún cliente lo lea
  (grepear `professionalNetAmount` en `TekoApp-Frontend-Web/src` y `TekoApp-Frontend-Mobile/lib`;
  al 2026-09-04 Mobile no lo mapea).
- **(b) Calcularlo ya** (monto − comisión de plataforma − IVA) aunque todavía no haya
  transferencia. Deja el dato disponible para la contabilidad y adelanta trabajo de I-02, pero
  hay que definir si se persiste o se calcula al vuelo, y qué pasa con reembolsos parciales.

**Commit** (según la opción): `fix(payments): dejar de exponer professionalNetAmount hasta que exista payout`
o `feat(payments): calcular el neto del profesional sobre comision e impuesto`

---

## 4. WORKFLOW 2 — Observabilidad y seguridad de pipeline

---

### H-01 · ALTO · Una excepción no controlada no genera ninguna alerta

**Archivos**: `src/core/filters/http-exception.filter.ts` (`AllExceptionsFilter`),
`src/app.module.ts` (donde está cableado `nestjs-pino`), `package.json`.

**Síntoma**: el logging estructurado existe y es bueno (`nestjs-pino` + transporte a Seq), pero
**nadie se entera en tiempo real de que algo falló**. Un error en un flujo asíncrono queda como
una línea en un log que hay que ir a mirar.

**Causa raíz**: no hay ninguna herramienta de APM/error-tracking en el proyecto (ni Sentry, ni
New Relic, ni Datadog — ninguna referencia en `package.json` ni en `src/`).

**Verificación previa obligatoria**:

```bash
grep -rin "sentry\|newrelic\|datadog\|opentelemetry" package.json src/ | head
# esperado hoy: sin resultados
```

**Cambio**: integrar Sentry (o el equivalente que José prefiera — **preguntá antes de elegir**,
esto agrega una dependencia y un servicio externo con costo).

Puntos de enganche mínimos:
1. `AllExceptionsFilter` — capturar toda excepción no manejada con el contexto del request
   (ruta, método, `requestId` que ya genera el logger, usuario si hay).
2. El futuro callback de la pasarela de pago (ver `0014-dinelco-checkout-integration.md`): un
   fallo ahí deja plata en un estado inconsistente y hoy sería silencioso.

**Cuidado con los datos sensibles**: este backend maneja documentos de identidad, antecedentes,
datos de pago y consentimientos legales. Configurá el scrubbing **antes** de activarlo: nunca
mandar bodies de request completos, headers de auth, ni el contenido de
`professional-documents`. Si no podés garantizar eso, la tarea no está lista.

**Commit**: `feat(observabilidad): reportar excepciones no controladas a Sentry`

---

### H-02 · ALTO · El pipeline no tiene etapa de escaneo de seguridad

**Archivos**: `.github/workflows/pipeline.yml`.

**Síntoma**: los stages son `lint → test → docker (validate) → release → deploy`. No hay
`scan`. Ninguna dependencia vulnerable ni secreto commiteado se detecta automáticamente.

**Causa raíz**: `.claude/rules/infra.md` define el estándar como
`lint → test → build → scan → deploy` y anota explícitamente que el `scan` *"sigue sin
implementarse hoy — pendiente real"*. **Confirmado que sigue faltando.**

**Verificación previa obligatoria**:

```bash
grep -rin "trivy\|snyk\|codeql\|dependabot\|audit" .github/
# esperado hoy: sin resultados
```

**Cambio**: agregar un job de scan que corra **antes** del build de Docker y bloquee el
pipeline ante hallazgos altos/críticos. Combinación sugerida (todas gratuitas para repos
privados de GitHub o con tier gratis suficiente):

- `pnpm audit --audit-level=high` para dependencias.
- Trivy sobre la imagen de Docker construida.
- Un escáner de secretos (gitleaks) sobre el diff.

Empezá permisivo (que reporte sin bloquear) en la primera corrida para ver el ruido real, y
recién después subilo a bloqueante. Un scan que rompe el pipeline el día uno con 40 hallazgos
heredados se termina desactivando.

**Commit**: `ci: agregar etapa de escaneo de seguridad al pipeline`

---

### H-03 · MEDIO · Un rechazo por rate limit (429) no deja rastro en el log

**[VERIFICADO A MANO]** (2026-09-06: la app Flutter recibía 429 en `/v1/auth/nonce` y en el log del
backend **no aparecía ninguna línea** de esa request — se diagnosticó recién inspeccionando las
claves de Redis a mano)

**Archivos**: `src/core/config/middleware.config.ts` (orden de registro de middlewares),
`src/core/config/rate-limit.config.ts` (los 5 limitadores).

**Síntoma**: cuando un limitador rechaza una request con 429, el logger estructurado
(`nestjs-pino`) **no la registra**. Desde el log, esa request sencillamente no existió: no hay
"Incoming", ni "Error", ni el status. Un operador viendo clientes que fallan no tiene forma de
saber que los está bloqueando su propio rate limiter.

**Causa raíz**: `express-rate-limit` responde y corta la cadena **antes** de que corra el
middleware de logging, así que el ciclo de request nunca llega a loguearse.

**Por qué importa más de lo que parece**: esto costó una sesión entera de debugging real. La app
móvil fallaba con un error genérico, el backend mostraba un log limpio (ninguna request), y la
hipótesis natural — "la request no está llegando" — era falsa: llegaba y era rechazada en silencio.
Con una línea de log el diagnóstico habría sido inmediato.

**Verificación previa obligatoria**:

```bash
# 1. Agotá el cupo del limitador de auth desde una IP (max 5 / 15 min):
for i in $(seq 1 8); do curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  -H "Authorization: Basic <base64 de tekoapp-mobile:MOBILE_CLIENT_SECRET>" \
  http://127.0.0.1:3000/tekoapp-backend/api/v1/auth/nonce; done
# esperado: los primeros pasan, después 429
# 2. Buscá esos 429 en el log del backend — hoy NO aparecen.
```

Si los 429 **sí** aparecen en el log, no reproduce: anotalo en §7 y seguí.

**Cambio**: hacer que un rechazo por rate limit quede registrado, con al menos: IP/clave usada,
limitador que disparó, ruta y status. Dos caminos:

- **(A)** El `handler` de `express-rate-limit` (reemplaza a `message`) recibe `(req, res, next, options)`
  — loguear ahí antes de responder. Es local a cada limitador y no toca el orden de middlewares.
- **(B)** Mover el logger para que corra antes del limitador. Más invasivo y con riesgo de cambiar
  el comportamiento de logging de toda la API.

**Preferí (A)**: acotado, sin efectos colaterales sobre el resto del pipeline.

**Trampa**: no loguees el body ni los headers de auth de la request rechazada — un 429 en
`auth/login` lleva credenciales. Solo metadatos (ruta, método, IP, limitador).

**Tests**: un test unitario de que el `handler` configurado llama al logger y responde 429. No hace
falta e2e con Redis real.

**Commit**: `fix(observabilidad): registrar en el log los rechazos por rate limit`

---

## 5. WORKFLOW 3 — Specs de sostenibilidad (documentación, sin código)

Estas cuatro tareas producen **specs**, no implementación. Requieren decisiones de producto y
legales que un modelo no puede tomar solo. El entregable de cada una es un archivo en
`openspec/changes/`.

---

### I-01 · CRÍTICO · No existe borrado de cuenta

**Bloquea la publicación de Mobile.** Apple lo exige in-app desde 2022 (Guideline 5.1.1(v)),
Google Play pide equivalente, y la Ley paraguaya 6534/2020 de protección de datos concede
derecho de supresión.

**La spec tiene que resolver, como mínimo**:

- **Qué se borra vs. qué se anonimiza.** No todo se puede borrar: pagos, contratos firmados y
  consentimientos legales tienen retención legal. El modelo probable es anonimizar al usuario
  y conservar los registros contables desvinculados.
- **Qué pasa con un servicio en curso, un pago pendiente o un contrato sin firmar.** Bloquear
  el borrado hasta resolverlos es lo razonable, pero hay que decirlo.
- **Ventana de gracia** antes del borrado efectivo, y cómo se cancela.
- **Efecto sobre el otro lado del marketplace**: las reseñas que ese usuario dejó, el historial
  del profesional con el que trabajó.
- **El endpoint** que Web y Mobile van a consumir.

Ya existe infraestructura reusable: el módulo de retención de datos y el de consentimientos de
la fase 0006. Leelos antes de diseñar desde cero.

**Commit**: `docs(cuenta): especificar el borrado de cuenta y su alcance legal`

---

### I-02 · ALTO · No hay forma de pagarle al profesional

**Síntoma**: entra plata del cliente, pero **no existe ningún mecanismo de payout**: ni schema,
ni endpoint, ni integración. Un marketplace de dos lados sin forma de pagarle al lado de la
oferta no cierra su ciclo de negocio.

Ligado a D-03 (`professionalNetAmount` expuesto y nunca escrito) y a la integración de Dinelco
(`0014`): si Dinelco ofrece split payment o transferencia a terceros, el payout se apoya en la
pasarela; si no, hace falta un proceso propio de liquidación y transferencia bancaria.

**No escribas esta spec antes de saber qué ofrece Dinelco** — la respuesta cambia el diseño
entero. Está anotado como dato faltante en `0014-dinelco-checkout-integration.md`.

**Commit**: `docs(payouts): especificar la liquidacion y pago a profesionales`

---

### I-03 · MEDIO · No hay registro de disputas

Existen reembolsos (parciales, acumulativos y TOCTOU-safe), pero no hay forma estructurada de
registrar **por qué** hubo una disputa, quién la adjudicó y con qué resultado. Hoy un reembolso
es un hecho sin expediente.

**Commit**: `docs(disputas): especificar el registro y adjudicacion de disputas`

---

### I-04 · MEDIO · Sin versionado ni política de compatibilidad de API

Un cambio breaking de DTO rompe Web y Mobile **a la vez**, y una app Mobile ya instalada en un
teléfono no se puede "redesplegar": el usuario tiene que actualizar.

La spec debe definir: qué se considera breaking, política de campos (nuevos siempre opcionales,
remoción solo tras N versiones), y cómo se usa el chequeo de versión mínima que Mobile **ya
tiene implementado** (`lib/core/update/`) para forzar actualización cuando el backend rompa
compatibilidad de verdad.

**Commit**: `docs(api): definir politica de versionado y compatibilidad`

---

## 6. WORKFLOW 4 — Deuda de diseño

Tareas de calidad. Ninguna es urgente; todas bajan el costo de los cambios futuros.

---

### T-01 · MEDIO · Los módulos más nuevos son los de cobertura más fina

`professional-portfolio` (1 spec / 4 fuentes), `contracts` (1/7), `budgets` (1/3),
`service-progress` (1/3). El riesgo está concentrado justo donde el código es más joven —
`professional-portfolio` se mergeó en `e05f399`, hace días.

**Verificación previa**: contá los archivos reales antes de asumir los números
(`ls src/api/<modulo>/**/*.ts | wc -l` vs `ls src/api/<modulo>/**/*.spec.ts | wc -l`).

Priorizá por riesgo, no por cobertura: los controllers de `contracts` (máquina de estados de 5
pasos, firma legal) valen más que un DTO sin lógica.

**Commit**: `test(<modulo>): cubrir los caminos sin test de <modulo>`

---

### T-02 · BAJO · Tres señales de verificación conviviendo en `Professionals`

`prisma/schema.prisma` (~363-378): `status` (enum `ProfessionalStatus`), `verificationStatus`
(`String @db.VarChar(20)`, texto libre, legado) y `requiredDocumentsVerified` (bool). El propio
comentario del schema documenta una colisión pasada ya corregida.

No está roto hoy. Pero tres trackers para un concepto, uno de ellos sin tipar, es exactamente
lo que causa la próxima colisión — y **D-01 mostró que la consulta más caliente del producto
filtra por el campo sin tipar** (`verification_status = 'verified'`).

**Cambio**: convertir `verificationStatus` a enum, o documentar en código (no en un comentario)
cuál es autoritativo para cada camino de lectura. Si migrás a enum, es una migración con datos
existentes: mapear los valores actuales primero (`SELECT DISTINCT verification_status FROM
professionals`).

**Commit**: `refactor(professionals): tipar verificationStatus como enum`

---

### T-03 · BAJO · `locations-db` vs `tracking-db` y un typo de nombre

Dos módulos con una división correcta pero ilegible desde el nombre: `locations-db` guarda la
última posición conocida en Postgres, `tracking-db` guarda el histórico en Mongo. Alguien nuevo
asume que son duplicados.

Además: `src/modules/tracking-db/services/tacking-db.service.ts` — **falta la "r"** en
"tracking", en el nombre del archivo y del módulo.

**Cambio**: corregir el typo (barato, hacelo aunque no hagas el resto) y evaluar renombrar a
`professional-position-db` / `geo-tracking-db`. El rename toca imports en varios lugares:
hacelo en un commit propio y solo si no hay nada más urgente en vuelo.

**Commit**: `refactor(tracking): corregir el typo del modulo tacking-db`

---

### T-04 · ALTO · El seed no siembra los catálogos que bloquean flujos enteros de la app

**[VERIFICADO A MANO]** (consultado contra la base real el 2026-09-06)

**Archivos**: `prisma/seed.ts` (seed de producción/desarrollo), `prisma/seed-dummy.ts` (datos de
prueba).

**Síntoma**: hay tablas de catálogo **vacías** que dejan flujos completos de la app inutilizables,
sin ningún error visible que explique por qué:

| Tabla | Filas hoy | Qué rompe |
|---|---|---|
| `professional_document_types` | **0** | La pantalla "Mis documentos" de Mobile renderiza una fila por tipo → sin tipos, **no hay ningún botón para subir**. La pantalla se ve vacía y correcta, pero es un callejón sin salida. |
| `legal_document_versions` | **0** | `RequiresActiveConsentGuard` exige un consentimiento vigente. Sin documentos, **ningún usuario puede tener consentimiento** → 403 permanente en todo endpoint que use ese guard (ej. `POST professionals/me/portfolio`), y la pantalla de aceptación no tiene nada que ofrecer. |
| `user_consents` | 0 | Consecuencia de la anterior. |
| `PlatformCommissionConfig` | 0 en `seed.ts` (solo `seed-dummy.ts` tiene un 10%) | El cálculo de `professionalNetAmount` (D-03) queda sin tasa configurada en un entorno sembrado con el seed real. |
| `permissions` | **1** (solo `admin:all`) | El RBAC entero está sin poblar: ninguno de los permisos que el código declara en `PermissionsEnum` existe como fila, así que no se pueden asignar a ningún rol aunque se quiera. Hay un solo rol (`ADMIN`). Verificado 2026-09-06 — ver C-02 del WORKPLAN de `TekoApp-Frontend-Web`, que se desbloqueó con este dato. |

**Por qué es ALTO y no cosmético**: no es "faltan datos de ejemplo". Es que **el producto no
funciona** en un entorno recién sembrado, y falla de la peor forma posible: en silencio. Se
descubrió probando en un dispositivo real (2026-09-06) — el flujo de subir al portafolio devolvía
403 permanente y la app se colgaba esperando un consentimiento imposible de dar (ver M-06 del
WORKPLAN de `TekoApp-Frontend-Mobile`).

**Verificación previa obligatoria** — contá las filas reales antes de asumir que siguen vacías:

```sql
SELECT 'professional_document_types' t, count(*) FROM professional_document_types
UNION ALL SELECT 'legal_document_versions', count(*) FROM legal_document_versions
UNION ALL SELECT 'user_consents', count(*) FROM user_consents;
```

Si ya tienen filas, **no reproduce**: anotalo en §7 con los números que encontraste y seguí.

**Cambio**:

> **Decisiones ya tomadas por José (2026-09-06) — no volver a preguntarlas:**
> 1. **Comisión de plataforma: 5%.** Sembrar `PlatformCommissionConfig` con ese valor.
> 2. **Autorización explícita para correr TODOS los seeds** contra la base compartida. No hace
>    falta pedir permiso de nuevo para este paso.
> 3. **Sembrar TODOS los tipos de documento** del dominio, no un subconjunto.

1. **`prisma/seed.ts`** — sembrar, de forma **idempotente** (`upsert`, igual que ya hace con
   `apiClientCredential`), el mínimo indispensable para que los flujos existan:
   - **Todos** los tipos de documento profesional del dominio. Sacá la lista del enum/modelo real
     (`grep -rn "ProfessionalDocumentType\|professionalDocumentType" src/ prisma/schema.prisma`),
     no de una lista inventada. Si el dominio no define un enum cerrado, usá el conjunto que
     consume la pantalla "Mis documentos" de Mobile y dejá anotado cuál fue el criterio.
   - Al menos una versión vigente de cada `LegalDocumentType` que el guard sepa exigir. Mirá qué
     valores del enum se usan realmente en los decoradores `@RequiresActiveConsent(...)` del código
     (`grep -rn "RequiresActiveConsent" src/`) — sembrar solo esos, no todo el enum.
   - `PlatformCommissionConfig`: **5%** (decisión de José, 2026-09-06). Dejalo con un comentario que
     diga que es el valor confirmado, no un placeholder.
   - **Fallbacks para poder probar el listado**: la pantalla de documentos tiene que ser usable por
     un profesional que todavía no subió nada — o sea, el listado debe mostrar cada tipo con su
     botón de subir aunque no exista ningún `professional_documents` asociado. Verificá ese caso
     explícitamente (profesional sin documentos → listado con filas, no vacío).
   - **El catálogo `permissions` completo**: sembrar TODOS los valores de `PermissionsEnum`
     (`src/common/enum/permissions.enum.ts`) como filas, de forma idempotente. Hoy existe una sola
     (`admin:all`), así que el RBAC no se puede configurar aunque alguien quiera. **No inventes qué
     rol recibe cada permiso** — sembrar el catálogo es técnico y seguro; asignarlos a roles es una
     decisión de negocio aparte. Dejá el rol `ADMIN` como está (con `admin:all`).
2. **Contenido de los documentos legales**: para el seed alcanza un placeholder honesto y marcado
   como tal (ej. título + versión + un cuerpo que diga explícitamente que es contenido de
   desarrollo). **No copies texto legal real** ni lo redactes vos — eso lo define José con
   asesoría, y ponerlo acá le daría apariencia de definitivo a algo que no lo es.
3. **Verificá contra la base después de correr el seed**, no solo que el comando termine sin error:
   volvé a correr el `SELECT` de arriba y confirmá los conteos.

> **La base de Supabase es COMPARTIDA**, así que correr el seed la modifica. **José ya autorizó
> explícitamente correr todos los seeds** (2026-09-06) — para ESTA tarea no hace falta volver a
> pedirlo. La regla general del §1.2 sigue vigente para migraciones y para cualquier otra escritura
> que no sea este seed.

**Criterios de aceptación**: `pnpm run seed` corre dos veces seguidas sin error ni duplicados
(idempotencia real); después de correrlo, "Mis documentos" muestra al menos un tipo con su botón
de subir, y `POST professionals/me/portfolio` deja de devolver 403 para un usuario que aceptó los
consentimientos.

**Commit**: `feat(seed): sembrar los catalogos de documentos y consentimientos legales`

---

## 7. Tabla de seguimiento

| ID | Sev | Estado | Commit | Notas |
|---|---|---|---|---|
| A-01 | CRÍTICO | [x] | `6979aee` | Webhook removido; pasarela real en `0014` |
| D-01 | ALTO | [x] | `896117f`, `2729de6` | Migración aplicada contra Supabase (2026-09-05, `professionals_nearby_idx` verificado en `pg_indexes`). Se cambió de `CREATE INDEX CONCURRENTLY` a `CREATE INDEX` tradicional: CONCURRENTLY no puede correr dentro de una transacción y `prisma migrate deploy` envuelve cada migración en una — confirmado empíricamente (error 25001, `applied_steps_count=0`, nunca tocó la tabla). Trade-off aceptado: lock breve durante el build, aceptable por el volumen de datos hoy. |
| D-02 | ALTO | [x] | `dc1663e` | Rutas enumeradas explícitamente (sin comodín `*`: Express 5 + path-to-regexp v8 lo exige con nombre) |
| D-03 | MEDIO | [x] | `6e65dbe` | Opción (b) de José: neto = amount − platformFee − tax (ya persistidos por pago), ajustado por reembolsos proporcionalmente. IVA hoy siempre 0 (`TaxConfig.isEnabled=false`, deliberado); comisión de plataforma sin fila en el seed de producción (solo dummy 10%) |
| bug colateral (sin ID) | — | [x] | `efc2ad3` | `status='approved'` (string suelto) vs enum real `APPROVED` en `findNearby` — rompía `/locations/nearby` con 500 contra Postgres real. Fix vía `Prisma.raw(ProfessionalStatus.APPROVED)` |
| H-01 | ALTO | [ ] | `5551d5c` (solo doc) | Deliberadamente NO implementado (decisión de José). Documento de opciones en H-01-observability-options.md (Sentry/GlitchTip/extender Seq), sin elegir. Sigue sin resolver hasta que José decida |
| H-02 | ALTO | [x] | `22f41f3` | Job `scan` (PR-only, tras docker-validate): pnpm audit + Trivy + gitleaks, permisivo (continue-on-error/exit-code 0) hasta triagear hallazgos heredados |
| H-03 | MEDIO | [x] | `7aa0f66` | Handler propio en los 5 limitadores (opción A), test unitario cubre metadatos + status/message |
| I-01 | CRÍTICO | [x] | `f38ca86` | Spec en I-01-account-deletion.md. Hallazgo: `DELETE /users/reference/:referenceId` no es esto (solo pone INACTIVE, es desactivación admin) — UserStatus.DELETED existe y ya bloquea login pero nada lo setea. Decisión: anonimizar solo Users, el resto hereda por FK. Ventana 14 días, bloqueantes explícitos (cruce con I-03) |
| I-02 | ALTO | [ ] | `97afed1` (solo preguntas) | Deliberadamente NO diseñado (bloqueado por Dinelco, decisión de José). 10 preguntas concretas en I-02-payout-open-questions.md, sin modelo de datos propuesto |
| I-03 | MEDIO | [x] | `deb444d` | Spec en I-03-dispute-records.md. Modelo PaymentDisputes + reglas de negocio + 6 endpoints + permiso nuevo. Hallazgo relacionado anotado (no corregido): `POST /payments/:id/refund` sin PermissionsGuard |
| I-04 | MEDIO | [x] | `0bc8a31` | Spec en I-04-api-versioning-policy.md. Decisión: `defaultVersion: '1'` global (no decorar cada controller). Lista explícita de los 37 controllers. Corrige el supuesto del WORKPLAN sobre `lib/core/update/` de Mobile (hoy es aviso opcional, no bloqueo por versión mínima) |
| T-01 | MEDIO | [x] | `8063819` | Ratio confirmado (professional-portfolio 17/1, contracts 22/1, budgets 14/1, service-progress 12/1). Priorizado `contracts` por riesgo (máquina de estados + firma legal): 15→24 tests en el service (carrera P2002, 404/403 faltantes, listAudit) + nuevo spec del generador de PDF legal. Los otros 3 módulos quedan con el mismo ratio, fuera de alcance de esta pasada |
| T-02 | BAJO | [x] | `6657a7c` | Migración aplicada contra Supabase (2026-09-06, conexión directa 5432, `migrate status` limpio antes/después). Un solo valor real ("verified") mapeado sin pérdida vía `UPPER(...)::VerificationStatus`. `professionals_nearby_idx` (D-01) se reconstruyó solo, verificado en `pg_indexes` |
| T-03 | BAJO | [x] | `53de172` | Solo el typo de archivo (clase ya se llamaba `TrackingDbService`). Rename de módulos (`locations-db`/`tracking-db`) diferido, fuera de alcance de esta tarea |
| T-04 | ALTO | [x] | `58fb50c` | Verificado contra Supabase real (0 filas antes). Seed corrido 2 veces: idempotente (docTypes=4, legalVersions=2, commissions=1, permissions=33). Sin enum cerrado de código de documento: 1 tipo por `DocumentCategory` (criterio documentado en el seed); solo 2 `LegalDocumentType` sembrados (los que un guard exige de verdad) |

---

## 8. Trabajo derivado — NO es parte de este change set

Este WORKPLAN está cerrado salvo `H-01` e `I-02`, que quedan abiertos por decisión pendiente de
José (no por falta de trabajo técnico). Lo que sigue **nació de este change set pero se ejecuta
aparte**, para que nadie lea la tabla del §7 como "incompleta":

| Origen | Entregable | Dónde vive | Estado |
|---|---|---|---|
| `I-01` de Web (`TekoApp-Frontend-Web`) | 3 endpoints admin que Web necesita | `openspec/changes/0015-admin-backoffice-endpoints.md` (`W-01`..`W-03`) | pendiente |
| `I-01` de este WORKPLAN | Implementar el borrado de cuenta especificado | `platform-hardening-2026-09/I-01-account-deletion.md` | spec lista, sin implementar |
| `I-03` de este WORKPLAN | Implementar el registro de disputas especificado | `platform-hardening-2026-09/I-03-dispute-records.md` | spec lista, sin implementar |
| `I-04` de este WORKPLAN | Aplicar `defaultVersion: '1'` a los 37 controllers | `platform-hardening-2026-09/I-04-api-versioning-policy.md` | spec lista, sin implementar |
| hallazgo de paso en `I-03` | `POST /payments/:id/refund` sin autorización | ver abajo | **[x] corregido** — `a3760f6` |

### Hallazgo sin ID, encontrado haciendo `I-03` y confirmado el 2026-09-06

`src/api/payments/controllers/payments.controller.ts:159` (`POST :id/refund`) está solo detrás de
`JwtAuthGuard` a nivel de clase: **no** tiene `@UseGuards(PermissionsGuard)` ni `@Permissions(...)`,
y a diferencia de `cancel` (línea 153, que pasa `req.user.id` al service) **no acota el pago al
usuario autenticado** — recibe únicamente `param.id`. O sea: cualquier usuario logueado puede
reembolsar el pago de cualquier otro conociendo su id numérico. Es más grave que "le falta el
guard de permisos" como quedó anotado en `I-03`, y por eso se registra acá aparte: es lo primero
que hay que corregir del trabajo derivado, antes que cualquier feature nueva.

**Corregido 2026-09-07** (`a3760f6`): `@UseGuards(PermissionsGuard)` + `@Permissions(PAYMENTS.AUDIT_VIEW, ADMIN.ALL)`
(mismo permiso que gatea `findAll`/`getSummary`/`getTrends` del mismo controller) + acotar el pago
al usuario autenticado en el service, igual que `cancelPayment`. Detalle en `openspec/decisions.md`.

Al cerrar cualquiera de estos entregables, registrarlo en `openspec/decisions.md` con el mismo
formato que las fases anteriores (`0011`, `0013`, …) — la tabla de acá solo lleva el estado.
