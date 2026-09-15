-- Tarea 4 (openspec/changes/platform-hardening-2026-09/WORKPLAN.md, I-05) — módulo propio para
-- persistir preferencias de notificación por usuario. Pedido por Mobile en
-- notification-preferences-and-inbox.md: no había dónde guardar "qué tipos de notificación
-- quiere recibir el usuario X", ni en Postgres ni en Mongo.
--
-- Una fila por usuario (creada perezosamente por el service, no acá). Ausencia de fila = sin
-- exclusiones (todo habilitado) — mismo default que una fila con muted_types='[]'. `muted_types`
-- es JSONB (array de strings) en vez de una columna booleana por valor de `NotificationType`
-- porque ese enum es de aplicación (TS, respaldado por Mongo) y va a crecer con la tarea 5 de
-- esta misma tanda sin requerir tocar esta tabla.

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" SERIAL NOT NULL,
    "reference_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "muted_types" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "last_changed_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "last_changed_by" TEXT,
    "changed_reason" TEXT,
    "checksum" TEXT,
    "change_signature" TEXT,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_reference_id_key" ON "notification_preferences"("reference_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_key" ON "notification_preferences"("user_id");

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Re-adjunta los triggers de auditoría genéricos: "notification_preferences" ahora califica
-- (id + created_by + change_signature) — ver fn_attach_audit_triggers() y
-- .claude/rules/typescript.md.
SELECT fn_attach_audit_triggers();
