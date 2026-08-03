import { Test, TestingModule } from '@nestjs/testing';
import { PushSubscriptionsDbService } from './push-subscriptions-db.service';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { PushSubscriptions } from '@prisma/client';

const mockUpsert = jest.fn();
const mockFindMany = jest.fn();
const mockDeleteMany = jest.fn();
const mockUpdateMany = jest.fn();

const mockPrisma = {
  extended: {
    pushSubscriptions: {
      upsert: mockUpsert,
      findMany: mockFindMany,
      deleteMany: mockDeleteMany,
      updateMany: mockUpdateMany,
    },
  },
};

const buildSubscription = (
  overrides: Partial<PushSubscriptions> = {},
): PushSubscriptions => ({
  id: 1,
  referenceId: 'ref-1',
  userId: 10,
  endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
  p256dh: 'p256dh-key',
  auth: 'auth-key',
  userAgent: 'Mozilla/5.0',
  isActive: true,
  createdBy: 'user@test.com',
  lastChangedBy: null,
  lastChangedAt: null,
  changedReason: null,
  createdAt: new Date('2026-08-02'),
  checksum: null,
  changeSignature: null,
  ...overrides,
});

describe('PushSubscriptionsDbService', () => {
  let service: PushSubscriptionsDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PushSubscriptionsDbService,
        { provide: PrismaDatasource, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PushSubscriptionsDbService>(
      PushSubscriptionsDbService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('upsertByEndpoint', () => {
    it('crea la suscripción cuando el endpoint no existe todavía', async () => {
      // Arrange
      const data = {
        userId: 10,
        endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
        p256dh: 'p256dh-key',
        auth: 'auth-key',
        userAgent: 'Mozilla/5.0',
        createdBy: 'user@test.com',
      };
      const expected = buildSubscription();
      mockUpsert.mockResolvedValue(expected);

      // Act
      const result = await service.upsertByEndpoint(data);

      // Assert
      const expectedUpdate = expect.objectContaining({
        userId: data.userId,
        isActive: true,
      }) as unknown as { userId: number; isActive: boolean };
      expect(mockUpsert).toHaveBeenCalledWith({
        where: { endpoint: data.endpoint },
        create: {
          userId: data.userId,
          endpoint: data.endpoint,
          p256dh: data.p256dh,
          auth: data.auth,
          userAgent: data.userAgent,
          createdBy: data.createdBy,
        },
        update: expectedUpdate,
      });
      expect(result).toEqual(expected);
    });
  });

  describe('findActiveByUserId', () => {
    it('retorna solo las suscripciones activas del usuario', async () => {
      // Arrange
      const expected = [buildSubscription()];
      mockFindMany.mockResolvedValue(expected);

      // Act
      const result = await service.findActiveByUserId(10);

      // Assert
      expect(mockFindMany).toHaveBeenCalledWith({
        where: { userId: 10, isActive: true },
      });
      expect(result).toEqual(expected);
    });
  });

  describe('deleteByEndpoint', () => {
    it('elimina la suscripción del usuario dado su endpoint', async () => {
      // Arrange
      mockDeleteMany.mockResolvedValue({ count: 1 });

      // Act
      await service.deleteByEndpoint('https://endpoint', 10);

      // Assert
      expect(mockDeleteMany).toHaveBeenCalledWith({
        where: { endpoint: 'https://endpoint', userId: 10 },
      });
    });
  });

  describe('deleteByReferenceId', () => {
    it('elimina la suscripción del usuario dado su referenceId', async () => {
      // Arrange
      mockDeleteMany.mockResolvedValue({ count: 1 });

      // Act
      await service.deleteByReferenceId('ref-1', 10);

      // Assert
      expect(mockDeleteMany).toHaveBeenCalledWith({
        where: { referenceId: 'ref-1', userId: 10 },
      });
    });
  });

  describe('deactivateByEndpoint', () => {
    it('marca la suscripción como inactiva cuando el navegador la revocó', async () => {
      // Arrange
      mockUpdateMany.mockResolvedValue({ count: 1 });

      // Act
      await service.deactivateByEndpoint('https://endpoint');

      // Assert
      const expectedData = expect.objectContaining({
        isActive: false,
      }) as unknown as { isActive: boolean };
      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: { endpoint: 'https://endpoint' },
        data: expectedData,
      });
    });
  });
});
