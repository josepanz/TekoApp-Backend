import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { NotificationPreferencesController } from './notification-preferences.controller';
import { NotificationPreferencesService } from '../services/notification-preferences.service';
import { NotificationType } from '@modules/notifications-db/enums/notification-type.enum';

const mockGetPreferences = jest.fn();
const mockUpdatePreference = jest.fn();

describe('NotificationPreferencesController', () => {
  let controller: NotificationPreferencesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationPreferencesController],
      providers: [
        {
          provide: NotificationPreferencesService,
          useValue: {
            getPreferences: mockGetPreferences,
            updatePreference: mockUpdatePreference,
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<NotificationPreferencesController>(
      NotificationPreferencesController,
    );
  });

  afterEach(() => jest.clearAllMocks());

  describe('getMyPreferences', () => {
    it('debe delegar en el service usando el id del usuario autenticado', async () => {
      // Arrange
      const expected = {
        preferences: [{ type: NotificationType.PROMOTION, enabled: true }],
      };
      mockGetPreferences.mockResolvedValue(expected);
      const req = { user: { id: 42 } } as never;

      // Act
      const result = await controller.getMyPreferences(req);

      // Assert
      expect(mockGetPreferences).toHaveBeenCalledWith(42);
      expect(result).toEqual(expected);
    });
  });

  describe('updateMyPreference', () => {
    it('debe delegar la actualización en el service con el id del usuario autenticado', async () => {
      // Arrange
      const dto = { type: NotificationType.PROMOTION, enabled: false };
      const expected = {
        preferences: [{ type: NotificationType.PROMOTION, enabled: false }],
      };
      mockUpdatePreference.mockResolvedValue(expected);
      const req = { user: { id: 42 } } as never;

      // Act
      const result = await controller.updateMyPreference(dto, req);

      // Assert
      expect(mockUpdatePreference).toHaveBeenCalledWith(42, dto);
      expect(result).toEqual(expected);
    });
  });
});
