import { Module } from '@nestjs/common';
import { DatabaseModule } from '@core/database/database.module';
import { PushSubscriptionsDbService } from './services/push-subscriptions-db.service';
import { FcmTokensDbService } from './services/fcm-tokens-db.service';

@Module({
  imports: [DatabaseModule],
  providers: [PushSubscriptionsDbService, FcmTokensDbService],
  exports: [PushSubscriptionsDbService, FcmTokensDbService],
})
export class PushNotificationsDbModule {}
