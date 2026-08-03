-- AlterTable
ALTER TABLE "user_credentials" ADD COLUMN     "change_signature" TEXT,
ADD COLUMN     "changed_reason" TEXT,
ADD COLUMN     "checksum" TEXT,
ADD COLUMN     "created_by" TEXT,
ADD COLUMN     "last_changed_at" TIMESTAMP(3),
ADD COLUMN     "last_changed_by" TEXT;

-- Reasociar los triggers de auditoría: con las columnas nuevas, `user_credentials` ahora
-- califica (tiene `id` + `created_by` + `change_signature`). La función es idempotente
-- (DROP TRIGGER IF EXISTS + CREATE), así que reejecutarla sobre las tablas ya adjuntas no
-- rompe nada. Prisma no tiene hook post-migración para SQL crudo, por eso se incluye acá.
SELECT fn_attach_audit_triggers();
