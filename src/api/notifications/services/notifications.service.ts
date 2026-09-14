import { Inject, Injectable, Logger, MessageEvent } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { ConfigType } from '@nestjs/config';
import { JobOptions, Queue } from 'bull';
import { Observable } from 'rxjs';
import { DeviceType, FcmTokens, PushSubscriptions } from '@prisma/client';
import { APP_CONFIG, AppConfigType } from '@core/config/config-loader';
import { NotificationsDbService } from '@modules/notifications-db/services/notifications-db.service';
import { PushSubscriptionsDbService } from '@modules/push-notifications-db/services/push-subscriptions-db.service';
import { FcmTokensDbService } from '@modules/push-notifications-db/services/fcm-tokens-db.service';
import { WebPushProviderService } from '@modules/push-provider/services/web-push-provider.service';
import { NotificationPreferencesService } from '@api/notification-preferences/services/notification-preferences.service';
import { CreateNotificationRequestDTO } from '../dtos/request/create-notification-request.dto';
import { CreatePushSubscriptionRequestDTO } from '../dtos/request/create-push-subscription.request.dto';
import { CreateFcmTokenRequestDTO } from '../dtos/request/create-fcm-token.request.dto';
import { NotificationStatus } from '@/modules/notifications-db/enums/notification-status.enum';
import { NotificationDbHelper } from '@/modules/notifications-db/helpers/notification-db.helper';
import { NotificationsSseService } from './notifications-sse.service';
import { NotificationResponseDTO } from '../dtos/response/notification-response.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly dbService: NotificationsDbService,
    private readonly pushSubscriptionsDb: PushSubscriptionsDbService,
    private readonly fcmTokensDb: FcmTokensDbService,
    private readonly webPushProvider: WebPushProviderService,
    private readonly sseService: NotificationsSseService,
    private readonly preferencesService: NotificationPreferencesService,
    @InjectQueue('notifications') private readonly queue: Queue,
    @Inject(APP_CONFIG.KEY)
    private readonly configService: ConfigType<AppConfigType>,
  ) {}

  /**
   * Opciones de reintento del job `send-notification` — I-05 (tarea 5, platform-hardening-
   * 2026-09): "hasta N, 3 por defecto, configurable" (decisión de José). Bull reintenta el job
   * completo cuando `NotificationsProcessor.handleSendNotification` relanza (falla crítica de
   * algún canal que sí relanza, ej. push/fcm no cubren esto porque nunca relanzan — ver ese
   * archivo); cada intento fallido ya deja `status=FAILED` persistido en Mongo antes de
   * reintentar.
   */
  private get retryJobOptions(): JobOptions {
    return {
      attempts: this.configService.notifications.maxRetryAttempts,
      backoff: { type: 'exponential', delay: 2000 },
    };
  }

  async create(
    dto: CreateNotificationRequestDTO,
    userId: number,
  ): Promise<NotificationResponseDTO | null> {
    // Preferencias del usuario (tarea 4, I-05): un tipo desactivado no se persiste ni se
    // encola — ni para este usuario ni para ningún canal, porque hoy la preferencia es por
    // tipo, no por canal (ver notification-preferences-and-inbox.md, Mobile).
    const enabled = await this.preferencesService.isEnabled(userId, dto.type);
    if (!enabled) {
      this.logger.log(
        `Notificación tipo=${dto.type} omitida para userId=${userId}: desactivada por preferencias.`,
      );
      return null;
    }

    const saved = await this.dbService.create({
      ...dto,
      userId,
      status: NotificationStatus.PENDING,
    });

    await this.queue.add(
      'send-notification',
      {
        notificationId: saved._id,
        userId: saved.userId,
        type: saved.type,
        title: saved.title,
        message: saved.message,
        data: saved.data,
        channels: saved.channels || ['in_app'],
      },
      this.retryJobOptions,
    );

    return NotificationDbHelper.mapToResponse(saved);
  }

  async findAll(
    userId: number,
    limit: number,
    offset: number,
  ): Promise<NotificationResponseDTO[]> {
    const docs = await this.dbService.findByUserId(userId, limit, offset);
    return NotificationDbHelper.mapManyToResponse(docs);
  }

  async findUnread(userId: number): Promise<NotificationResponseDTO[]> {
    const docs = await this.dbService.findUnreadByUserId(userId);
    return NotificationDbHelper.mapManyToResponse(docs);
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.dbService.countUnreadByUserId(userId);
  }

  async markAsRead(
    id: string,
    userId: number,
  ): Promise<NotificationResponseDTO | null> {
    const updated = await this.dbService.updateStatus(id, userId, {
      status: NotificationStatus.READ,
      readAt: new Date(),
    });
    return updated ? NotificationDbHelper.mapToResponse(updated) : null;
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
    // Mismo filtro de preferencias que `create()`, por-item porque cada entrada puede ser un
    // usuario/tipo distinto.
    const allowed: (CreateNotificationRequestDTO & { userId: number })[] = [];
    for (const n of notifications) {
      const enabled = await this.preferencesService.isEnabled(n.userId, n.type);
      if (enabled) allowed.push(n);
    }
    if (allowed.length === 0) return;

    const payloads = allowed.map((n) => ({
      ...n,
      status: NotificationStatus.PENDING,
    }));

    const created = await this.dbService.insertMany(payloads);

    for (const item of created) {
      await this.queue.add(
        'send-notification',
        {
          notificationId: item._id,
          userId: item.userId,
          type: item.type,
          title: item.title,
          message: item.message,
          data: item.data,
          channels: item.channels || ['in_app'],
        },
        this.retryJobOptions,
      );
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
