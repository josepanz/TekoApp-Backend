-- Tarea 8 (openspec/changes/platform-hardening-2026-09/WORKPLAN.md) — el cliente (o cualquier
-- usuario, el campo vive en `users` sin tabla separada por rol) decide si su email/teléfono se
-- exponen en `ServiceUserSummaryResponseDTO`. Default `true`: preserva el comportamiento actual
-- (siempre visible) para todas las filas existentes, el opt-out es explícito hacia adelante.
--
-- Columna simple con DEFAULT constante — en Postgres 11+ esto es un cambio de metadata (no
-- reescribe la tabla ni toma un lock prolongado), así que no hace falta CONCURRENTLY ni ninguna
-- estrategia especial. "users" ya tiene el trigger de auditoría (trg_audit_users, verificado
-- contra la base antes de escribir esta migración) — agregar una columna no lo desprende, así
-- que no hace falta volver a llamar a fn_attach_audit_triggers() acá.

-- AlterTable
ALTER TABLE "users" ADD COLUMN "share_contact_info" BOOLEAN NOT NULL DEFAULT true;
