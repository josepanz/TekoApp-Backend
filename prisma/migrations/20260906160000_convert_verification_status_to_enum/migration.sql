-- T-02 (openspec/changes/platform-hardening-2026-09/WORKPLAN.md): `verification_status` era
-- texto libre (`VARCHAR(20)`) conviviendo con `status` (enum) y `requiredDocumentsVerified`
-- (bool) como tercera señal de verificación en `Professionals` — el propio schema documentaba
-- una colisión pasada ya corregida. D-01 mostró que la consulta más caliente del producto
-- (`findNearby`) filtra por este campo sin tipar. Se tipa como enum nativo `VerificationStatus`.
--
-- Verificación previa (2026-09-06, contra Supabase real):
--   SELECT verification_status, count(*) FROM professionals GROUP BY verification_status;
-- -> un solo valor distinto hoy: 'verified' (1 fila).
--
-- El USING de abajo mapea con UPPER() en vez de un CASE explícito: cubre igual los 3 valores que
-- el código históricamente escribe (unverified/verified/rejected — ver
-- `ProfessionalsService.verifyProfessional()` y el default previo del schema), todos
-- MAYÚSCULA-de-sí-mismos en el enum nuevo. Si existiera algún valor fuera de esos 3, el CAST
-- falla en vez de truncar datos en silencio.
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'VERIFIED', 'REJECTED');

ALTER TABLE "professionals"
  ALTER COLUMN "verification_status" DROP DEFAULT,
  ALTER COLUMN "verification_status" TYPE "VerificationStatus"
    USING (UPPER("verification_status")::"VerificationStatus"),
  ALTER COLUMN "verification_status" SET DEFAULT 'UNVERIFIED';

-- `professionals_nearby_idx` (D-01) indexa esta columna — Postgres reconstruye los índices que
-- dependen de ella automáticamente como parte del ALTER COLUMN TYPE de arriba (reescribe la
-- tabla); no hace falta recrearla a mano.
--
-- Re-invocación idempotente de rigor (no crea tabla nueva, pero se mantiene la convención de
-- toda migración de este repo — ver también D-01).
SELECT fn_attach_audit_triggers();
