-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "requires_progress_log" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "service_progress_entries" (
    "id" SERIAL NOT NULL,
    "reference_id" TEXT NOT NULL,
    "service_id" INTEGER NOT NULL,
    "professional_id" INTEGER NOT NULL,
    "note" TEXT,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "entry_order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "last_changed_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "last_changed_by" TEXT,
    "changed_reason" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "service_progress_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "service_progress_entries_reference_id_key" ON "service_progress_entries"("reference_id");

-- CreateIndex
CREATE INDEX "service_progress_entries_service_id_entry_order_idx" ON "service_progress_entries"("service_id", "entry_order");

-- AddForeignKey
ALTER TABLE "service_progress_entries" ADD CONSTRAINT "service_progress_entries_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_progress_entries" ADD CONSTRAINT "service_progress_entries_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "professionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
