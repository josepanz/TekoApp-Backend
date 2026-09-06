-- D-01 (openspec/changes/platform-hardening-2026-09/WORKPLAN.md): índice parcial compuesto para
-- el patrón real de WHERE de `LocationsDbService.findNearby` — la búsqueda de profesionales
-- cercanos, la consulta más caliente de la plataforma (mapa + match de servicios).
--
-- Los índices existentes de `professionals` (`status`, `is_available`, ambos de columna simple)
-- no cubren la combinación real de 4-6 predicados del WHERE. Este índice sí, y es PARCIAL sobre
-- `current_latitude/longitude IS NOT NULL` porque esos dos IS NOT NULL ya son parte del WHERE
-- real y reducen mucho el tamaño físico del índice.
--
-- Sin CONCURRENTLY (decisión revisada 2026-09-05): se evaluó CONCURRENTLY porque
-- `professionals` recibe escrituras frecuentes (actualización de ubicación en tiempo real vía
-- `updateLocation`), pero Postgres no permite CONCURRENTLY dentro de una transacción, y
-- `prisma migrate deploy` SÍ envuelve cada migración en una transacción explícita (confirmado
-- empíricamente: falló con `25001 CREATE INDEX CONCURRENTLY cannot run inside a transaction
-- block` contra Supabase, con `applied_steps_count=0` — no llegó a tocar la tabla). El
-- workaround oficial de Prisma para esto es aplicar el SQL a mano fuera de `migrate deploy`, pero
-- se optó por la alternativa más simple: un `CREATE INDEX` tradicional. Trade-off aceptado a
-- sabiendas: toma un lock que bloquea escrituras concurrentes sobre `professionals` mientras se
-- construye — aceptable hoy por el volumen de datos real (la tabla tiene un puñado de filas en
-- este entorno); revisar esta decisión si el volumen de profesionales crece antes de escalar.
--
-- Alternativa evaluada y descartada: earthdistance/PostGIS con índice GiST es la solución
-- correcta para distancia geográfica real a escala (evita el propio Haversine calculado a mano),
-- pero agrega una extensión de Postgres sujeta a las políticas del proveedor administrado
-- (Supabase) — no se adopta acá para no introducir esa dependencia de infraestructura sin
-- acuerdo previo con el equipo.
--
-- No se representa como `@@index` en prisma/schema.prisma: la sintaxis declarativa de Prisma no
-- soporta índices parciales (cláusula WHERE). Ver comentario en el modelo `Professionals`.
--
-- EXPLAIN ANALYZE antes/después: ver openspec/changes/platform-hardening-2026-09/WORKPLAN.md §7
-- y el reporte de ejecución de D-01 — el entorno de verificación (Supabase, rama audit/2026-09-04)
-- tiene una sola fila en `professionals` y esa fila no matchea el filtro IS NOT NULL de
-- lat/long, así que no hay volumen real para medir una mejora de tiempo; la justificación es de
-- shape de plan (los índices existentes no cubren el WHERE compuesto), no de tiempo medido. Ver
-- limitación documentada en el reporte de la tarea.
CREATE INDEX IF NOT EXISTS professionals_nearby_idx
  ON professionals (status, verification_status, is_available, is_online, category_id)
  WHERE current_latitude IS NOT NULL AND current_longitude IS NOT NULL;

-- Re-invocación idempotente de rigor (no crea tabla nueva ni columnas de auditoría nuevas, pero
-- se mantiene la convención de toda migración de este repo).
SELECT fn_attach_audit_triggers();
