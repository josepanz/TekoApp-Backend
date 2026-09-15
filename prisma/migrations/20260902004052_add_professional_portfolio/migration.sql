-- CreateEnum
CREATE TYPE "PortfolioReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "professional_portfolio_items" (
    "id" SERIAL NOT NULL,
    "reference_id" TEXT NOT NULL,
    "professional_id" INTEGER NOT NULL,
    "file_key" TEXT NOT NULL,
    "caption" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "status" "PortfolioReviewStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" TEXT,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "last_changed_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "last_changed_by" TEXT,
    "changed_reason" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "checksum" TEXT,
    "change_signature" TEXT,

    CONSTRAINT "professional_portfolio_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "professional_portfolio_items_reference_id_key" ON "professional_portfolio_items"("reference_id");

-- CreateIndex
CREATE INDEX "professional_portfolio_items_professional_id_status_idx" ON "professional_portfolio_items"("professional_id", "status");

-- AddForeignKey
ALTER TABLE "professional_portfolio_items" ADD CONSTRAINT "professional_portfolio_items_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "professionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Adjuntar el trigger de auditoría genérico (id + created_by + change_signature califican) — ver
-- .claude/rules/database-conventions.md. Prisma no tiene hook post-migración para SQL crudo, por
-- eso se re-invoca la función idempotente acá, mismo criterio que la migración de
-- professional_documents.
SELECT fn_attach_audit_triggers();
