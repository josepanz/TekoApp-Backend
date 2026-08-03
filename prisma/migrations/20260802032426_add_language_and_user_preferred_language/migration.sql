-- AlterTable
ALTER TABLE "users" ADD COLUMN     "preferred_language_id" INTEGER;

-- CreateTable
CREATE TABLE "languages" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(5) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "last_changed_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "last_changed_by" TEXT,
    "changed_reason" TEXT,
    "checksum" TEXT,
    "change_signature" TEXT,

    CONSTRAINT "languages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "languages_code_key" ON "languages"("code");

-- CreateIndex
CREATE INDEX "languages_is_active_idx" ON "languages"("is_active");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_preferred_language_id_fkey" FOREIGN KEY ("preferred_language_id") REFERENCES "languages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Adjuntar el trigger de auditoría genérico a la tabla nueva `languages`. Califica porque
-- tiene `id` + `created_by` + `change_signature` (ver init migration). Prisma no tiene hook
-- post-migración para SQL crudo, por eso se re-invoca la función idempotente acá.
SELECT fn_attach_audit_triggers();
