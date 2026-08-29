-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('BACKGROUND_CHECK', 'QUALIFICATION', 'PORTFOLIO');

-- CreateEnum
CREATE TYPE "DocumentReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "professional_document_types" (
    "id" SERIAL NOT NULL,
    "reference_id" TEXT NOT NULL,
    "code" VARCHAR(60) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "category" "DocumentCategory" NOT NULL,
    "country_id" INTEGER,
    "professional_category_id" INTEGER,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "validity_days" INTEGER,
    "requires_staff_review" BOOLEAN NOT NULL DEFAULT true,
    "is_visible_to_client" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "last_changed_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "last_changed_by" TEXT,
    "changed_reason" TEXT,

    CONSTRAINT "professional_document_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professional_documents" (
    "id" SERIAL NOT NULL,
    "reference_id" TEXT NOT NULL,
    "professional_id" INTEGER NOT NULL,
    "professional_document_type_id" INTEGER NOT NULL,
    "file_key" TEXT NOT NULL,
    "status" "DocumentReviewStatus" NOT NULL DEFAULT 'PENDING',
    "issued_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" TEXT,
    "rejection_reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "last_changed_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "last_changed_by" TEXT,
    "changed_reason" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "checksum" TEXT,
    "change_signature" TEXT,

    CONSTRAINT "professional_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "professional_document_types_reference_id_key" ON "professional_document_types"("reference_id");

-- CreateIndex
CREATE UNIQUE INDEX "professional_document_types_code_key" ON "professional_document_types"("code");

-- CreateIndex
CREATE INDEX "professional_document_types_category_idx" ON "professional_document_types"("category");

-- CreateIndex
CREATE UNIQUE INDEX "professional_documents_reference_id_key" ON "professional_documents"("reference_id");

-- CreateIndex
CREATE INDEX "professional_documents_professional_id_status_idx" ON "professional_documents"("professional_id", "status");

-- AddForeignKey
ALTER TABLE "professional_document_types" ADD CONSTRAINT "professional_document_types_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_document_types" ADD CONSTRAINT "professional_document_types_professional_category_id_fkey" FOREIGN KEY ("professional_category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_documents" ADD CONSTRAINT "professional_documents_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "professionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_documents" ADD CONSTRAINT "professional_documents_professional_document_type_id_fkey" FOREIGN KEY ("professional_document_type_id") REFERENCES "professional_document_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Adjuntar el trigger de auditoría genérico a las tablas nuevas que califican (id + created_by +
-- change_signature). "professional_document_types" NO califica (sin change_signature, a
-- propósito, mismo criterio que AiContentDisclosures/ContentConsentGrants) — solo
-- "professional_documents" queda con auditoría. Prisma no tiene hook post-migración para SQL
-- crudo, por eso se re-invoca la función idempotente acá.
SELECT fn_attach_audit_triggers();
