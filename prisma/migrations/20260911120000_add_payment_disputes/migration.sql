-- I-03 (openspec/changes/platform-hardening-2026-09/I-03-dispute-records.md): registro y
-- adjudicación de disputas de pago. Envuelve el mecanismo de reembolsos ya existente
-- (PaymentDbService.executeRefund), no lo reemplaza — una resolución que dispara reembolso deja
-- `disputeReferenceId` dentro del mismo `payments.refund_details` JSON.
--
-- Sin `@@unique([payment_id])`: un mismo pago puede tener más de una disputa a lo largo del
-- tiempo. El service impide 2 disputas OPEN/UNDER_REVIEW simultáneas sobre el mismo pago — regla
-- de negocio, no expresable como constraint simple de DB.

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "DisputeReason" AS ENUM ('SERVICE_NOT_PROVIDED', 'POOR_SERVICE_QUALITY', 'OVERCHARGE', 'DUPLICATE_PAYMENT', 'FRAUD', 'OTHER');

-- CreateEnum
CREATE TYPE "DisputeResolution" AS ENUM ('FULL_REFUND', 'PARTIAL_REFUND', 'NO_REFUND', 'OTHER_REMEDY');

-- CreateTable
CREATE TABLE "payment_disputes" (
    "id" SERIAL NOT NULL,
    "reference_id" TEXT NOT NULL,
    "payment_id" INTEGER NOT NULL,
    "opened_by_user_id" INTEGER NOT NULL,
    "reason" "DisputeReason" NOT NULL,
    "description" TEXT NOT NULL,
    "evidence_keys" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "adjudicated_by_user_id" INTEGER,
    "resolution" "DisputeResolution",
    "resolution_notes" TEXT,
    "refund_amount" DECIMAL(10,2),
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "last_changed_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "last_changed_by" TEXT,
    "changed_reason" TEXT,
    "checksum" TEXT,
    "change_signature" TEXT,

    CONSTRAINT "payment_disputes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_disputes_reference_id_key" ON "payment_disputes"("reference_id");

-- CreateIndex
CREATE INDEX "payment_disputes_payment_id_idx" ON "payment_disputes"("payment_id");

-- CreateIndex
CREATE INDEX "payment_disputes_status_idx" ON "payment_disputes"("status");

-- AddForeignKey
ALTER TABLE "payment_disputes" ADD CONSTRAINT "payment_disputes_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_disputes" ADD CONSTRAINT "payment_disputes_opened_by_user_id_fkey" FOREIGN KEY ("opened_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_disputes" ADD CONSTRAINT "payment_disputes_adjudicated_by_user_id_fkey" FOREIGN KEY ("adjudicated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Re-adjunta los triggers de auditoría genéricos: "payment_disputes" ahora califica (id +
-- created_by + change_signature) — ver fn_attach_audit_triggers() y .claude/rules/typescript.md.
SELECT fn_attach_audit_triggers();
