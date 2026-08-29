-- CreateEnum
CREATE TYPE "TipMode" AS ENUM ('PERCENTAGE', 'FIXED', 'FREE');

-- CreateTable
CREATE TABLE "tip_config" (
    "id" SERIAL NOT NULL,
    "country_id" INTEGER,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT false,
    "suggested_percentages" JSONB NOT NULL DEFAULT '[10, 15, 20]',
    "allow_free_amount" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "last_changed_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "last_changed_by" TEXT,
    "changed_reason" TEXT,
    "checksum" TEXT,
    "change_signature" TEXT,

    CONSTRAINT "tip_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tips" (
    "id" SERIAL NOT NULL,
    "reference_id" TEXT NOT NULL,
    "payment_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "professional_id" INTEGER NOT NULL,
    "mode" "TipMode" NOT NULL,
    "percentage" DECIMAL(5,2),
    "amount" DECIMAL(10,2) NOT NULL,
    "currency_code" VARCHAR(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "last_changed_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "last_changed_by" TEXT,
    "changed_reason" TEXT,
    "checksum" TEXT,
    "change_signature" TEXT,

    CONSTRAINT "tips_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tip_config_country_id_is_active_idx" ON "tip_config"("country_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "tips_reference_id_key" ON "tips"("reference_id");

-- CreateIndex
CREATE UNIQUE INDEX "tips_payment_id_key" ON "tips"("payment_id");

-- CreateIndex
CREATE INDEX "tips_professional_id_idx" ON "tips"("professional_id");

-- AddForeignKey
ALTER TABLE "tip_config" ADD CONSTRAINT "tip_config_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tips" ADD CONSTRAINT "tips_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tips" ADD CONSTRAINT "tips_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tips" ADD CONSTRAINT "tips_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "professionals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tips" ADD CONSTRAINT "tips_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "currencies"("alphaCode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Adjuntar triggers de auditoria genericos a tip_config y tips (tienen checksum/change_signature)
SELECT fn_attach_audit_triggers();
