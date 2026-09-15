-- I-01 (openspec/changes/platform-hardening-2026-09/I-01-account-deletion.md): borrado de
-- cuenta con ventana de gracia (14 días, configurable vía ACCOUNT_DELETION_GRACE_PERIOD_DAYS).
--
-- Nuevo estado PENDING_DELETION en UserStatus: login permitido durante la ventana (ver
-- AuthService.validateUserStatus, sin cambios de comportamiento respecto a ACTIVE) — el usuario
-- necesita poder entrar para cancelar el pedido si se arrepiente.
--
-- `deletion_requested_at`/`deletion_scheduled_at`: se fijan al pedir el borrado, se limpian al
-- cancelar, y el job de anonimización (`AccountDeletionAnonymizationJob`, @Cron diario) los
-- consume cuando `deletion_scheduled_at <= now()`.
--
-- `professional_documents.file_key` pasa a nullable: al anonimizar una cuenta se borra el
-- objeto real de S3 (antecedentes/títulos) y se anula la referencia — la fila se conserva como
-- registro de que existió una verificación, solo el archivo real desaparece.

-- AlterEnum
ALTER TYPE "UserStatus" ADD VALUE 'PENDING_DELETION';

-- AlterTable
ALTER TABLE "users"
  ADD COLUMN "deletion_requested_at" TIMESTAMP(3),
  ADD COLUMN "deletion_scheduled_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "professional_documents" ALTER COLUMN "file_key" DROP NOT NULL;
