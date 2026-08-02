import { Injectable, Logger, MessageEvent } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Observable } from 'rxjs';
import { DeviceType, FcmTokens, PushSubscriptions } from '@prisma/client';
import { NotificationsDbService } from '@modules/notifications-db/services/notifications-db.service';
import { PushSubscriptionsDbService } from '@modules/push-notifications-db/services/push-subscriptions-db.service';
import { FcmTokensDbService } from '@modules/push-notifications-db/services/fcm-tokens-db.service';
import { WebPushProviderService } from '@modules/push-provider/services/web-push-provider.service';
import { CreateNotificationRequestDTO } from '../dtos/request/create-notification-request.dto';
import { CreatePushSubscriptionRequestDTO } from '../dtos/request/create-push-subscription.request.dto';
import { CreateFcmTokenRequestDTO } from '../dtos/request/create-fcm-token.request.dto';
import { NotificationStatus } from '@/modules/notifications-db/enums/notification-status.enum';
import { NotificationDocument } from '@/modules/notifications-db/schemas/notification.schema';
import { NotificationsSseService } from './notifications-sse.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly dbService: NotificationsDbService,
    private readonly pushSubscriptionsDb: PushSubscriptionsDbService,
    private readonly fcmTokensDb: FcmTokensDbService,
    private readonly webPushProvider: WebPushProviderService,
    private readonly sseService: NotificationsSseService,
    @InjectQueue('notifications') private readonly queue: Queue,
  ) {}

  async create(
    dto: CreateNotificationRequestDTO,
    userId: number,
  ): Promise<NotificationDocument> {
    const saved = await this.dbService.create({
      ...dto,
      userId,
      status: NotificationStatus.PENDING,
    });

    await this.queue.add('send-notification', {
      notificationId: saved._id,
      userId: saved.userId,
      type: saved.type,
      title: saved.title,
      message: saved.message,
      data: saved.data,
      channels: saved.channels || ['in_app'],
    });

    return saved;
  }

  async findAll(
    userId: number,
    limit: number,
    offset: number,
  ): Promise<NotificationDocument[]> {
    return this.dbService.findByUserId(userId, limit, offset);
  }

  async findUnread(userId: number): Promise<NotificationDocument[]> {
    return this.dbService.findUnreadByUserId(userId);
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.dbService.countUnreadByUserId(userId);
  }

  async markAsRead(
    id: string,
    userId: number,
  ): Promise<NotificationDocument | null> {
    return this.dbService.updateStatus(id, userId, {
      status: NotificationStatus.READ,
      readAt: new Date(),
    });
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.dbService.markAllAsRead(userId);
  }

  async delete(id: string, userId: number): Promise<void> {
    await this.dbService.deleteOne(id, userId);
  }

  async createBulk(
    notifications: (CreateNotificationRequestDTO & { userId: number })[],
  ): Promise<void> {
    const payloads = notifications.map((n) => ({
      ...n,
      status: NotificationStatus.PENDING,
    }));

    const created = await this.dbService.insertMany(payloads);

    for (const item of created) {
      await this.queue.add('send-notification', {
        notificationId: item._id,
        userId: item.userId,
        type: item.type,
        title: item.title,
        message: item.message,
        data: item.data,
        channels: item.channels || ['in_app'],
      });
    }
  }

  // ─── Tiempo real (SSE) ──────────────────────────────────────────────────

  streamForUser(userId: number): Observable<MessageEvent> {
    return this.sseService.subscribe(userId);
  }

  // ─── Web Push (VAPID) ───────────────────────────────────────────────────

  getVapidPublicKey(): string {
    return this.webPushProvider.getPublicKey();
  }

  async registerPushSubscription(
    dto: CreatePushSubscriptionRequestDTO,
    userId: number,
    createdBy: string,
  ): Promise<PushSubscriptions> {
    return this.pushSubscriptionsDb.upsertByEndpoint({
      userId,
      endpoint: dto.endpoint,
      p256dh: dto.keys.p256dh,
      auth: dto.keys.auth,
      userAgent: dto.userAgent,
      createdBy,
    });
  }

  async removePushSubscription(
    referenceId: string,
    userId: number,
  ): Promise<void> {
    await this.pushSubscriptionsDb.deleteByReferenceId(referenceId, userId);
  }

  // ─── FCM (mobile) ───────────────────────────────────────────────────────

  async registerFcmToken(
    dto: CreateFcmTokenRequestDTO,
    userId: number,
    createdBy: string,
  ): Promise<FcmTokens> {
    return this.fcmTokensDb.upsertByToken({
      userId,
      token: dto.token,
      deviceType: dto.deviceType ?? DeviceType.ANDROID,
      createdBy,
    });
  }

  async removeFcmToken(referenceId: string, userId: number): Promise<void> {
    await this.fcmTokensDb.deleteByReferenceId(referenceId, userId);
  }
}
