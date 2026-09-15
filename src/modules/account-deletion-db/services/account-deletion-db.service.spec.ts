import { Test, TestingModule } from '@nestjs/testing';
import { ProfessionalStatus, UserStatus } from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import {
  AccountDeletionDbService,
  UserDueForAnonymization,
} from './account-deletion-db.service';

const mockUsersUpdateMany = jest.fn();
const mockUsersFindMany = jest.fn();
const mockTransaction = jest.fn();

const mockPrisma = {
  extended: {
    users: {
      updateMany: mockUsersUpdateMany,
      findMany: mockUsersFindMany,
    },
    $transaction: mockTransaction,
  },
};

function buildUserDue(
  overrides: Partial<UserDueForAnonymization> = {},
): UserDueForAnonymization {
  return {
    id: 1,
    avatarKey: null,
    professionals: null,
    ...overrides,
  } as UserDueForAnonymization;
}

describe('AccountDeletionDbService', () => {
  let service: AccountDeletionDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountDeletionDbService,
        { provide: PrismaDatasource, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AccountDeletionDbService>(AccountDeletionDbService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('requestDeletion', () => {
    it('debe actualizar solo si el usuario sigue ACTIVE y devolver el count', async () => {
      // Arrange
      mockUsersUpdateMany.mockResolvedValue({ count: 1 });
      const requestedAt = new Date('2026-09-07');
      const scheduledAt = new Date('2026-09-21');

      // Act
      const result = await service.requestDeletion(1, requestedAt, scheduledAt);

      // Assert
      expect(result).toBe(1);
      expect(mockUsersUpdateMany).toHaveBeenCalledWith({
        where: { id: 1, status: UserStatus.ACTIVE },
        data: {
          status: UserStatus.PENDING_DELETION,
          deletionRequestedAt: requestedAt,
          deletionScheduledAt: scheduledAt,
        },
      });
    });

    it('debe devolver 0 si el usuario ya no está ACTIVE', async () => {
      // Arrange
      mockUsersUpdateMany.mockResolvedValue({ count: 0 });

      // Act
      const result = await service.requestDeletion(1, new Date(), new Date());

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('cancelDeletion', () => {
    it('debe volver a ACTIVE y limpiar las 2 fechas solo si sigue PENDING_DELETION', async () => {
      // Arrange
      mockUsersUpdateMany.mockResolvedValue({ count: 1 });

      // Act
      const result = await service.cancelDeletion(1);

      // Assert
      expect(result).toBe(1);
      expect(mockUsersUpdateMany).toHaveBeenCalledWith({
        where: { id: 1, status: UserStatus.PENDING_DELETION },
        data: {
          status: UserStatus.ACTIVE,
          deletionRequestedAt: null,
          deletionScheduledAt: null,
        },
      });
    });
  });

  describe('findDueForAnonymization', () => {
    it('debe buscar usuarios PENDING_DELETION con deletionScheduledAt vencido', async () => {
      // Arrange
      const dueUsers = [buildUserDue()];
      mockUsersFindMany.mockResolvedValue(dueUsers);

      // Act
      const result = await service.findDueForAnonymization();

      // Assert
      expect(result).toBe(dueUsers);
      expect(mockUsersFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: UserStatus.PENDING_DELETION,
            deletionScheduledAt: { lte: expect.any(Date) as unknown },
          }) as unknown,
        }),
      );
    });
  });

  describe('anonymizeUser', () => {
    it('debe devolver null y no tocar nada más si el usuario ya no está PENDING_DELETION', async () => {
      // Arrange
      const mockUsersTxUpdateMany = jest.fn().mockResolvedValue({ count: 0 });
      const mockProfessionalsUpdate = jest.fn();
      mockTransaction.mockImplementation(
        async (callback: (tx: Record<string, unknown>) => Promise<unknown>) =>
          callback({
            users: { updateMany: mockUsersTxUpdateMany },
            professionals: { update: mockProfessionalsUpdate },
          }),
      );
      const user = buildUserDue({ id: 5 });

      // Act
      const result = await service.anonymizeUser(user);

      // Assert
      expect(result).toBeNull();
      expect(mockProfessionalsUpdate).not.toHaveBeenCalled();
    });

    it('debe anonimizar Users y devolver [] cuando no hay avatar ni perfil profesional', async () => {
      // Arrange
      const mockUsersTxUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
      const mockPushDeleteMany = jest.fn().mockResolvedValue({ count: 0 });
      const mockFcmDeleteMany = jest.fn().mockResolvedValue({ count: 0 });
      mockTransaction.mockImplementation(
        async (callback: (tx: Record<string, unknown>) => Promise<unknown>) =>
          callback({
            users: { updateMany: mockUsersTxUpdateMany },
            pushSubscriptions: { deleteMany: mockPushDeleteMany },
            fcmTokens: { deleteMany: mockFcmDeleteMany },
          }),
      );
      const user = buildUserDue({
        id: 7,
        avatarKey: null,
        professionals: null,
      });

      // Act
      const result = await service.anonymizeUser(user);

      // Assert
      expect(result).toEqual([]);
      expect(mockUsersTxUpdateMany).toHaveBeenCalledWith({
        where: { id: 7, status: UserStatus.PENDING_DELETION },
        data: expect.objectContaining({
          email: 'deleted-user-7@deleted.tekoapp.internal',
          firstName: 'Usuario',
          lastName: 'eliminado',
          documentNumber: null,
          phoneNumber: null,
          unverifiedEmail: null,
          avatarKey: null,
          status: UserStatus.DELETED,
        }) as unknown,
      });
      expect(mockPushDeleteMany).toHaveBeenCalledWith({ where: { userId: 7 } });
      expect(mockFcmDeleteMany).toHaveBeenCalledWith({ where: { userId: 7 } });
    });

    it('debe suspender el perfil profesional, anular los fileKey y devolver todas las keys de S3 a borrar', async () => {
      // Arrange
      const mockUsersTxUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
      const mockProfessionalsUpdate = jest.fn().mockResolvedValue({});
      const mockDocsUpdateMany = jest.fn().mockResolvedValue({ count: 2 });
      const mockPushDeleteMany = jest.fn().mockResolvedValue({ count: 0 });
      const mockFcmDeleteMany = jest.fn().mockResolvedValue({ count: 0 });
      mockTransaction.mockImplementation(
        async (callback: (tx: Record<string, unknown>) => Promise<unknown>) =>
          callback({
            users: { updateMany: mockUsersTxUpdateMany },
            professionals: { update: mockProfessionalsUpdate },
            professionalDocuments: { updateMany: mockDocsUpdateMany },
            pushSubscriptions: { deleteMany: mockPushDeleteMany },
            fcmTokens: { deleteMany: mockFcmDeleteMany },
          }),
      );
      const user = buildUserDue({
        id: 9,
        avatarKey: 'avatars/9.jpg',
        professionals: {
          id: 42,
          professionalDocuments: [
            { fileKey: 'docs/9/a.pdf' },
            { fileKey: null },
            { fileKey: 'docs/9/b.pdf' },
          ],
        },
      } as unknown);

      // Act
      const result = await service.anonymizeUser(user);

      // Assert
      expect(result).toEqual(['avatars/9.jpg', 'docs/9/a.pdf', 'docs/9/b.pdf']);
      expect(mockProfessionalsUpdate).toHaveBeenCalledWith({
        where: { id: 42 },
        data: { status: ProfessionalStatus.SUSPENDED, isActive: false },
      });
      expect(mockDocsUpdateMany).toHaveBeenCalledWith({
        where: { professionalId: 42 },
        data: { fileKey: null },
      });
    });
  });
});
