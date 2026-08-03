import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import * as webpush from 'web-push';
import { APP_CONFIG, AppConfigType } from '@core/config/config-loader';
import {
  IPushPayload,
  IPushSendResult,
  IWebPushSubscription,
  PushSendOutcome,
} from '../interfaces/push-provider.interface';

@Injectable()
export class WebPushProviderService {
  private readonly logger = new Logger(WebPushProviderService.name);
  private readonly isConfigured: boolean;

  constructor(
    @Inject(APP_CONFIG.KEY)
    private readonly configService: ConfigType<AppConfigType>,
  ) {
    const { vapidPublicKey, vapidPrivateKey, vapidSubject } =
      this.configService.webPush;

    this.isConfigured = Boolean(
      vapidPublicKey && vapidPrivateKey && vapidSubject,
    );

    if (this.isConfigured) {
      webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    } else {
      this.logger.warn(
        'VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY/VAPID_SUBJECT no configurados — Web Push deshabilitado, se ignoran los envíos.',
      );
    }
  }

  getPublicKey(): string {
    return this.configService.webPush.vapidPublicKey;
  }

  async send(
    subscription: IWebPushSubscription,
    payload: IPushPayload,
  ): Promise<IPushSendResult> {
    if (!this.isConfigured) {
      return { outcome: PushSendOutcome.FAILED, error: 'VAPID no configurado' };
    }

    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        },
        JSON.stringify({
          title: payload.title,
          body: payload.message,
          data: { referenceId: payload.referenceId, type: payload.type },
        }),
      );
      return { outcome: PushSendOutcome.SENT };
    } catch (error: unknown) {
      const statusCode = (error as { statusCode?: number })?.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        return { outcome: PushSendOutcome.GONE };
      }

      const message = error instanceof Error ? error.message : 'unknown';
      this.logger.error(`Fallo al enviar Web Push: ${message}`);
      return { outcome: PushSendOutcome.FAILED, error: message };
    }
  }
}
