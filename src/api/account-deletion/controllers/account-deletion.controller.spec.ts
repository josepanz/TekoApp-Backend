import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';
import { UserStatus } from '@prisma/client';
import { AccountDeletionController } from './account-deletion.controller';
import { AccountDeletionService } from '../services/account-deletion.service';

const mockRequestDeletion = jest.fn();
const mockCancelDeletion = jest.fn();

const mockUser = { id: 1 } as unknown as IUserDataOnJwt;

describe('AccountDeletionController', () => {
  let controller: AccountDeletionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountDeletionController],
      providers: [
        {
          provide: AccountDeletionService,
          useValue: {
            requestDeletion: mockRequestDeletion,
            cancelDeletion: mockCancelDeletion,
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<AccountDeletionController>(
      AccountDeletionController,
    );
  });

  afterEach(() => jest.clearAllMocks());

  describe('requestDeletion', () => {
    it('debe delegar al service con el id del usuario autenticado', async () => {
      // Arrange
      const expected = {
        status: UserStatus.PENDING_DELETION,
        deletionRequestedAt: new Date(),
        deletionScheduledAt: new Date(),
      };
      mockRequestDeletion.mockResolvedValue(expected);

      // Act
      const result = await controller.requestDeletion({ user: mockUser });

      // Assert
      expect(mockRequestDeletion).toHaveBeenCalledWith(mockUser.id);
      expect(result).toBe(expected);
    });
  });

  describe('cancelDeletion', () => {
    it('debe delegar al service con el id del usuario autenticado', async () => {
      // Arrange
      const expected = { status: UserStatus.ACTIVE };
      mockCancelDeletion.mockResolvedValue(expected);

      // Act
      const result = await controller.cancelDeletion({ user: mockUser });

      // Assert
      expect(mockCancelDeletion).toHaveBeenCalledWith(mockUser.id);
      expect(result).toBe(expected);
    });
  });
});
