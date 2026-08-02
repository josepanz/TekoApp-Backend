# Regla de fechas / zona horaria

## Contexto del stack (actualizado en Fase C — fix de TZ ya aplicado)

- PostgreSQL `TIMESTAMP` sin TZ almacena el string UTC que Prisma envía tal cual — no convierte.
- **Ya corregido**: el `Dockerfile` fijaba `ENV TZ=America/Asuncion` (+ copia zoneinfo) — el mismo
  patrón que `portal-comercios-backend` identificó como problemático y descartó, porque la zona
  IANA `America/Asuncion` sigue cargando reglas de DST aunque Paraguay abolió el horario de verano
  por Ley 7127 (quedó fijo en UTC-3), y su resolución depende del tzdata instalado en cada host —
  podía desfasar ±1h según el ambiente sin que el código cambiara. Ahora usa `Etc/GMT+3` (offset
  fijo, sin reglas de DST, signo invertido por convención POSIX: `GMT+3` = `UTC-3`).
- `src/modules/health/health.controller.ts` usa `toZonedTime(new Date(), 'Etc/GMT+3')` — mismo
  patrón correcto, replicalo en código nuevo que necesite la hora de pared de Paraguay.

## Helpers existentes hoy en `@common/helpers/date.helper.ts`

- `convertToISO(value)` — string/Date → ISO string UTC o `null`.
- `toStartOfDay(value)` / `toEndOfDay(value)` — **no mutan** el argumento (corregido 2026-07-21,
  antes mutaban con `value.setUTCHours(...)`; sin callers hoy, así que el fix fue sin riesgo).
- `toISODateOnly(value)` — `YYYY-MM-DD` (usa getters LOCALES del servidor, no UTC — ver abajo).
- `parseTime(str)` — `'7d'`/`'10m'` → milisegundos.

## Faltantes respecto a portal-comercios-backend (evaluar antes de escribir lógica nueva de fechas)

No existen hoy en este proyecto (si se necesitan, agregarlos a `date.helper.ts` en vez de
reinventar inline en cada service):

- `parseInput(value)` — parseo defensivo universal de fechas que vienen del usuario/DTO
  (string con/sin `Z`, Date, null) → siempre UTC. Sin esto, `new Date("2026-06-26 20:08:59")` se
  interpreta como hora LOCAL del proceso Node, no UTC — riesgo real si el TZ del contenedor cambia.
- `nowParaguay()` — "ahora" para timestamps que genera la app (no el usuario) con offset fijo
  `Etc/GMT+3`, en vez de `new Date()` crudo (que da el instante UTC real, no la hora de pared PY).
- `startOfUTCDay`/`endOfUTCDay`/`addUTCDays` — aritmética de rangos de días sin usar
  `setHours`/`getDate` (que operan en TZ local del servidor).

## Prohibiciones (aplican ya, independientemente de la Fase C)

| Prohibido | Motivo |
|-----------|--------|
| `new Date("string sin Z")` para almacenar un valor que viene del usuario | Se interpreta como hora LOCAL del proceso, no UTC — desfasa según el TZ del contenedor |
| `'America/Asuncion'` en cualquier formato de respuesta o cálculo nuevo | Depende del tzdata del host, no de la Ley 7127 — usar `'Etc/GMT+3'` si hace falta un offset fijo |
| `date.setHours()` / `date.getDate()` sobre un `Date` compartido/reusado | Muta el objeto — ver el bug ya corregido en `toStartOfDay`/`toEndOfDay` |

## Lección del trigger de auditoría (ya aplicada en este proyecto, 2026-07-21)

`fn_audit_generic_trigger()` seteaba incondicionalmente `NEW.created_at`/`NEW.last_changed_at` a
`CURRENT_TIMESTAMP`, pisando cualquier valor que la app ya hubiera calculado explícitamente. Ya
corregido (el trigger solo cae a `CURRENT_TIMESTAMP` cuando el caller no seteó el campo) — ver
`.claude/rules/typescript.md` sección "Lecciones de la limpieza de schema". Portal-comercios-backend
documentó el mismo bug de forma independiente el 2026-07-13, confirmando que es un patrón real y
no una coincidencia de este proyecto.
