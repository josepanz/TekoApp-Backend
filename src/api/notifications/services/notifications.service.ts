import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Types } from 'mongoose';
import { NotificationsDbService } from '@modules/notifications-db/services/notifications-db.service';
import { CreateNotificationRequestDTO } from '../dtos/request/create-notification-request.dto';
import { NotificationStatus } from '@/modules/notifications-db/enums/notification-status.enum';
import { NotificationDocument } from '@/modules/notifications-db/schemas/notification.schema';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly dbService: NotificationsDbService,
    @InjectQueue('notifications') private readonly queue: Queue,
  ) {}

  async create(
    dto: CreateNotificationRequestDTO,
    userId: string,
  ): Promise<NotificationDocument> {
    const saved = await this.dbService.create({
      ...dto,
      userId: new Types.ObjectId(userId),
      status: NotificationStatus.PENDING,
    });

    await this.queue.add('send-notification', {
      notificationId: saved._id,
      userId: saved.userId,
      type: saved.type,
      channels: saved.channels || ['in_app'],
    });

    return saved;
  }

  async findAll(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<NotificationDocument[]> {
    return this.dbService.findByUserId(userId, limit, offset);
  }

  async findUnread(userId: string): Promise<NotificationDocument[]> {
    return this.dbService.findUnreadByUserId(userId);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.dbService.countUnreadByUserId(userId);
  }

  async markAsRead(
    id: string,
    userId: string,
  ): Promise<NotificationDocument | null> {
    return this.dbService.updateStatus(id, userId, {
      status: NotificationStatus.READ,
      readAt: new Date(),
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.dbService.markAllAsRead(userId);
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.dbService.deleteOne(id, userId);
  }

  async createBulk(
    notifications: (CreateNotificationRequestDTO & { userId: string })[],
  ): Promise<void> {
    const payloads = notifications.map((n) => ({
      ...n,
      userId: new Types.ObjectId(n.userId),
      status: NotificationStatus.PENDING,
    }));

    const created = await this.dbService.insertMany(payloads);

    for (const item of created) {
      await this.queue.add('send-notification', {
        notificationId: item._id,
        userId: item.userId,
        type: item.type,
        channels: item.channels || ['in_app'],
      });
    }
  }
}
