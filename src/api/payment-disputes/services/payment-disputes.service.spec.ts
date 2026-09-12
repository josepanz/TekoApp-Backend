import { Test, TestingModule } from '@nestjs/testing';
import {
  DisputeReason,
  DisputeResolution,
  DisputeStatus,
  PaymentStatus,
} from '@prisma/client';
import { PaymentDbService } from '@modules/payments-db/services/payment-db.service';
import { ProfessionalsDbService } from '@modules/professionals-db/services/professionals-db.service';
import { PaymentDisputesDbService } from '@modules/payment-disputes-db/services/payment-disputes-db.service';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';
import { PERMISSIONS } from '@common/enum/permissions.enum';
import { PaymentDisputesService } from './payment-disputes.service';

const mockFindPaymentByReferenceId = jest.fn();
const mockFindProfessionalById = jest.fn();
const mockDbCreate = jest.fn();
const mockDbFindActiveDisputeForPayment = jest.fn();
const mockDbFindByPaymentId = jest.fn();
const mockDbFindByReferenceId = jest.fn();
const mockDbFindQueuePaginated = jest.fn();
const mockDbClaim = jest.fn();
const mockDbResolve = jest.fn();
const mockDbWithdraw = jest.fn();

const fakePayment = {
  id: 10,
  referenceId: 'pay-1',
  userId: 1,
  professionalId: 20,
  status: PaymentStatus.COMPLETED,
};

const fakeParty = { referenceId: 'user-ref', firstName: 'A', lastName: 'B' };

const fakeDisputeRow = {
  id: 100,
  referenceId: 'dsp-1',
  paymentId: 10,
  openedByUserId: 1,
  reason: DisputeReason.SERVICE_NOT_PROVIDED,
  description: 'no llegó',
  evidenceKeys: [],
  status: DisputeStatus.OPEN,
  adjudicatedByUserId: null,
  resolution: null,
  resolutionNotes: null,
  refundAmount: null,
  resolvedAt: null,
  createdAt: new Date(),
  payment: { referenceId: 'pay-1' },
  openedBy: fakeParty,
  adjudicatedBy: null,
};

function fakeUser(overrides: Partial<IUserDataOnJwt> = {}): IUserDataOnJwt {
  return {
    id: 1,
    referenceId: 'user-ref',
    email: 'a@a.com',
    firstName: 'A',
    lastName: 'B',
    accessLevelId: 1,
    userStatus: 'ACTIVE',
    profileStatus: 'COMPLETE',
    permissions: [],
    roles: [],
    ...overrides,
  };
}

describe('PaymentDisputesService', () => {
  let service: PaymentDisputesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentDisputesService,
        {
          provide: PaymentDbService,
          useValue: { findPaymentByReferenceId: mockFindPaymentByReferenceId },
        },
        {
          provide: ProfessionalsDbService,
          useValue: { findById: mockFindProfessionalById },
        },
        {
          provide: PaymentDisputesDbService,
          useValue: {
            create: mockDbCreate,
            findActiveDisputeForPayment: mockDbFindActiveDisputeForPayment,
            findByPaymentId: mockDbFindByPaymentId,
            findByReferenceId: mockDbFindByReferenceId,
            findQueuePaginated: mockDbFindQueuePaginated,
            claim: mockDbClaim,
            resolve: mockDbResolve,
            withdraw: mockDbWithdraw,
          },
        },
      ],
    }).compile();

    service = module.get<PaymentDisputesService>(PaymentDisputesService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('openDispute', () => {
    it('debe crear la disputa cuando quien llama es el cliente del pago', async () => {
      // Arrange
      mockFindPaymentByReferenceId.mockResolvedValue(fakePayment);
      mockFindProfessionalById.mockResolvedValue({ userId: 999 });
      mockDbFindActiveDisputeForPayment.mockResolvedValue(null);
      mockDbCreate.mockResolvedValue(fakeDisputeRow);

      // Act
      const result = await service.openDispute('pay-1', 1, 'user-ref', {
        reason: DisputeReason.SERVICE_NOT_PROVIDED,
        description: 'no llegó',
      });

      // Assert
      expect(mockDbCreate).toHaveBeenCalledWith(
        expect.objectContaining({ paymentId: 10, openedByUserId: 1 }),
      );
      expect(result.referenceId).toBe('dsp-1');
    });

    it('debe rechazar con 403 si quien llama no es cliente ni profesional del pago', async () => {
      // Arrange
      mockFindPaymentByReferenceId.mockResolvedValue(fakePayment);
      mockFindProfessionalById.mockResolvedValue({ userId: 999 });

      // Act & Assert
      await expect(
        service.openDispute('pay-1', 5, 'ref', {
          reason: DisputeReason.OTHER,
          description: 'x'.repeat(15),
        }),
      ).rejects.toThrow();
      expect(mockDbCreate).not.toHaveBeenCalled();
    });

    it('debe rechazar con 400 si el pago no está en un estado disputable', async () => {
      // Arrange
      mockFindPaymentByReferenceId.mockResolvedValue({
        ...fakePayment,
        status: PaymentStatus.PENDING,
      });
      mockFindProfessionalById.mockResolvedValue({ userId: 999 });

      // Act & Assert
      await expect(
        service.openDispute('pay-1', 1, 'ref', {
          reason: DisputeReason.OTHER,
          description: 'x'.repeat(15),
        }),
      ).rejects.toThrow();
    });

    it('debe rechazar con 409 si ya hay una disputa OPEN/UNDER_REVIEW sobre el mismo pago', async () => {
      // Arrange
      mockFindPaymentByReferenceId.mockResolvedValue(fakePayment);
      mockFindProfessionalById.mockResolvedValue({ userId: 999 });
      mockDbFindActiveDisputeForPayment.mockResolvedValue({ id: 1 });

      // Act & Assert
      await expect(
        service.openDispute('pay-1', 1, 'ref', {
          reason: DisputeReason.OTHER,
          description: 'x'.repeat(15),
        }),
      ).rejects.toThrow();
      expect(mockDbCreate).not.toHaveBeenCalled();
    });
  });

  describe('listForPayment', () => {
    it('debe permitir al staff con payments.audit:read aunque no sea parte del pago', async () => {
      // Arrange
      mockFindPaymentByReferenceId.mockResolvedValue(fakePayment);
      mockFindProfessionalById.mockResolvedValue({ userId: 999 });
      mockDbFindByPaymentId.mockResolvedValue([fakeDisputeRow]);

      // Act
      const result = await service.listForPayment(
        'pay-1',
        fakeUser({ id: 555, permissions: [PERMISSIONS.PAYMENTS.AUDIT_VIEW] }),
      );

      // Assert
      expect(result.data).toHaveLength(1);
    });

    it('debe rechazar con 403 a un usuario que no es parte ni staff', async () => {
      // Arrange
      mockFindPaymentByReferenceId.mockResolvedValue(fakePayment);
      mockFindProfessionalById.mockResolvedValue({ userId: 999 });

      // Act & Assert
      await expect(
        service.listForPayment('pay-1', fakeUser({ id: 555 })),
      ).rejects.toThrow();
    });
  });

  describe('claim', () => {
    it('debe rechazar con 409 si otro staff ya la tomó', async () => {
      // Arrange
      mockDbFindByReferenceId.mockResolvedValue(fakeDisputeRow);
      mockDbClaim.mockResolvedValue(0);

      // Act & Assert
      await expect(service.claim('dsp-1', 99)).rejects.toThrow();
    });

    it('debe devolver la disputa actualizada cuando el claim aplica', async () => {
      // Arrange
      mockDbFindByReferenceId
        .mockResolvedValueOnce(fakeDisputeRow)
        .mockResolvedValueOnce({
          ...fakeDisputeRow,
          status: DisputeStatus.UNDER_REVIEW,
        });
      mockDbClaim.mockResolvedValue(1);

      // Act
      const result = await service.claim('dsp-1', 99);

      // Assert
      expect(result.status).toBe(DisputeStatus.UNDER_REVIEW);
    });
  });

  describe('resolve', () => {
    it('debe rechazar con 400 si la resolución reembolsa y falta refundAmount', async () => {
      // Arrange
      mockDbFindByReferenceId.mockResolvedValue(fakeDisputeRow);

      // Act & Assert
      await expect(
        service.resolve('dsp-1', 99, {
          resolution: DisputeResolution.FULL_REFUND,
          resolutionNotes: 'procede',
        }),
      ).rejects.toThrow();
      expect(mockDbResolve).not.toHaveBeenCalled();
    });

    it('debe rechazar con 409 si la disputa ya no es adjudicable', async () => {
      // Arrange
      mockDbFindByReferenceId.mockResolvedValue(fakeDisputeRow);
      mockDbResolve.mockResolvedValue(0);

      // Act & Assert
      await expect(
        service.resolve('dsp-1', 99, {
          resolution: DisputeResolution.NO_REFUND,
          resolutionNotes: 'improcedente',
        }),
      ).rejects.toThrow();
    });

    it('debe resolver y devolver la disputa final', async () => {
      // Arrange
      mockDbFindByReferenceId
        .mockResolvedValueOnce(fakeDisputeRow)
        .mockResolvedValueOnce({
          ...fakeDisputeRow,
          status: DisputeStatus.REJECTED,
          resolution: DisputeResolution.NO_REFUND,
        });
      mockDbResolve.mockResolvedValue(1);

      // Act
      const result = await service.resolve('dsp-1', 99, {
        resolution: DisputeResolution.NO_REFUND,
        resolutionNotes: 'improcedente',
      });

      // Assert
      expect(result.status).toBe(DisputeStatus.REJECTED);
    });
  });

  describe('withdraw', () => {
    it('debe rechazar con 404 si la disputa no pertenece al pago de la URL', async () => {
      // Arrange
      mockFindPaymentByReferenceId.mockResolvedValue(fakePayment);
      mockDbFindByReferenceId.mockResolvedValue({
        ...fakeDisputeRow,
        payment: { referenceId: 'otro-pago' },
      });

      // Act & Assert
      await expect(service.withdraw('pay-1', 'dsp-1', 1)).rejects.toThrow();
      expect(mockDbWithdraw).not.toHaveBeenCalled();
    });

    it('debe rechazar con 403 si quien llama no es quien abrió la disputa', async () => {
      // Arrange
      mockFindPaymentByReferenceId.mockResolvedValue(fakePayment);
      mockDbFindByReferenceId.mockResolvedValue(fakeDisputeRow);

      // Act & Assert
      await expect(service.withdraw('pay-1', 'dsp-1', 999)).rejects.toThrow();
      expect(mockDbWithdraw).not.toHaveBeenCalled();
    });

    it('debe rechazar con 409 si la disputa ya no está OPEN', async () => {
      // Arrange
      mockFindPaymentByReferenceId.mockResolvedValue(fakePayment);
      mockDbFindByReferenceId.mockResolvedValue({
        ...fakeDisputeRow,
        status: DisputeStatus.UNDER_REVIEW,
      });

      // Act & Assert
      await expect(service.withdraw('pay-1', 'dsp-1', 1)).rejects.toThrow();
      expect(mockDbWithdraw).not.toHaveBeenCalled();
    });

    it('debe retirar la disputa cuando corresponde', async () => {
      // Arrange
      mockFindPaymentByReferenceId.mockResolvedValue(fakePayment);
      mockDbFindByReferenceId
        .mockResolvedValueOnce(fakeDisputeRow)
        .mockResolvedValueOnce({
          ...fakeDisputeRow,
          status: DisputeStatus.WITHDRAWN,
        });
      mockDbWithdraw.mockResolvedValue(1);

      // Act
      const result = await service.withdraw('pay-1', 'dsp-1', 1);

      // Assert
      expect(result.status).toBe(DisputeStatus.WITHDRAWN);
    });
  });
});
