import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { Types } from 'mongoose';
import { DeviceType } from '@prisma/client';
import { NotificationsService } from '@api/notifications/services/notifications.service';
import { NotificationsDbService } from '@modules/notifications-db/services/notifications-db.service';
import { PushSubscriptionsDbService } from '@modules/push-notifications-db/services/push-subscriptions-db.service';
import { FcmTokensDbService } from '@modules/push-notifications-db/services/fcm-tokens-db.service';
import { WebPushProviderService } from '@modules/push-provider/services/web-push-provider.service';
import { NotificationsSseService } from '@api/notifications/services/notifications-sse.service';
import { NotificationStatus } from '@modules/notifications-db/enums/notification-status.enum';
import { NotificationDocument } from '@modules/notifications-db/schemas/notification.schema';
import { CreateNotificationRequestDTO } from '@api/notifications/dtos/request/create-notification-request.dto';
import { CreatePushSubscriptionRequestDTO } from '@api/notifications/dtos/request/create-push-subscription.request.dto';
import { CreateFcmTokenRequestDTO } from '@api/notifications/dtos/request/create-fcm-token.request.dto';

// --- Mocks nivel módulo ---
const mockDbCreate = jest.fn();
const mockDbInsertMany = jest.fn();
const mockDbFindByUserId = jest.fn();
const mockDbFindUnreadByUserId = jest.fn();
const mockDbCountUnreadByUserId = jest.fn();
const mockDbUpdateStatus = jest.fn();
const mockDbMarkAllAsRead = jest.fn();
const mockDbDeleteOne = jest.fn();
const mockQueueAdd = jest.fn();
const mockUpsertPushSubscription = jest.fn();
const mockDeletePushSubscriptionByReferenceId = jest.fn();
const mockUpsertFcmToken = jest.fn();
const mockDeleteFcmTokenByReferenceId = jest.fn();
const mockGetPublicKey = jest.fn();
const mockSseSubscribe = jest.fn();

const NOTIFICATIONS_QUEUE = 'notifications';

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: NotificationsDbService,
          useValue: {
            create: mockDbCreate,
            insertMany: mockDbInsertMany,
            findByUserId: mockDbFindByUserId,
            findUnreadByUserId: mockDbFindUnreadByUserId,
            countUnreadByUserId: mockDbCountUnreadByUserId,
            updateStatus: mockDbUpdateStatus,
            markAllAsRead: mockDbMarkAllAsRead,
            deleteOne: mockDbDeleteOne,
          },
        },
        {
          provide: PushSubscriptionsDbService,
          useValue: {
            upsertByEndpoint: mockUpsertPushSubscription,
            deleteByReferenceId: mockDeletePushSubscriptionByReferenceId,
          },
        },
        {
          provide: FcmTokensDbService,
          useValue: {
            upsertByToken: mockUpsertFcmToken,
            deleteByReferenceId: mockDeleteFcmTokenByReferenceId,
          },
        },
        {
          provide: WebPushProviderService,
          useValue: { getPublicKey: mockGetPublicKey },
        },
        {
          provide: NotificationsSseService,
          useValue: { subscribe: mockSseSubscribe },
        },
        {
          provide: getQueueToken(NOTIFICATIONS_QUEUE),
          useValue: { add: mockQueueAdd },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => jest.clearAllMocks());

  // ==================== create ====================
  describe('create', () => {
    it('debe guardar la notificación en BD y encolarla para envío', async () => {
      // Arrange
      const userId = 42;
      const dto: CreateNotificationRequestDTO = {
        type: 'SERVICE_REQUEST',
        title: 'Nueva solicitud',
        body: 'Tienes una solicitud nueva',
        channels: ['push'],
      } as unknown as CreateNotificationRequestDTO;

      const savedDoc = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(userId),
        type: dto.type,
        channels: dto.channels,
        status: NotificationStatus.PENDING,
      } as unknown as NotificationDocument;

      mockDbCreate.mockResolvedValue(savedDoc);
      mockQueueAdd.mockResolvedValue({});

      // Act
      const result = await service.create(dto, userId);

      // Assert
      expect(mockDbCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          ...dto,
          status: NotificationStatus.PENDING,
        }),
      );
      expect(mockQueueAdd).toHaveBeenCalledWith(
        'send-notification',
        expect.objectContaining({
          notificationId: savedDoc._id,
          userId: savedDoc.userId,
          type: savedDoc.type,
        }),
      );
      expect(result).toBe(savedDoc);
    });

    it('debe encolar con canal in_app por defecto cuando la notificación no tiene canales definidos', async () => {
      // Arrange
      const userId = 42;
      const dto: CreateNotificationRequestDTO = {
        type: 'PAYMENT',
        title: 'Pago recibido',
        body: 'Tu pago fue procesado',
      } as unknown as CreateNotificationRequestDTO;

      const savedDoc = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(userId),
        type: dto.type,
        channels: undefined,
        status: NotificationStatus.PENDING,
      } as unknown as NotificationDocument;

      mockDbCreate.mockResolvedValue(savedDoc);
      mockQueueAdd.mockResolvedValue({});

      // Act
      await service.create(dto, userId);

      // Assert
      expect(mockQueueAdd).toHaveBeenCalledWith(
        'send-notification',
        expect.objectContaining({ channels: ['in_app'] }),
      );
    });
  });

  // ==================== findAll ====================
  describe('findAll', () => {
    it('debe retornar las notificaciones del usuario paginadas por limit y offset', async () => {
      // Arrange
      const userId = 42;
      const expected: NotificationDocument[] = [
        { _id: new Types.ObjectId() } as unknown as NotificationDocument,
      ];
      mockDbFindByUserId.mockResolvedValue(expected);

      // Act
      const result = await service.findAll(userId, 10, 0);

      // Assert
      expect(mockDbFindByUserId).toHaveBeenCalledWith(userId, 10, 0);
      expect(result).toBe(expected);
    });
  });

  // ==================== findUnread ====================
  describe('findUnread', () => {
    it('debe retornar únicamente las notificaciones no leídas del usuario', async () => {
      // Arrange
      const userId = 42;
      const expected: NotificationDocument[] = [
        {
          _id: new Types.ObjectId(),
          status: NotificationStatus.PENDING,
        } as unknown as NotificationDocument,
      ];
      mockDbFindUnreadByUserId.mockResolvedValue(expected);

      // Act
      const result = await service.findUnread(userId);

      // Assert
      expect(mockDbFindUnreadByUserId).toHaveBeenCalledWith(userId);
      expect(result).toBe(expected);
    });
  });

  // ==================== getUnreadCount ====================
  describe('getUnreadCount', () => {
    it('debe retornar el conteo de notificaciones no leídas del usuario', async () => {
      // Arrange
      const userId = 42;
      mockDbCountUnreadByUserId.mockResolvedValue(7);

      // Act
      const result = await service.getUnreadCount(userId);

      // Assert
      expect(mockDbCountUnreadByUserId).toHaveBeenCalledWith(userId);
      expect(result).toBe(7);
    });
  });

  // ==================== markAsRead ====================
  describe('markAsRead', () => {
    it('debe marcar una notificación como leída y retornar el documento actualizado', async () => {
      // Arrange
      const id = new Types.ObjectId().toString();
      const userId = 42;
      const updated: NotificationDocument = {
        _id: new Types.ObjectId(id),
        status: NotificationStatus.READ,
        readAt: new Date(),
      } as unknown as NotificationDocument;
      mockDbUpdateStatus.mockResolvedValue(updated);

      // Act
      const result = await service.markAsRead(id, userId);

      // Assert
      expect(mockDbUpdateStatus).toHaveBeenCalledWith(
        id,
        userId,
        expect.objectContaining({ status: NotificationStatus.READ }),
      );
      expect(result).toBe(updated);
    });

    it('debe retornar null cuando la notificación no existe o no pertenece al usuario', async () => {
      // Arrange
      const id = new Types.ObjectId().toString();
      const userId = 42;
      mockDbUpdateStatus.mockResolvedValue(null);

      // Act
      const result = await service.markAsRead(id, userId);

      // Assert
      expect(result).toBeNull();
    });
  });

  // ==================== markAllAsRead ====================
  describe('markAllAsRead', () => {
    it('debe marcar todas las notificaciones del usuario como leídas', async () => {
      // Arrange
      const userId = 42;
      mockDbMarkAllAsRead.mockResolvedValue(undefined);

      // Act
      await service.markAllAsRead(userId);

      // Assert
      expect(mockDbMarkAllAsRead).toHaveBeenCalledWith(userId);
    });
  });

  // ==================== delete ====================
  describe('delete', () => {
    it('debe eliminar una notificación específica del usuario', async () => {
      // Arrange
      const id = new Types.ObjectId().toString();
      const userId = 42;
      mockDbDeleteOne.mockResolvedValue(undefined);

      // Act
      await service.delete(id, userId);

      // Assert
      expect(mockDbDeleteOne).toHaveBeenCalledWith(id, userId);
    });
  });

  // ==================== createBulk ====================
  describe('createBulk', () => {
    it('debe crear múltiples notificaciones y encolar cada una para envío', async () => {
      // Arrange
      const userId1 = 42;
      const userId2 = 43;
      const notifications = [
        {
          type: 'SERVICE_REQUEST',
          title: 'Notif 1',
          body: 'Cuerpo 1',
          channels: ['push'],
          userId: userId1,
        } as unknown as CreateNotificationRequestDTO & { userId: number },
        {
          type: 'PAYMENT',
          title: 'Notif 2',
          body: 'Cuerpo 2',
          channels: ['in_app'],
          userId: userId2,
        } as unknown as CreateNotificationRequestDTO & { userId: number },
      ];

      const created: NotificationDocument[] = [
        {
          _id: new Types.ObjectId(),
          userId: new Types.ObjectId(userId1),
          type: 'SERVICE_REQUEST',
          channels: ['push'],
        } as unknown as NotificationDocument,
        {
          _id: new Types.ObjectId(),
          userId: new Types.ObjectId(userId2),
          type: 'PAYMENT',
          channels: ['in_app'],
        } as unknown as NotificationDocument,
      ];
      mockDbInsertMany.mockResolvedValue(created);
      mockQueueAdd.mockResolvedValue({});

      // Act
      await service.createBulk(notifications);

      // Assert
      expect(mockDbInsertMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ status: NotificationStatus.PENDING }),
        ]),
      );
      expect(mockQueueAdd).toHaveBeenCalledTimes(2);
    });

    it('debe encolar con in_app por defecto para notificaciones bulk sin canales', async () => {
      // Arrange
      const userId = 42;
      const notifications = [
        {
          type: 'ALERT',
          title: 'Alerta',
          body: 'Mensaje de alerta',
          userId,
        } as unknown as CreateNotificationRequestDTO & { userId: number },
      ];

      const created: NotificationDocument[] = [
        {
          _id: new Types.ObjectId(),
          userId: new Types.ObjectId(userId),
          type: 'ALERT',
          channels: undefined,
        } as unknown as NotificationDocument,
      ];
      mockDbInsertMany.mockResolvedValue(created);
      mockQueueAdd.mockResolvedValue({});

      // Act
      await service.createBulk(notifications);

      // Assert
      expect(mockQueueAdd).toHaveBeenCalledWith(
        'send-notification',
        expect.objectContaining({ channels: ['in_app'] }),
      );
    });
  });

  // ==================== streamForUser (SSE) ====================
  describe('streamForUser', () => {
    it('debe delegar la suscripción SSE al NotificationsSseService', () => {
      // Arrange
      const userId = 42;
      const expectedObservable = { subscribe: jest.fn() };
      mockSseSubscribe.mockReturnValue(expectedObservable);

      // Act
      const result = service.streamForUser(userId);

      // Assert
      expect(mockSseSubscribe).toHaveBeenCalledWith(userId);
      expect(result).toBe(expectedObservable);
    });
  });

  // ==================== getVapidPublicKey ====================
  describe('getVapidPublicKey', () => {
    it('debe retornar la clave pública VAPID del provider', () => {
      // Arrange
      mockGetPublicKey.mockReturnValue('public-key');

      // Act & Assert
      expect(service.getVapidPublicKey()).toBe('public-key');
    });
  });

  // ==================== registerPushSubscription ====================
  describe('registerPushSubscription', () => {
    it('debe registrar la suscripción Web Push con los datos del usuario', async () => {
      // Arrange
      const userId = 42;
      const dto: CreatePushSubscriptionRequestDTO = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
        keys: { p256dh: 'p256dh-key', auth: 'auth-key' },
        userAgent: 'Mozilla/5.0',
      };
      const expected = { referenceId: 'ref-1' };
      mockUpsertPushSubscription.mockResolvedValue(expected);

      // Act
      const result = await service.registerPushSubscription(
        dto,
        userId,
        'user@test.com',
      );

      // Assert
      expect(mockUpsertPushSubscription).toHaveBeenCalledWith({
        userId,
        endpoint: dto.endpoint,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
        userAgent: dto.userAgent,
        createdBy: 'user@test.com',
      });
      expect(result).toBe(expected);
    });
  });

  // ==================== removePushSubscription ====================
  describe('removePushSubscription', () => {
    it('debe eliminar la suscripción del usuario dado su referenceId', async () => {
      // Arrange
      mockDeletePushSubscriptionByReferenceId.mockResolvedValue(undefined);

      // Act
      await service.removePushSubscription('ref-1', 42);

      // Assert
      expect(mockDeletePushSubscriptionByReferenceId).toHaveBeenCalledWith(
        'ref-1',
        42,
      );
    });
  });

  // ==================== registerFcmToken ====================
  describe('registerFcmToken', () => {
    it('debe registrar el token FCM con los datos del usuario', async () => {
      // Arrange
      const userId = 42;
      const dto: CreateFcmTokenRequestDTO = {
        token: 'fcm-token-abc',
        deviceType: DeviceType.ANDROID,
      };
      const expected = { referenceId: 'ref-1' };
      mockUpsertFcmToken.mockResolvedValue(expected);

      // Act
      const result = await service.registerFcmToken(
        dto,
        userId,
        'user@test.com',
      );

      // Assert
      expect(mockUpsertFcmToken).toHaveBeenCalledWith({
        userId,
        token: dto.token,
        deviceType: dto.deviceType,
        createdBy: 'user@test.com',
      });
      expect(result).toBe(expected);
    });
  });

  // ==================== removeFcmToken ====================
  describe('removeFcmToken', () => {
    it('debe eliminar el token del usuario dado su referenceId', async () => {
      // Arrange
      mockDeleteFcmTokenByReferenceId.mockResolvedValue(undefined);

      // Act
      await service.removeFcmToken('ref-1', 42);

      // Assert
      expect(mockDeleteFcmTokenByReferenceId).toHaveBeenCalledWith('ref-1', 42);
    });
  });
});
