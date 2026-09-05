-- D-01 (openspec/changes/platform-hardening-2026-09/WORKPLAN.md): índice parcial compuesto para
-- el patrón real de WHERE de `LocationsDbService.findNearby` — la búsqueda de profesionales
-- cercanos, la consulta más caliente de la plataforma (mapa + match de servicios).
--
-- Los índices existentes de `professionals` (`status`, `is_available`, ambos de columna simple)
-- no cubren la combinación real de 4-6 predicados del WHERE. Este índice sí, y es PARCIAL sobre
-- `current_latitude/longitude IS NOT NULL` porque esos dos IS NOT NULL ya son parte del WHERE
-- real y reducen mucho el tamaño físico del índice.
--
-- CONCURRENTLY: `professionals` recibe escrituras frecuentes (actualización de ubicación en
-- tiempo real vía `updateLocation`); construir el índice sin bloquear esas escrituras es
-- necesario. CREATE INDEX CONCURRENTLY no puede correr dentro de una transacción — Prisma
-- Migrate (>=4.7) detecta este statement y no envuelve esta migración en una transacción
-- implícita, así que no hace falta ningún workaround adicional acá.
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
CREATE INDEX CONCURRENTLY IF NOT EXISTS professionals_nearby_idx
  ON professionals (status, verification_status, is_available, is_online, category_id)
  WHERE current_latitude IS NOT NULL AND current_longitude IS NOT NULL;

-- Re-invocación idempotente de rigor (no crea tabla nueva ni columnas de auditoría nuevas, pero
-- se mantiene la convención de toda migración de este repo).
SELECT fn_attach_audit_triggers();
