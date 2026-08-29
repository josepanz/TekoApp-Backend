-- CreateEnum
CREATE TYPE "MaterialQualityTier" AS ENUM ('BASIC', 'STANDARD', 'PREMIUM');

-- CreateEnum
CREATE TYPE "BudgetLineItemType" AS ENUM ('MATERIAL', 'LABOR', 'OTHER');

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "max_budget_options_per_request" INTEGER NOT NULL DEFAULT 3;

-- CreateTable
CREATE TABLE "material_catalog" (
    "id" SERIAL NOT NULL,
    "reference_id" TEXT NOT NULL,
    "category_id" INTEGER NOT NULL,
    "country_id" INTEGER,
    "name" VARCHAR(150) NOT NULL,
    "unit" VARCHAR(30) NOT NULL,
    "quality_tier" "MaterialQualityTier" NOT NULL,
    "default_price" DECIMAL(10,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "last_changed_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "last_changed_by" TEXT,
    "changed_reason" TEXT,

    CONSTRAINT "material_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_options" (
    "id" SERIAL NOT NULL,
    "reference_id" TEXT NOT NULL,
    "service_request_id" INTEGER NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "total_price" DECIMAL(10,2) NOT NULL,
    "estimated_hours" DECIMAL(10,2),
    "is_selected" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "last_changed_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "last_changed_by" TEXT,
    "changed_reason" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "checksum" TEXT,
    "change_signature" TEXT,

    CONSTRAINT "budget_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_line_items" (
    "id" SERIAL NOT NULL,
    "reference_id" TEXT NOT NULL,
    "budget_option_id" INTEGER NOT NULL,
    "item_type" "BudgetLineItemType" NOT NULL,
    "catalog_item_id" INTEGER,
    "description" VARCHAR(255) NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "budget_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "material_catalog_reference_id_key" ON "material_catalog"("reference_id");

-- CreateIndex
CREATE INDEX "material_catalog_category_id_country_id_is_active_idx" ON "material_catalog"("category_id", "country_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "budget_options_reference_id_key" ON "budget_options"("reference_id");

-- CreateIndex
CREATE INDEX "budget_options_service_request_id_idx" ON "budget_options"("service_request_id");

-- CreateIndex
CREATE UNIQUE INDEX "budget_line_items_reference_id_key" ON "budget_line_items"("reference_id");

-- CreateIndex
CREATE INDEX "budget_line_items_budget_option_id_idx" ON "budget_line_items"("budget_option_id");

-- AddForeignKey
ALTER TABLE "material_catalog" ADD CONSTRAINT "material_catalog_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_catalog" ADD CONSTRAINT "material_catalog_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_options" ADD CONSTRAINT "budget_options_service_request_id_fkey" FOREIGN KEY ("service_request_id") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_line_items" ADD CONSTRAINT "budget_line_items_budget_option_id_fkey" FOREIGN KEY ("budget_option_id") REFERENCES "budget_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_line_items" ADD CONSTRAINT "budget_line_items_catalog_item_id_fkey" FOREIGN KEY ("catalog_item_id") REFERENCES "material_catalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Re-invoca la función idempotente que asocia triggers de auditoría a las tablas que califican
-- (id + created_by + change_signature). Solo `budget_options` califica: son montos financieros
-- reales (presupuestos), mismo criterio que ServiceRequests/Payments. `material_catalog` y
-- `budget_line_items` quedan afuera a propósito (catálogo de configuración / detalle inmutable
-- sin created_by, ver decisions.md).
SELECT fn_attach_audit_triggers();
