// src/modules/notification-preferences-db/notification-preferences-db.module.ts
//
// Persistencia Postgres (tarea 4, platform-hardening-2026-09, I-05) de qué tipos de
// `NotificationType` desactivó cada usuario. Ver el comentario del modelo
// `NotificationPreferences` en `prisma/schema.prisma` para el porqué de `mutedTypes` como JSON
// en vez de una columna por tipo.
import { Module } from '@nestjs/common';
import { DatabaseModule } from '@core/database/database.module';
import { NotificationPreferencesDbService } from './services/notification-preferences-db.service';

@Module({
  imports: [DatabaseModule],
  providers: [NotificationPreferencesDbService],
  exports: [NotificationPreferencesDbService],
})
export class NotificationPreferencesDbModule {}
