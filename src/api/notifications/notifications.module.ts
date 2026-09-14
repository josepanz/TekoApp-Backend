import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { NotificationsController } from './controllers/notifications.controller';
import { NotificationsService } from './services/notifications.service';
import { NotificationsSseService } from './services/notifications-sse.service';
import { NotificationsProcessor } from './processors/notifications.processor';
import { NotificationsDbModule } from '@modules/notifications-db/notifications-db.module';
import { PushNotificationsDbModule } from '@modules/push-notifications-db/push-notifications-db.module';
import { PushProviderModule } from '@modules/push-provider/push-provider.module';
import { UsersDBModule } from '@modules/users-db/users-db.module';
import { EmailModule } from '@modules/email/email.module';
import { NotificationPreferencesModule } from '@api/notification-preferences/notification-preferences.module';

@Module({
  imports: [
    NotificationsDbModule,
    PushNotificationsDbModule,
    PushProviderModule,
    UsersDBModule,
    EmailModule,
    NotificationPreferencesModule,
    BullModule.registerQueue({
      name: 'notifications',
    }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsSseService,
    NotificationsProcessor,
  ],
  exports: [NotificationsService],
})
export class NotificationsApiModule {}
