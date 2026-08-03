import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { NotificationsDbService } from '@modules/notifications-db/services/notifications-db.service';
import { NotificationStatus } from '@/modules/notifications-db/enums/notification-status.enum';
import { PushSubscriptionsDbService } from '@modules/push-notifications-db/services/push-subscriptions-db.service';
import { FcmTokensDbService } from '@modules/push-notifications-db/services/fcm-tokens-db.service';
import { WebPushProviderService } from '@modules/push-provider/services/web-push-provider.service';
import { FcmProviderService } from '@modules/push-provider/services/fcm-provider.service';
import {
  IPushPayload,
  PushSendOutcome,
} from '@modules/push-provider/interfaces/push-provider.interface';
import { NotificationsSseService } from '@api/notifications/services/notifications-sse.service';

export interface NotificationJobPayload {
  notificationId: string;
  userId: number;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  channels: string[];
}

@Processor('notifications')
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private readonly dbService: NotificationsDbService,
    private readonly pushSubscriptionsDb: PushSubscriptionsDbService,
    private readonly fcmTokensDb: FcmTokensDbService,
    private readonly webPushProvider: WebPushProviderService,
    private readonly fcmProvider: FcmProviderService,
    private readonly sseService: NotificationsSseService,
  ) {}

  @Process('send-notification')
  async handleSendNotification(job: Job<NotificationJobPayload>) {
    const { notificationId, userId, channels } = job.data;

    try {
      this.logger.log(
        `Procesando envío de la notificación: ${notificationId} para el usuario: ${userId}`,
      );

      await Promise.all(
        channels.map((channel) =>
          this.sendNotificationByChannel(channel, job.data),
        ),
      );

      await this.dbService.updateStatusByIdDirectly(notificationId, {
        status: NotificationStatus.SENT,
        sentAt: new Date(),
      });

      this.logger.log(
        `Notificación ${notificationId} despachada exitosamente por todos los canales.`,
      );
    } catch (error) {
      this.logger.error(
        `Fallo crítico al despachar notificación ${notificationId}:`,
        error,
      );

      await this.dbService.updateStatusByIdDirectly(notificationId, {
        status: NotificationStatus.FAILED,
      });

      throw error;
    }
  }

  private async sendNotificationByChannel(
    channel: string,
    data: NotificationJobPayload,
  ): Promise<void> {
    const payload: IPushPayload = {
      title: data.title,
      message: data.message,
      referenceId:
        typeof data.data?.referenceId === 'string'
          ? data.data.referenceId
          : undefined,
      type: data.type,
    };

    switch (channel) {
      case 'email':
        this.logger.log(
          `[Canal Email] Despachando hacia AWS SES / SendGrid para el usuario: ${data.userId}`,
        );
        break;
      case 'sms':
        this.logger.log(
          `[Canal SMS] Despachando via Twilio API al usuario: ${data.userId}`,
        );
        break;
      case 'in_app':
        // Entrega en tiempo real vía SSE — solo llega si el usuario tiene la app/pestaña abierta
        // ahora mismo. GET /notifications sigue siendo el fallback universal (polling/al abrir).
        this.sseService.emit(data.userId, {
          notificationId: data.notificationId,
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data,
        });
        break;
      case 'push':
        await this.sendWebPush(data.userId, payload);
        break;
      case 'fcm':
        await this.sendFcm(data.userId, payload);
        break;
      default:
        this.logger.warn(
          `Canal de comunicación no soportado en la infraestructura actual: ${channel}`,
        );
    }
  }

  private async sendWebPush(userId: number, payload: IPushPayload) {
    const subscriptions =
      await this.pushSubscriptionsDb.findActiveByUserId(userId);

    await Promise.all(
      subscriptions.map(async (subscription) => {
        const result = await this.webPushProvider.send(
          {
            endpoint: subscription.endpoint,
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
          payload,
        );

        if (result.outcome === PushSendOutcome.GONE) {
          await this.pushSubscriptionsDb.deactivateByEndpoint(
            subscription.endpoint,
          );
        }
      }),
    );
  }

  private async sendFcm(userId: number, payload: IPushPayload) {
    const tokens = await this.fcmTokensDb.findActiveByUserId(userId);

    await Promise.all(
      tokens.map(async (fcmToken) => {
        const result = await this.fcmProvider.send(fcmToken.token, payload);

        if (result.outcome === PushSendOutcome.GONE) {
          await this.fcmTokensDb.deactivateByToken(fcmToken.token);
        }
      }),
    );
  }
}
