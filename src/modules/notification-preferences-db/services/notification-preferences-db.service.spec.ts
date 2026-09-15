import { Test, TestingModule } from '@nestjs/testing';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { NotificationPreferencesDbService } from './notification-preferences-db.service';

const mockFindUnique = jest.fn();
const mockUpsert = jest.fn();

const mockPrisma = {
  extended: {
    notificationPreferences: {
      findUnique: mockFindUnique,
      upsert: mockUpsert,
    },
  },
};

describe('NotificationPreferencesDbService', () => {
  let service: NotificationPreferencesDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationPreferencesDbService,
        { provide: PrismaDatasource, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<NotificationPreferencesDbService>(
      NotificationPreferencesDbService,
    );
  });

  afterEach(() => jest.clearAllMocks());

  describe('findByUserId', () => {
    it('debe buscar la fila de preferencias por el id interno del usuario', async () => {
      // Arrange
      const row = { id: 1, userId: 10, mutedTypes: ['promotion'] };
      mockFindUnique.mockResolvedValue(row);

      // Act
      const result = await service.findByUserId(10);

      // Assert
      expect(result).toEqual(row);
      expect(mockFindUnique).toHaveBeenCalledWith({ where: { userId: 10 } });
    });

    it('debe retornar null cuando el usuario nunca cambió sus preferencias', async () => {
      // Arrange
      mockFindUnique.mockResolvedValue(null);

      // Act
      const result = await service.findByUserId(10);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('upsertMutedTypes', () => {
    it('debe crear la fila con created_by cuando el usuario no tenía preferencias', async () => {
      // Arrange
      const updated = { id: 1, userId: 10, mutedTypes: ['promotion'] };
      mockUpsert.mockResolvedValue(updated);

      // Act
      const result = await service.upsertMutedTypes(10, ['promotion']);

      // Assert
      expect(result).toEqual(updated);
      expect(mockUpsert).toHaveBeenCalledWith({
        where: { userId: 10 },
        create: {
          userId: 10,
          mutedTypes: ['promotion'],
          createdBy: '10',
        },
        update: {
          mutedTypes: ['promotion'],
          lastChangedBy: '10',
        },
      });
    });

    it('debe poder vaciar la lista de tipos silenciados (reactivar todo)', async () => {
      // Arrange
      mockUpsert.mockResolvedValue({ id: 1, userId: 10, mutedTypes: [] });

      // Act
      await service.upsertMutedTypes(10, []);

      // Assert
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ mutedTypes: [] }) as object,
          update: expect.objectContaining({ mutedTypes: [] }) as object,
        }),
      );
    });
  });
});
