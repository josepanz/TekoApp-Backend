import { Test, TestingModule } from '@nestjs/testing';
import {
  DisputeReason,
  DisputeResolution,
  DisputeStatus,
} from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { PaymentDbService } from '@modules/payments-db/services/payment-db.service';
import { PaymentDisputesDbService } from './payment-disputes-db.service';

const mockCreate = jest.fn<Promise<unknown>, unknown[]>();
const mockFindUnique = jest.fn();
const mockFindMany = jest.fn();
const mockFindFirst = jest.fn();
const mockUpdateMany = jest.fn();
const mockCount = jest.fn();
const mockTransaction = jest.fn();
const mockExecuteRefund = jest.fn();

const mockPrisma = {
  extended: {
    paymentDisputes: {
      create: mockCreate,
      findUnique: mockFindUnique,
      findMany: mockFindMany,
      findFirst: mockFindFirst,
      updateMany: mockUpdateMany,
      count: mockCount,
    },
    $transaction: mockTransaction,
  },
};

describe('PaymentDisputesDbService', () => {
  let service: PaymentDisputesDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentDisputesDbService,
        { provide: PrismaDatasource, useValue: mockPrisma },
        {
          provide: PaymentDbService,
          useValue: { executeRefund: mockExecuteRefund },
        },
      ],
    }).compile();

    service = module.get<PaymentDisputesDbService>(PaymentDisputesDbService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('debe crear la disputa con los campos recibidos', async () => {
      // Arrange
      mockCreate.mockResolvedValue({ id: 1, referenceId: 'dsp-1' });

      // Act
      await service.create({
        paymentId: 10,
        openedByUserId: 5,
        reason: DisputeReason.SERVICE_NOT_PROVIDED,
        description: 'no llegó',
        evidenceKeys: ['s3/key1'],
        createdBy: 'user-ref',
      });

      // Assert
      const createCall = mockCreate.mock.calls[0]?.[0] as {
        data: {
          paymentId: number;
          openedByUserId: number;
          reason: DisputeReason;
          evidenceKeys: string[];
        };
      };
      expect(createCall.data).toMatchObject({
        paymentId: 10,
        openedByUserId: 5,
        reason: DisputeReason.SERVICE_NOT_PROVIDED,
        evidenceKeys: ['s3/key1'],
      });
    });
  });

  describe('findActiveDisputeForPayment', () => {
    it('debe filtrar por OPEN/UNDER_REVIEW', async () => {
      // Arrange
      mockFindFirst.mockResolvedValue(null);

      // Act
      await service.findActiveDisputeForPayment(10);

      // Assert
      expect(mockFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            paymentId: 10,
            status: { in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW] },
          },
        }),
      );
    });
  });

  describe('claim', () => {
    it('debe pasar de OPEN a UNDER_REVIEW de forma condicional', async () => {
      // Arrange
      mockUpdateMany.mockResolvedValue({ count: 1 });

      // Act
      const count = await service.claim(1, 99);

      // Assert
      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: { id: 1, status: DisputeStatus.OPEN },
        data: { status: DisputeStatus.UNDER_REVIEW, adjudicatedByUserId: 99 },
      });
      expect(count).toBe(1);
    });

    it('debe devolver 0 si otro staff ya la tomó', async () => {
      // Arrange
      mockUpdateMany.mockResolvedValue({ count: 0 });

      // Act
      const count = await service.claim(1, 99);

      // Assert
      expect(count).toBe(0);
    });
  });

  describe('withdraw', () => {
    it('debe retirar solo si sigue OPEN y pertenece a quien la abrió', async () => {
      // Arrange
      mockUpdateMany.mockResolvedValue({ count: 1 });

      // Act
      const count = await service.withdraw(1, 5);

      // Assert
      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: { id: 1, status: DisputeStatus.OPEN, openedByUserId: 5 },
        data: { status: DisputeStatus.WITHDRAWN },
      });
      expect(count).toBe(1);
    });
  });

  describe('resolve', () => {
    function mockTxWithDispute(dispute: {
      paymentId: number;
      referenceId: string;
    }) {
      const txUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
      const txFindUniqueOrThrow = jest.fn().mockResolvedValue(dispute);
      mockTransaction.mockImplementation(
        async (callback: (tx: unknown) => Promise<unknown>) =>
          callback({
            paymentDisputes: {
              updateMany: txUpdateMany,
              findUniqueOrThrow: txFindUniqueOrThrow,
            },
          }),
      );
      return { txUpdateMany, txFindUniqueOrThrow };
    }

    it('debe resolver a REJECTED sin disparar reembolso cuando resolution es NO_REFUND', async () => {
      // Arrange
      mockTxWithDispute({ paymentId: 10, referenceId: 'dsp-1' });

      // Act
      const count = await service.resolve(1, 99, {
        resolution: DisputeResolution.NO_REFUND,
        resolutionNotes: 'improcedente',
      });

      // Assert
      expect(count).toBe(1);
      expect(mockExecuteRefund).not.toHaveBeenCalled();
    });

    it('debe disparar executeRefund DENTRO de la misma transacción cuando resolution es FULL_REFUND', async () => {
      // Arrange
      mockTxWithDispute({ paymentId: 10, referenceId: 'dsp-1' });
      mockExecuteRefund.mockResolvedValue({});

      // Act
      const count = await service.resolve(1, 99, {
        resolution: DisputeResolution.FULL_REFUND,
        resolutionNotes: 'procede el reembolso total',
        refundAmount: 100,
      });

      // Assert
      expect(count).toBe(1);
      expect(mockExecuteRefund).toHaveBeenCalledWith(
        10,
        100,
        'procede el reembolso total',
        'dsp-1',
        expect.anything(),
      );
    });

    it('debe devolver 0 sin disparar reembolso si la disputa ya no es adjudicable', async () => {
      // Arrange
      const txUpdateMany = jest.fn().mockResolvedValue({ count: 0 });
      mockTransaction.mockImplementation(
        async (callback: (tx: unknown) => Promise<unknown>) =>
          callback({ paymentDisputes: { updateMany: txUpdateMany } }),
      );

      // Act
      const count = await service.resolve(1, 99, {
        resolution: DisputeResolution.FULL_REFUND,
        resolutionNotes: 'tarde',
        refundAmount: 50,
      });

      // Assert
      expect(count).toBe(0);
      expect(mockExecuteRefund).not.toHaveBeenCalled();
    });
  });

  describe('countOpenDisputesForUser', () => {
    it('debe incluir el professionalId en el OR solo cuando se recibe', async () => {
      // Arrange
      mockCount.mockResolvedValue(0);

      // Act
      await service.countOpenDisputesForUser(1, 42);

      // Assert
      expect(mockCount).toHaveBeenCalledWith({
        where: {
          status: { in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW] },
          OR: [
            { openedByUserId: 1 },
            { payment: { userId: 1 } },
            { payment: { professionalId: 42 } },
          ],
        },
      });
    });

    it('debe omitir el filtro por professionalId cuando el usuario no tiene perfil profesional', async () => {
      // Arrange
      mockCount.mockResolvedValue(0);

      // Act
      await service.countOpenDisputesForUser(1, null);

      // Assert
      expect(mockCount).toHaveBeenCalledWith({
        where: {
          status: { in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW] },
          OR: [{ openedByUserId: 1 }, { payment: { userId: 1 } }],
        },
      });
    });
  });
});
