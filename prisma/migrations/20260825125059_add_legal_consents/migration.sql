-- CreateEnum
CREATE TYPE "LegalDocumentType" AS ENUM ('TERMS_OF_SERVICE', 'PRIVACY_POLICY', 'DATA_PROCESSING_CONSENT', 'IMAGE_USAGE_CONSENT');

-- CreateEnum
CREATE TYPE "ContentUsageScope" AS ENUM ('APP_INTERNAL_ONLY', 'PUBLIC_PROFILE_DISPLAY', 'MARKETING');

-- CreateEnum
CREATE TYPE "AiDisclosureEntityType" AS ENUM ('SERVICE_DESCRIPTION', 'BUDGET_OPTION', 'PROGRESS_NOTE', 'PROFESSIONAL_DESCRIPTION', 'IMAGE', 'OTHER');

-- CreateTable
CREATE TABLE "legal_document_versions" (
    "id" SERIAL NOT NULL,
    "reference_id" TEXT NOT NULL,
    "document_type" "LegalDocumentType" NOT NULL,
    "country_id" INTEGER,
    "version" VARCHAR(20) NOT NULL,
    "content_url" VARCHAR(500) NOT NULL,
    "published_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "last_changed_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "last_changed_by" TEXT,
    "changed_reason" TEXT,

    CONSTRAINT "legal_document_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_consents" (
    "id" SERIAL NOT NULL,
    "reference_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "legal_document_version_id" INTEGER NOT NULL,
    "accepted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(255),
    "acceptance_hash" VARCHAR(128) NOT NULL,

    CONSTRAINT "user_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_consent_grants" (
    "id" SERIAL NOT NULL,
    "reference_id" TEXT NOT NULL,
    "content_type" "AiDisclosureEntityType" NOT NULL,
    "content_reference_id" TEXT NOT NULL,
    "uploader_user_id" INTEGER NOT NULL,
    "usage_scope" "ContentUsageScope" NOT NULL DEFAULT 'APP_INTERNAL_ONLY',
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "content_consent_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_retention_policies" (
    "id" SERIAL NOT NULL,
    "reference_id" TEXT NOT NULL,
    "country_id" INTEGER,
    "content_type" "AiDisclosureEntityType" NOT NULL,
    "retention_days" INTEGER,
    "allows_user_deletion" BOOLEAN NOT NULL DEFAULT true,
    "requires_legal_hold" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "data_retention_policies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "legal_document_versions_reference_id_key" ON "legal_document_versions"("reference_id");

-- CreateIndex
CREATE INDEX "legal_document_versions_document_type_country_id_is_active_idx" ON "legal_document_versions"("document_type", "country_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "user_consents_reference_id_key" ON "user_consents"("reference_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_consents_user_id_legal_document_version_id_key" ON "user_consents"("user_id", "legal_document_version_id");

-- CreateIndex
CREATE UNIQUE INDEX "content_consent_grants_reference_id_key" ON "content_consent_grants"("reference_id");

-- CreateIndex
CREATE INDEX "content_consent_grants_content_type_content_reference_id_idx" ON "content_consent_grants"("content_type", "content_reference_id");

-- CreateIndex
CREATE UNIQUE INDEX "data_retention_policies_reference_id_key" ON "data_retention_policies"("reference_id");

-- CreateIndex
CREATE UNIQUE INDEX "data_retention_policies_country_id_content_type_key" ON "data_retention_policies"("country_id", "content_type");

-- AddForeignKey
ALTER TABLE "legal_document_versions" ADD CONSTRAINT "legal_document_versions_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_consents" ADD CONSTRAINT "user_consents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_consents" ADD CONSTRAINT "user_consents_legal_document_version_id_fkey" FOREIGN KEY ("legal_document_version_id") REFERENCES "legal_document_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_consent_grants" ADD CONSTRAINT "content_consent_grants_uploader_user_id_fkey" FOREIGN KEY ("uploader_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_retention_policies" ADD CONSTRAINT "data_retention_policies_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
