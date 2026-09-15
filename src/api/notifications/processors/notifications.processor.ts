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
import { UsersDBService } from '@modules/users-db/services/users-db.service';
import { EmailService } from '@modules/email/services/email.service';
import { EmailHelper } from '@modules/email/helpers/email.helper';

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
    private readonly usersDb: UsersDBService,
    private readonly emailService: EmailService,
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
        await this.sendEmail(data.userId, data.title, data.message);
        break;
      case 'sms':
        // Pendiente: `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN`/`TWILIO_PHONE_NUMBER` están
        // validados en `config-schema.ts` (Joi) pero eso es solo validación de env vars — no
        // hay paquete `twilio` en package.json ni ningún cliente/wrapper en el repo (a
        // diferencia de `modules/email`, que sí tiene un `EmailService` real detrás). Cablear
        // este canal de verdad implica agregar una dependencia nueva y un módulo `sms`/`twilio`
        // completo — fuera del alcance de "cablear el canal que ya existe" (tarea 3,
        // `platform-hardening-2026-09`, 2026-09-14). Queda como stub explícito hasta que ese
        // trabajo se planifique aparte.
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

  /**
   * Canal `email` real (I-05): resuelve el correo del destinatario y reusa `EmailService.send`
   * (mismo transporter SMTP que ya usan `auth-api`/`onboarding`/`users-db`).
   *
   * Nunca relanza: igual que `sendWebPush`/`sendFcm`, un fallo de este canal (usuario sin
   * email, SMTP caído) no debe tumbar los demás canales de la misma notificación ni marcar
   * toda la notificación como `FAILED` — se loguea y se sigue. `EmailService.send` ya lanza
   * `InternalServerErrorException` en su propio catch, así que acá se la vuelve a atrapar en
   * vez de dejarla propagar.
   */
  private async sendEmail(
    userId: number,
    title: string,
    message: string,
  ): Promise<void> {
    const user = await this.usersDb.findById(userId);
    if (!user?.email) {
      this.logger.warn(
        `[Canal Email] Usuario ${userId} sin email registrado — se omite el envío.`,
      );
      return;
    }

    try {
      await this.emailService.send({
        to: user.email,
        subject: title,
        content: EmailHelper.createGenericNotificationTemplate(
          user.firstName,
          title,
          message,
        ),
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(
        `[Canal Email] Fallo al enviar a ${user.email}: ${errorMessage}`,
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
