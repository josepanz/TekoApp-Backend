-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'PENDING_CLIENT_SIGNATURE', 'PENDING_PROFESSIONAL_SIGNATURE', 'SIGNED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "LegalDocumentType" ADD VALUE 'SERVICE_CONTRACT_TERMS';

-- CreateTable
CREATE TABLE "contracts" (
    "id" SERIAL NOT NULL,
    "reference_id" TEXT NOT NULL,
    "service_id" INTEGER NOT NULL,
    "budget_option_id" INTEGER NOT NULL,
    "client_user_id" INTEGER NOT NULL,
    "professional_id" INTEGER NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "content_snapshot" JSONB NOT NULL,
    "legal_terms_version_id" INTEGER,
    "client_signed_at" TIMESTAMP(3),
    "client_signature_name" TEXT,
    "client_signature_hash" TEXT,
    "professional_signed_at" TIMESTAMP(3),
    "professional_signature_name" TEXT,
    "professional_signature_hash" TEXT,
    "pdf_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "last_changed_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "last_changed_by" TEXT,
    "changed_reason" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "checksum" TEXT,
    "change_signature" TEXT,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contracts_reference_id_key" ON "contracts"("reference_id");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_budget_option_id_key" ON "contracts"("budget_option_id");

-- CreateIndex
CREATE INDEX "contracts_service_id_idx" ON "contracts"("service_id");

-- CreateIndex
CREATE INDEX "contracts_client_user_id_idx" ON "contracts"("client_user_id");

-- CreateIndex
CREATE INDEX "contracts_professional_id_idx" ON "contracts"("professional_id");

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_budget_option_id_fkey" FOREIGN KEY ("budget_option_id") REFERENCES "budget_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_client_user_id_fkey" FOREIGN KEY ("client_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "professionals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_legal_terms_version_id_fkey" FOREIGN KEY ("legal_terms_version_id") REFERENCES "legal_document_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Re-adjunta los triggers de auditoría genéricos: "contracts" ahora califica (id + created_by +
-- change_signature) — ver fn_attach_audit_triggers() y .claude/rules/typescript.md.
SELECT fn_attach_audit_triggers();
