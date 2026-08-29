-- CreateEnum
CREATE TYPE "AiDisclosureSource" AS ENUM ('PLATFORM_AI', 'USER_DECLARED_AI');

-- CreateTable
CREATE TABLE "ai_content_disclosures" (
    "id" SERIAL NOT NULL,
    "reference_id" TEXT NOT NULL,
    "entity_type" "AiDisclosureEntityType" NOT NULL,
    "entity_reference_id" TEXT NOT NULL,
    "source" "AiDisclosureSource" NOT NULL,
    "ai_provider" VARCHAR(60),
    "declared_by_user_id" INTEGER,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "ai_content_disclosures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_content_disclosures_reference_id_key" ON "ai_content_disclosures"("reference_id");

-- CreateIndex
CREATE UNIQUE INDEX "ai_content_disclosures_entity_type_entity_reference_id_key" ON "ai_content_disclosures"("entity_type", "entity_reference_id");

-- AddForeignKey
ALTER TABLE "ai_content_disclosures" ADD CONSTRAINT "ai_content_disclosures_declared_by_user_id_fkey" FOREIGN KEY ("declared_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
