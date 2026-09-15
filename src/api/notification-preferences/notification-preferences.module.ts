import { Module } from '@nestjs/common';
import { NotificationPreferencesDbModule } from '@modules/notification-preferences-db/notification-preferences-db.module';
import { NotificationPreferencesService } from './services/notification-preferences.service';
import { NotificationPreferencesController } from './controllers/notification-preferences.controller';

@Module({
  imports: [NotificationPreferencesDbModule],
  controllers: [NotificationPreferencesController],
  providers: [NotificationPreferencesService],
  // Exportado para que la tarea 5 (disparos de notificación de dominio, I-05) pueda consultar
  // `isEnabled(userId, type)` antes de encolar un envío, sin duplicar la lectura de preferencias.
  exports: [NotificationPreferencesService],
})
export class NotificationPreferencesModule {}
