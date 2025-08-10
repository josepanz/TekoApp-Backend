import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Notification, NotificationStatus } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<Notification>,
    @InjectQueue('notifications') private readonly notificationsQueue: Queue,
  ) {}

  async create(createNotificationDto: CreateNotificationDto, userId: Types.ObjectId): Promise<Notification> {
    const notification = new this.notificationModel({
      ...createNotificationDto,
      userId,
      status: NotificationStatus.PENDING,
    });

    const savedNotification = await notification.save();
    
    // Encolar para procesamiento
    await this.notificationsQueue.add('send-notification', {
      notificationId: savedNotification._id,
      userId: savedNotification.userId,
      type: savedNotification.type,
      channels: savedNotification.channels || ['in_app'],
    });

    return savedNotification;
  }

  async findAll(userId: Types.ObjectId, limit = 20, offset = 0): Promise<Notification[]> {
    return this.notificationModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .exec();
  }

  async findUnread(userId: Types.ObjectId): Promise<Notification[]> {
    return this.notificationModel
      .find({ userId, status: { $ne: NotificationStatus.READ } })
      .sort({ createdAt: -1 })
      .exec();
  }

  async markAsRead(notificationId: string, userId: Types.ObjectId): Promise<Notification> {
    return this.notificationModel.findOneAndUpdate(
      { _id: notificationId, userId },
      { 
        status: NotificationStatus.READ,
        readAt: new Date()
      },
      { new: true }
    ).exec();
  }

  async markAllAsRead(userId: Types.ObjectId): Promise<void> {
    await this.notificationModel.updateMany(
      { userId, status: { $ne: NotificationStatus.READ } },
      { 
        status: NotificationStatus.READ,
        readAt: new Date()
      }
    );
  }

  async delete(notificationId: string, userId: Types.ObjectId): Promise<void> {
    await this.notificationModel.deleteOne({ _id: notificationId, userId });
  }

  async getUnreadCount(userId: Types.ObjectId): Promise<number> {
    return this.notificationModel.countDocuments({
      userId,
      status: { $ne: NotificationStatus.READ }
    });
  }

  async createBulk(notifications: Array<CreateNotificationDto & { userId: Types.ObjectId }>): Promise<void> {
    const notificationsToCreate = notifications.map(notification => ({
      ...notification,
      status: NotificationStatus.PENDING,
    }));

    const createdNotifications = await this.notificationModel.insertMany(notificationsToCreate);

    // Encolar todas las notificaciones para procesamiento
    for (const notification of createdNotifications) {
      await this.notificationsQueue.add('send-notification', {
        notificationId: notification._id,
        userId: notification.userId,
        type: notification.type,
        channels: notification.channels || ['in_app'],
      });
    }
  }
}
