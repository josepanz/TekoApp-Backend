import { Test, TestingModule } from '@nestjs/testing';
import { UserStatus } from '@prisma/client';
import { APP_CONFIG } from '@core/config/config-loader';
import { AccountDeletionDbService } from '@modules/account-deletion-db/services/account-deletion-db.service';
import { ProfessionalsDbService } from '@modules/professionals-db/services/professionals-db.service';
import { ServicesDbService } from '@modules/services-db/services/services-db.service';
import { PaymentDbService } from '@modules/payments-db/services/payment-db.service';
import { ContractsDbService } from '@modules/contracts-db/services/contracts-db.service';
import { AccountDeletionService } from './account-deletion.service';

const mockRequestDeletion = jest.fn();
const mockCancelDeletion = jest.fn();
const mockFindProfessionalIdByUserId = jest.fn();
const mockCountServices = jest.fn();
const mockCountPayments = jest.fn();
const mockCountContracts = jest.fn();

describe('AccountDeletionService', () => {
  let service: AccountDeletionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountDeletionService,
        {
          provide: AccountDeletionDbService,
          useValue: {
            requestDeletion: mockRequestDeletion,
            cancelDeletion: mockCancelDeletion,
          },
        },
        {
          provide: ProfessionalsDbService,
          useValue: {
            findProfessionalIdByUserId: mockFindProfessionalIdByUserId,
          },
        },
        {
          provide: ServicesDbService,
          useValue: { countServices: mockCountServices },
        },
        {
          provide: PaymentDbService,
          useValue: { countPayments: mockCountPayments },
        },
        {
          provide: ContractsDbService,
          useValue: { countContracts: mockCountContracts },
        },
        {
          provide: APP_CONFIG.KEY,
          useValue: { accountDeletion: { gracePeriodDays: 14 } },
        },
      ],
    }).compile();

    service = module.get<AccountDeletionService>(AccountDeletionService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('requestDeletion', () => {
    it('debe consultar solo por userId cuando no tiene perfil profesional', async () => {
      // Arrange
      mockFindProfessionalIdByUserId.mockResolvedValue(null);
      mockCountServices.mockResolvedValue(0);
      mockCountPayments.mockResolvedValue(0);
      mockCountContracts.mockResolvedValue(0);
      mockRequestDeletion.mockResolvedValue(1);

      // Act
      await service.requestDeletion(1);

      // Assert
      expect(mockCountServices).toHaveBeenCalledWith(
        expect.objectContaining({ OR: [{ userId: 1 }] }),
      );
      expect(mockCountContracts).toHaveBeenCalledWith(
        expect.objectContaining({ OR: [{ clientUserId: 1 }] }),
      );
    });

    it('debe incluir el professionalId en el OR cuando el usuario tiene perfil profesional', async () => {
      // Arrange
      mockFindProfessionalIdByUserId.mockResolvedValue(42);
      mockCountServices.mockResolvedValue(0);
      mockCountPayments.mockResolvedValue(0);
      mockCountContracts.mockResolvedValue(0);
      mockRequestDeletion.mockResolvedValue(1);

      // Act
      await service.requestDeletion(1);

      // Assert
      expect(mockCountServices).toHaveBeenCalledWith(
        expect.objectContaining({
          OR: [{ userId: 1 }, { professionalId: 42 }],
        }),
      );
      expect(mockCountContracts).toHaveBeenCalledWith(
        expect.objectContaining({
          OR: [{ clientUserId: 1 }, { professionalId: 42 }],
        }),
      );
    });

    it('debe lanzar ConflictException con el detalle de bloqueantes cuando hay alguno', async () => {
      // Arrange
      mockFindProfessionalIdByUserId.mockResolvedValue(null);
      mockCountServices.mockResolvedValue(1);
      mockCountPayments.mockResolvedValue(2);
      mockCountContracts.mockResolvedValue(0);

      // Act & Assert
      await expect(service.requestDeletion(1)).rejects.toMatchObject({
        response: {
          errorCode: 'DELETION_BLOCKED',
          details: {
            blockers: [
              { type: 'ACTIVE_SERVICE', count: 1 },
              { type: 'PENDING_PAYMENT', count: 2 },
            ],
          },
        },
      });
      expect(mockRequestDeletion).not.toHaveBeenCalled();
    });

    it('debe calcular deletionScheduledAt sumando los días de gracia configurados', async () => {
      // Arrange
      mockFindProfessionalIdByUserId.mockResolvedValue(null);
      mockCountServices.mockResolvedValue(0);
      mockCountPayments.mockResolvedValue(0);
      mockCountContracts.mockResolvedValue(0);
      mockRequestDeletion.mockResolvedValue(1);

      // Act
      const result = await service.requestDeletion(1);

      // Assert
      expect(result.status).toBe(UserStatus.PENDING_DELETION);
      const diffDays =
        (result.deletionScheduledAt.getTime() -
          result.deletionRequestedAt.getTime()) /
        (24 * 60 * 60 * 1000);
      expect(diffDays).toBeCloseTo(14, 5);
    });

    it('debe lanzar ConflictException DELETION_ALREADY_REQUESTED si ya estaba pedido', async () => {
      // Arrange
      mockFindProfessionalIdByUserId.mockResolvedValue(null);
      mockCountServices.mockResolvedValue(0);
      mockCountPayments.mockResolvedValue(0);
      mockCountContracts.mockResolvedValue(0);
      mockRequestDeletion.mockResolvedValue(0);

      // Act & Assert
      await expect(service.requestDeletion(1)).rejects.toMatchObject({
        response: { errorCode: 'DELETION_ALREADY_REQUESTED' },
      });
    });
  });

  describe('cancelDeletion', () => {
    it('debe devolver status ACTIVE cuando la cancelación aplica', async () => {
      // Arrange
      mockCancelDeletion.mockResolvedValue(1);

      // Act
      const result = await service.cancelDeletion(1);

      // Assert
      expect(result).toEqual({ status: UserStatus.ACTIVE });
    });

    it('debe lanzar BadRequestException DELETION_NOT_REQUESTED si no había solicitud activa', async () => {
      // Arrange
      mockCancelDeletion.mockResolvedValue(0);

      // Act & Assert
      await expect(service.cancelDeletion(1)).rejects.toMatchObject({
        response: { errorCode: 'DELETION_NOT_REQUESTED' },
      });
    });
  });
});
