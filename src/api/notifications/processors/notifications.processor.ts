import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { NotificationsDbService } from '@modules/notifications-db/services/notifications-db.service';
import { NotificationStatus } from '@/modules/notifications-db/enums/notification-status.enum';

interface NotificationJobPayload {
  notificationId: string;
  userId: string;
  type: string;
  channels: string[];
}

@Processor('notifications')
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(private readonly dbService: NotificationsDbService) {}

  @Process('send-notification')
  async handleSendNotification(job: Job<NotificationJobPayload>) {
    const { notificationId, userId, channels } = job.data;

    try {
      this.logger.log(
        `Procesando envío de la notificación: ${notificationId} para el usuario: ${userId}`,
      );

      for (const channel of channels) {
        this.sendNotificationByChannel(channel, job.data);
      }

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

  private sendNotificationByChannel(
    channel: string,
    data: NotificationJobPayload,
  ): void {
    switch (channel) {
      case 'email':
        this.logger.log(
          `[Canal Email] Despachando hacia AWS SES / SendGrid para el usuario: ${data.userId}`,
        );
        break;
      case 'push':
        this.logger.log(
          `[Canal Push] Despachando Firebase Cloud Messaging (FCM) al usuario: ${data.userId}`,
        );
        break;
      case 'sms':
        this.logger.log(
          `[Canal SMS] Despachando via Twilio API al usuario: ${data.userId}`,
        );
        break;
      case 'in_app':
        break;
      default:
        this.logger.warn(
          `Canal de comunicación no soportado en la infraestructura actual: ${channel}`,
        );
    }
  }
}
