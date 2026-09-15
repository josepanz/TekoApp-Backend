import { Test, TestingModule } from '@nestjs/testing';
import { NotificationPreferencesService } from './notification-preferences.service';
import { NotificationPreferencesDbService } from '@modules/notification-preferences-db/services/notification-preferences-db.service';
import { NotificationType } from '@modules/notifications-db/enums/notification-type.enum';

const mockFindByUserId = jest.fn();
const mockUpsertMutedTypes = jest.fn();

describe('NotificationPreferencesService', () => {
  let service: NotificationPreferencesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationPreferencesService,
        {
          provide: NotificationPreferencesDbService,
          useValue: {
            findByUserId: mockFindByUserId,
            upsertMutedTypes: mockUpsertMutedTypes,
          },
        },
      ],
    }).compile();

    service = module.get<NotificationPreferencesService>(
      NotificationPreferencesService,
    );
  });

  afterEach(() => jest.clearAllMocks());

  describe('getPreferences', () => {
    it('debe retornar todos los tipos habilitados cuando el usuario no tiene fila (default)', async () => {
      // Arrange
      mockFindByUserId.mockResolvedValue(null);

      // Act
      const result = await service.getPreferences(10);

      // Assert
      expect(result.preferences).toHaveLength(
        Object.values(NotificationType).length,
      );
      expect(result.preferences.every((p) => p.enabled)).toBe(true);
    });

    it('debe marcar como deshabilitados solo los tipos que están en mutedTypes', async () => {
      // Arrange
      mockFindByUserId.mockResolvedValue({
        userId: 10,
        mutedTypes: [NotificationType.PROMOTION],
      });

      // Act
      const result = await service.getPreferences(10);

      // Assert
      const promotion = result.preferences.find(
        (p) => p.type === NotificationType.PROMOTION,
      );
      const other = result.preferences.find(
        (p) => p.type === NotificationType.SERVICE_ACCEPTED,
      );
      expect(promotion?.enabled).toBe(false);
      expect(other?.enabled).toBe(true);
    });

    it('debe tratar un mutedTypes corrupto/no-array como sin exclusiones (defensivo)', async () => {
      // Arrange — el campo es JSON sin contrato de forma a nivel de DB (ver schema.prisma).
      mockFindByUserId.mockResolvedValue({ userId: 10, mutedTypes: 'oops' });

      // Act
      const result = await service.getPreferences(10);

      // Assert
      expect(result.preferences.every((p) => p.enabled)).toBe(true);
    });
  });

  describe('updatePreference', () => {
    it('debe agregar el tipo a mutedTypes cuando enabled=false', async () => {
      // Arrange
      mockFindByUserId
        .mockResolvedValueOnce({ userId: 10, mutedTypes: [] })
        .mockResolvedValueOnce({
          userId: 10,
          mutedTypes: [NotificationType.PROMOTION],
        });
      mockUpsertMutedTypes.mockResolvedValue({
        userId: 10,
        mutedTypes: [NotificationType.PROMOTION],
      });

      // Act
      await service.updatePreference(10, {
        type: NotificationType.PROMOTION,
        enabled: false,
      });

      // Assert
      expect(mockUpsertMutedTypes).toHaveBeenCalledWith(10, [
        NotificationType.PROMOTION,
      ]);
    });

    it('debe quitar el tipo de mutedTypes cuando enabled=true', async () => {
      // Arrange
      mockFindByUserId
        .mockResolvedValueOnce({
          userId: 10,
          mutedTypes: [NotificationType.PROMOTION, NotificationType.SYSTEM],
        })
        .mockResolvedValueOnce({
          userId: 10,
          mutedTypes: [NotificationType.SYSTEM],
        });
      mockUpsertMutedTypes.mockResolvedValue({
        userId: 10,
        mutedTypes: [NotificationType.SYSTEM],
      });

      // Act
      const result = await service.updatePreference(10, {
        type: NotificationType.PROMOTION,
        enabled: true,
      });

      // Assert
      expect(mockUpsertMutedTypes).toHaveBeenCalledWith(10, [
        NotificationType.SYSTEM,
      ]);
      const promotion = result.preferences.find(
        (p) => p.type === NotificationType.PROMOTION,
      );
      expect(promotion?.enabled).toBe(true);
    });

    it('no debe duplicar el tipo si ya estaba silenciado y se vuelve a desactivar', async () => {
      // Arrange
      mockFindByUserId
        .mockResolvedValueOnce({
          userId: 10,
          mutedTypes: [NotificationType.PROMOTION],
        })
        .mockResolvedValueOnce({
          userId: 10,
          mutedTypes: [NotificationType.PROMOTION],
        });
      mockUpsertMutedTypes.mockResolvedValue({
        userId: 10,
        mutedTypes: [NotificationType.PROMOTION],
      });

      // Act
      await service.updatePreference(10, {
        type: NotificationType.PROMOTION,
        enabled: false,
      });

      // Assert
      expect(mockUpsertMutedTypes).toHaveBeenCalledWith(10, [
        NotificationType.PROMOTION,
      ]);
    });
  });

  describe('isEnabled', () => {
    it('debe retornar true cuando el tipo no está silenciado', async () => {
      // Arrange
      mockFindByUserId.mockResolvedValue({ userId: 10, mutedTypes: [] });

      // Act
      const result = await service.isEnabled(
        10,
        NotificationType.SERVICE_ACCEPTED,
      );

      // Assert
      expect(result).toBe(true);
    });

    it('debe retornar false cuando el tipo está en mutedTypes', async () => {
      // Arrange
      mockFindByUserId.mockResolvedValue({
        userId: 10,
        mutedTypes: [NotificationType.SERVICE_ACCEPTED],
      });

      // Act
      const result = await service.isEnabled(
        10,
        NotificationType.SERVICE_ACCEPTED,
      );

      // Assert
      expect(result).toBe(false);
    });
  });
});
