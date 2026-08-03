import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bull';
import {
  NotificationJobPayload,
  NotificationsProcessor,
} from './notifications.processor';
import { NotificationsDbService } from '@modules/notifications-db/services/notifications-db.service';
import { PushSubscriptionsDbService } from '@modules/push-notifications-db/services/push-subscriptions-db.service';
import { FcmTokensDbService } from '@modules/push-notifications-db/services/fcm-tokens-db.service';
import { WebPushProviderService } from '@modules/push-provider/services/web-push-provider.service';
import { FcmProviderService } from '@modules/push-provider/services/fcm-provider.service';
import { NotificationsSseService } from '@api/notifications/services/notifications-sse.service';
import { NotificationStatus } from '@modules/notifications-db/enums/notification-status.enum';
import { PushSendOutcome } from '@modules/push-provider/interfaces/push-provider.interface';

const mockUpdateStatusByIdDirectly = jest.fn();
const mockFindActivePushSubscriptions = jest.fn();
const mockDeactivateByEndpoint = jest.fn();
const mockFindActiveFcmTokens = jest.fn();
const mockDeactivateByToken = jest.fn();
const mockWebPushSend = jest.fn();
const mockFcmSend = jest.fn();
const mockSseEmit = jest.fn();

const buildJob = (
  overrides: Partial<NotificationJobPayload> = {},
): Job<NotificationJobPayload> =>
  ({
    data: {
      notificationId: 'notif-1',
      userId: 42,
      type: 'SERVICE_REQUEST',
      title: 'Título',
      message: 'Mensaje',
      channels: ['in_app'],
      ...overrides,
    },
  }) as unknown as Job<NotificationJobPayload>;

describe('NotificationsProcessor', () => {
  let processor: NotificationsProcessor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsProcessor,
        {
          provide: NotificationsDbService,
          useValue: { updateStatusByIdDirectly: mockUpdateStatusByIdDirectly },
        },
        {
          provide: PushSubscriptionsDbService,
          useValue: {
            findActiveByUserId: mockFindActivePushSubscriptions,
            deactivateByEndpoint: mockDeactivateByEndpoint,
          },
        },
        {
          provide: FcmTokensDbService,
          useValue: {
            findActiveByUserId: mockFindActiveFcmTokens,
            deactivateByToken: mockDeactivateByToken,
          },
        },
        {
          provide: WebPushProviderService,
          useValue: { send: mockWebPushSend },
        },
        {
          provide: FcmProviderService,
          useValue: { send: mockFcmSend },
        },
        {
          provide: NotificationsSseService,
          useValue: { emit: mockSseEmit },
        },
      ],
    }).compile();

    processor = module.get<NotificationsProcessor>(NotificationsProcessor);
  });

  afterEach(() => jest.clearAllMocks());

  describe('canal in_app', () => {
    it('emite el evento SSE al usuario destinatario', async () => {
      // Arrange
      const job = buildJob({ channels: ['in_app'] });
      mockUpdateStatusByIdDirectly.mockResolvedValue(undefined);

      // Act
      await processor.handleSendNotification(job);

      // Assert
      expect(mockSseEmit).toHaveBeenCalledWith(
        42,
        expect.objectContaining({ notificationId: 'notif-1', title: 'Título' }),
      );
      expect(mockUpdateStatusByIdDirectly).toHaveBeenCalledWith(
        'notif-1',
        expect.objectContaining({ status: NotificationStatus.SENT }),
      );
    });
  });

  describe('canal push (Web Push)', () => {
    it('envía a cada suscripción activa del usuario', async () => {
      // Arrange
      const job = buildJob({ channels: ['push'] });
      mockFindActivePushSubscriptions.mockResolvedValue([
        { endpoint: 'https://endpoint-1', p256dh: 'p1', auth: 'a1' },
        { endpoint: 'https://endpoint-2', p256dh: 'p2', auth: 'a2' },
      ]);
      mockWebPushSend.mockResolvedValue({ outcome: PushSendOutcome.SENT });

      // Act
      await processor.handleSendNotification(job);

      // Assert
      expect(mockWebPushSend).toHaveBeenCalledTimes(2);
      expect(mockDeactivateByEndpoint).not.toHaveBeenCalled();
    });

    it('desactiva la suscripción cuando el envío reporta GONE (410/404)', async () => {
      // Arrange
      const job = buildJob({ channels: ['push'] });
      mockFindActivePushSubscriptions.mockResolvedValue([
        { endpoint: 'https://endpoint-1', p256dh: 'p1', auth: 'a1' },
      ]);
      mockWebPushSend.mockResolvedValue({ outcome: PushSendOutcome.GONE });

      // Act
      await processor.handleSendNotification(job);

      // Assert
      expect(mockDeactivateByEndpoint).toHaveBeenCalledWith(
        'https://endpoint-1',
      );
    });
  });

  describe('canal fcm (mobile)', () => {
    it('envía a cada token FCM activo del usuario', async () => {
      // Arrange
      const job = buildJob({ channels: ['fcm'] });
      mockFindActiveFcmTokens.mockResolvedValue([
        { token: 'token-1' },
        { token: 'token-2' },
      ]);
      mockFcmSend.mockResolvedValue({ outcome: PushSendOutcome.SENT });

      // Act
      await processor.handleSendNotification(job);

      // Assert
      expect(mockFcmSend).toHaveBeenCalledTimes(2);
      expect(mockDeactivateByToken).not.toHaveBeenCalled();
    });

    it('desactiva el token cuando FCM reporta que ya no está registrado', async () => {
      // Arrange
      const job = buildJob({ channels: ['fcm'] });
      mockFindActiveFcmTokens.mockResolvedValue([{ token: 'token-1' }]);
      mockFcmSend.mockResolvedValue({ outcome: PushSendOutcome.GONE });

      // Act
      await processor.handleSendNotification(job);

      // Assert
      expect(mockDeactivateByToken).toHaveBeenCalledWith('token-1');
    });
  });

  describe('canales múltiples', () => {
    it('despacha todos los canales declarados en la misma notificación', async () => {
      // Arrange
      const job = buildJob({
        channels: ['in_app', 'push', 'fcm', 'email', 'sms'],
      });
      mockFindActivePushSubscriptions.mockResolvedValue([]);
      mockFindActiveFcmTokens.mockResolvedValue([]);

      // Act
      await processor.handleSendNotification(job);

      // Assert
      expect(mockSseEmit).toHaveBeenCalledTimes(1);
      expect(mockFindActivePushSubscriptions).toHaveBeenCalledWith(42);
      expect(mockFindActiveFcmTokens).toHaveBeenCalledWith(42);
    });
  });

  describe('manejo de errores', () => {
    it('marca la notificación como FAILED y relanza el error si algo falla críticamente', async () => {
      // Arrange
      const job = buildJob({ channels: ['push'] });
      mockFindActivePushSubscriptions.mockRejectedValue(new Error('DB caída'));
      mockUpdateStatusByIdDirectly.mockResolvedValue(undefined);

      // Act & Assert
      await expect(processor.handleSendNotification(job)).rejects.toThrow(
        'DB caída',
      );
      expect(mockUpdateStatusByIdDirectly).toHaveBeenCalledWith(
        'notif-1',
        expect.objectContaining({ status: NotificationStatus.FAILED }),
      );
    });
  });
});
