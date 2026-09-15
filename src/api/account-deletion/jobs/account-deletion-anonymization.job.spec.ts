import { Test, TestingModule } from '@nestjs/testing';
import { AccountDeletionDbService } from '@modules/account-deletion-db/services/account-deletion-db.service';
import { StorageService } from '@modules/storage/services/storage.service';
import { AccountDeletionAnonymizationJob } from './account-deletion-anonymization.job';

const mockFindDueForAnonymization = jest.fn();
const mockAnonymizeUser = jest.fn();
const mockDeleteFileBatch = jest.fn();

describe('AccountDeletionAnonymizationJob', () => {
  let job: AccountDeletionAnonymizationJob;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountDeletionAnonymizationJob,
        {
          provide: AccountDeletionDbService,
          useValue: {
            findDueForAnonymization: mockFindDueForAnonymization,
            anonymizeUser: mockAnonymizeUser,
          },
        },
        {
          provide: StorageService,
          useValue: { deleteFileBatch: mockDeleteFileBatch },
        },
      ],
    }).compile();

    job = module.get<AccountDeletionAnonymizationJob>(
      AccountDeletionAnonymizationJob,
    );
  });

  afterEach(() => jest.clearAllMocks());

  describe('run', () => {
    it('no hace nada si no hay cuentas vencidas', async () => {
      // Arrange
      mockFindDueForAnonymization.mockResolvedValue([]);

      // Act
      await job.run();

      // Assert
      expect(mockAnonymizeUser).not.toHaveBeenCalled();
      expect(mockDeleteFileBatch).not.toHaveBeenCalled();
    });

    it('debe anonimizar cada cuenta vencida y borrar sus keys de S3', async () => {
      // Arrange
      const user1 = { id: 1 };
      const user2 = { id: 2 };
      mockFindDueForAnonymization.mockResolvedValue([user1, user2]);
      mockAnonymizeUser
        .mockResolvedValueOnce(['avatars/1.jpg'])
        .mockResolvedValueOnce([]);

      // Act
      await job.run();

      // Assert
      expect(mockAnonymizeUser).toHaveBeenCalledWith(user1);
      expect(mockAnonymizeUser).toHaveBeenCalledWith(user2);
      expect(mockDeleteFileBatch).toHaveBeenCalledTimes(1);
      expect(mockDeleteFileBatch).toHaveBeenCalledWith(['avatars/1.jpg']);
    });

    it('no debe borrar nada de S3 si anonymizeUser devuelve null (se canceló mientras tanto)', async () => {
      // Arrange
      const user1 = { id: 1 };
      mockFindDueForAnonymization.mockResolvedValue([user1]);
      mockAnonymizeUser.mockResolvedValue(null);

      // Act
      await job.run();

      // Assert
      expect(mockDeleteFileBatch).not.toHaveBeenCalled();
    });
  });
});
