import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { APP_CONFIG, AppConfigType } from '@core/config/config-loader';
import {
  IPushPayload,
  IPushSendResult,
  PushSendOutcome,
} from '../interfaces/push-provider.interface';

@Injectable()
export class FcmProviderService {
  private readonly logger = new Logger(FcmProviderService.name);
  private app: admin.app.App | null = null;

  constructor(
    @Inject(APP_CONFIG.KEY)
    private readonly configService: ConfigType<AppConfigType>,
  ) {
    this.initializeApp();
  }

  /**
   * Las credenciales de Firebase son de configuración externa (service account real, provisto
   * por el proyecto Firebase del negocio) — en ambientes sin ese proyecto todavía (local/CI) no
   * deben tumbar el boot de Nest. Cualquier fallo de inicialización deja `this.app = null` y
   * `send()` degrada a FAILED en vez de propagar la excepción.
   */
  private initializeApp(): void {
    const { projectId, privateKey, clientEmail } = this.configService.firebase;

    if (!projectId || !privateKey || !clientEmail) {
      this.logger.warn(
        'FIREBASE_PROJECT_ID/FIREBASE_PRIVATE_KEY/FIREBASE_CLIENT_EMAIL no configurados — FCM deshabilitado.',
      );
      return;
    }

    try {
      this.app = admin.initializeApp(
        {
          credential: admin.credential.cert({
            projectId,
            privateKey,
            clientEmail,
          }),
        },
        'fcm-provider',
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'unknown';
      this.logger.warn(
        `No se pudo inicializar Firebase Admin (credenciales inválidas) — FCM deshabilitado: ${message}`,
      );
      this.app = null;
    }
  }

  async send(token: string, payload: IPushPayload): Promise<IPushSendResult> {
    if (!this.app) {
      return {
        outcome: PushSendOutcome.FAILED,
        error: 'Firebase no configurado',
      };
    }

    try {
      await this.app.messaging().send({
        token,
        notification: {
          title: payload.title,
          body: payload.message,
        },
        data: {
          referenceId: payload.referenceId ?? '',
          type: payload.type ?? '',
        },
      });
      return { outcome: PushSendOutcome.SENT };
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token'
      ) {
        return { outcome: PushSendOutcome.GONE };
      }

      const message = error instanceof Error ? error.message : 'unknown';
      this.logger.error(`Fallo al enviar FCM: ${message}`);
      return { outcome: PushSendOutcome.FAILED, error: message };
    }
  }
}
