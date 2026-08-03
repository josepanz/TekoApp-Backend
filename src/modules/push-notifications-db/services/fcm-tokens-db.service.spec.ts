import { Test, TestingModule } from '@nestjs/testing';
import { FcmTokensDbService } from './fcm-tokens-db.service';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { DeviceType, FcmTokens } from '@prisma/client';

const mockUpsert = jest.fn();
const mockFindMany = jest.fn();
const mockDeleteMany = jest.fn();
const mockUpdateMany = jest.fn();

const mockPrisma = {
  extended: {
    fcmTokens: {
      upsert: mockUpsert,
      findMany: mockFindMany,
      deleteMany: mockDeleteMany,
      updateMany: mockUpdateMany,
    },
  },
};

const buildToken = (overrides: Partial<FcmTokens> = {}): FcmTokens => ({
  id: 1,
  referenceId: 'ref-1',
  userId: 10,
  token: 'fcm-token-abc',
  deviceType: DeviceType.ANDROID,
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

describe('FcmTokensDbService', () => {
  let service: FcmTokensDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FcmTokensDbService,
        { provide: PrismaDatasource, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<FcmTokensDbService>(FcmTokensDbService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('upsertByToken', () => {
    it('registra el token FCM cuando todavía no existe', async () => {
      // Arrange
      const data = {
        userId: 10,
        token: 'fcm-token-abc',
        deviceType: DeviceType.ANDROID,
        createdBy: 'user@test.com',
      };
      const expected = buildToken();
      mockUpsert.mockResolvedValue(expected);

      // Act
      const result = await service.upsertByToken(data);

      // Assert
      const expectedUpdate = expect.objectContaining({
        userId: data.userId,
        isActive: true,
      }) as unknown as { userId: number; isActive: boolean };
      expect(mockUpsert).toHaveBeenCalledWith({
        where: { token: data.token },
        create: {
          userId: data.userId,
          token: data.token,
          deviceType: data.deviceType,
          createdBy: data.createdBy,
        },
        update: expectedUpdate,
      });
      expect(result).toEqual(expected);
    });
  });

  describe('findActiveByUserId', () => {
    it('retorna solo los tokens activos del usuario', async () => {
      // Arrange
      const expected = [buildToken()];
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

  describe('deleteByToken', () => {
    it('elimina el token del usuario', async () => {
      // Arrange
      mockDeleteMany.mockResolvedValue({ count: 1 });

      // Act
      await service.deleteByToken('fcm-token-abc', 10);

      // Assert
      expect(mockDeleteMany).toHaveBeenCalledWith({
        where: { token: 'fcm-token-abc', userId: 10 },
      });
    });
  });

  describe('deleteByReferenceId', () => {
    it('elimina el token del usuario dado su referenceId', async () => {
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

  describe('deactivateByToken', () => {
    it('marca el token como inactivo cuando FCM lo reporta no registrado', async () => {
      // Arrange
      mockUpdateMany.mockResolvedValue({ count: 1 });

      // Act
      await service.deactivateByToken('fcm-token-abc');

      // Assert
      const expectedData = expect.objectContaining({
        isActive: false,
      }) as unknown as { isActive: boolean };
      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: { token: 'fcm-token-abc' },
        data: expectedData,
      });
    });
  });
});
