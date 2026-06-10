import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  NotificationDocument,
  NotificationSchema,
} from './schemas/notification.schema';
import { NotificationsDbService } from './services/notifications-db.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NotificationDocument.name, schema: NotificationSchema },
    ]),
  ],
  providers: [NotificationsDbService],
  exports: [NotificationsDbService],
})
export class NotificationsDbModule {}
