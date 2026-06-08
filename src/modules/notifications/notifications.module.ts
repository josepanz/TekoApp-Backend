import { Module } from '@nestjs/common';
import { NotificationsDbModule } from '@modules/notifications-db/notifications-db.module';

@Module({
  imports: [NotificationsDbModule],
  exports: [NotificationsDbModule],
})
export class NotificationsModule {}
