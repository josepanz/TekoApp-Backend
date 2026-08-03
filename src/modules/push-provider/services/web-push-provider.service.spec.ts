import { Test, TestingModule } from '@nestjs/testing';
import * as webpush from 'web-push';
import { WebPushProviderService } from './web-push-provider.service';
import { APP_CONFIG } from '@core/config/config-loader';
import { PushSendOutcome } from '../interfaces/push-provider.interface';

jest.mock('web-push', () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn(),
}));

const buildConfig = (overrides: Record<string, unknown> = {}) => ({
  webPush: {
    vapidPublicKey: 'public-key',
    vapidPrivateKey: 'private-key',
    vapidSubject: 'mailto:soporte@tekoapp.com.py',
    ...overrides,
  },
});

const subscription = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
  p256dh: 'p256dh-key',
  auth: 'auth-key',
};

const payload = {
  title: 'Título',
  message: 'Mensaje',
  referenceId: 'ref-1',
  type: 'SERVICE',
};

describe('WebPushProviderService', () => {
  let service: WebPushProviderService;

  const buildService = async (config = buildConfig()) => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebPushProviderService,
        { provide: APP_CONFIG.KEY, useValue: config },
      ],
    }).compile();

    return module.get<WebPushProviderService>(WebPushProviderService);
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('configuración de VAPID', () => {
    it('setea las credenciales VAPID cuando están configuradas', async () => {
      // Act
      await buildService();

      // Assert
      expect(webpush.setVapidDetails).toHaveBeenCalledWith(
        'mailto:soporte@tekoapp.com.py',
        'public-key',
        'private-key',
      );
    });

    it('no setea credenciales y degrada a FAILED si faltan claves VAPID', async () => {
      // Arrange
      service = await buildService(
        buildConfig({
          vapidPublicKey: '',
          vapidPrivateKey: '',
          vapidSubject: '',
        }),
      );

      // Act
      const result = await service.send(subscription, payload);

      // Assert
      expect(webpush.setVapidDetails).not.toHaveBeenCalled();
      expect(result).toEqual({
        outcome: PushSendOutcome.FAILED,
        error: 'VAPID no configurado',
      });
    });
  });

  describe('send', () => {
    beforeEach(async () => {
      service = await buildService();
    });

    it('envía la notificación y retorna SENT en el caso feliz', async () => {
      // Arrange
      (webpush.sendNotification as jest.Mock).mockResolvedValue(undefined);

      // Act
      const result = await service.send(subscription, payload);

      // Assert
      expect(webpush.sendNotification).toHaveBeenCalledWith(
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
      expect(result).toEqual({ outcome: PushSendOutcome.SENT });
    });

    it('retorna GONE cuando el endpoint responde 410 (suscripción revocada)', async () => {
      // Arrange
      (webpush.sendNotification as jest.Mock).mockRejectedValue({
        statusCode: 410,
      });

      // Act
      const result = await service.send(subscription, payload);

      // Assert
      expect(result).toEqual({ outcome: PushSendOutcome.GONE });
    });

    it('retorna GONE cuando el endpoint responde 404', async () => {
      // Arrange
      (webpush.sendNotification as jest.Mock).mockRejectedValue({
        statusCode: 404,
      });

      // Act
      const result = await service.send(subscription, payload);

      // Assert
      expect(result).toEqual({ outcome: PushSendOutcome.GONE });
    });

    it('retorna FAILED ante cualquier otro error', async () => {
      // Arrange
      (webpush.sendNotification as jest.Mock).mockRejectedValue(
        new Error('network down'),
      );

      // Act
      const result = await service.send(subscription, payload);

      // Assert
      expect(result).toEqual({
        outcome: PushSendOutcome.FAILED,
        error: 'network down',
      });
    });
  });

  describe('getPublicKey', () => {
    it('retorna la clave pública VAPID configurada', async () => {
      // Arrange
      service = await buildService();

      // Act & Assert
      expect(service.getPublicKey()).toBe('public-key');
    });
  });
});
