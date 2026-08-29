-- AlterEnum
ALTER TYPE "LegalDocumentType" ADD VALUE 'USER_CONTENT_LIABILITY_DISCLAIMER';

-- CreateTable
CREATE TABLE "tax_config" (
    "id" SERIAL NOT NULL,
    "country_id" INTEGER,
    "name" VARCHAR(100) NOT NULL,
    "rate" DECIMAL(6,4) NOT NULL DEFAULT 0.0000,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "last_changed_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "last_changed_by" TEXT,
    "changed_reason" TEXT,
    "checksum" TEXT,
    "change_signature" TEXT,

    CONSTRAINT "tax_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tax_config_country_id_is_active_idx" ON "tax_config"("country_id", "is_active");

-- AddForeignKey
ALTER TABLE "tax_config" ADD CONSTRAINT "tax_config_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
