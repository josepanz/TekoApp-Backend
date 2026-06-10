import { Test, TestingModule } from '@nestjs/testing';
import {
  PaymentStatus,
  TransactionStatus,
  TransactionType,
  Prisma,
} from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { PaymentDbService } from './payment-db.service';

// ── Mock functions ─────────────────────────────────────────────────────────────
const mockPaymentsFindFirst = jest.fn();
const mockPaymentsFindMany = jest.fn();
const mockPaymentsFindUnique = jest.fn();
const mockPaymentsCreate = jest.fn();
const mockPaymentsUpdate = jest.fn();
const mockPaymentsAggregate = jest.fn();
const mockPaymentsCount = jest.fn();

const mockPaymentMethodFindFirst = jest.fn();
const mockPaymentMethodFindMany = jest.fn();
const mockPaymentMethodCreate = jest.fn();
const mockPaymentMethodUpdate = jest.fn();
const mockPaymentMethodUpdateMany = jest.fn();
const mockPaymentMethodCount = jest.fn();

const mockTransactionFindUnique = jest.fn();
const mockTransactionCreate = jest.fn();
const mockTransactionUpdate = jest.fn();

const mockQueryRaw = jest.fn();
const mockTransaction = jest.fn();

const mockPrisma = {
  extended: {
    payments: {
      findFirst: mockPaymentsFindFirst,
      findMany: mockPaymentsFindMany,
      findUnique: mockPaymentsFindUnique,
      create: mockPaymentsCreate,
      update: mockPaymentsUpdate,
      aggregate: mockPaymentsAggregate,
      count: mockPaymentsCount,
    },
    paymentMethodEntity: {
      findFirst: mockPaymentMethodFindFirst,
      findMany: mockPaymentMethodFindMany,
      create: mockPaymentMethodCreate,
      update: mockPaymentMethodUpdate,
      updateMany: mockPaymentMethodUpdateMany,
      count: mockPaymentMethodCount,
    },
    paymentTransaction: {
      findUnique: mockTransactionFindUnique,
      create: mockTransactionCreate,
      update: mockTransactionUpdate,
    },
    $queryRaw: mockQueryRaw,
    $transaction: mockTransaction,
  },
};

// ── Fixtures ──────────────────────────────────────────────────────────────────
const fakePayment = {
  id: 'pay-1',
  userId: 10,
  professionalId: 20,
  serviceRequestId: 'req-1',
  totalAmount: new Prisma.Decimal(1500),
  platformFee: new Prisma.Decimal(150),
  status: PaymentStatus.PENDING,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const fakePaymentMethod = {
  id: 'pm-1',
  userId: 10,
  isDefault: false,
  isActive: true,
};

const fakeTransaction = {
  id: 'txn-1',
  paymentId: 'pay-1',
  externalTransactionId: 'ext-123',
  status: TransactionStatus.PENDING,
  type: TransactionType.PAYMENT,
};

describe('PaymentDbService', () => {
  let service: PaymentDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentDbService,
        { provide: PrismaDatasource, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PaymentDbService>(PaymentDbService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── findExistingPayment ──────────────────────────────────────────────────────
  describe('findExistingPayment', () => {
    it('debe retornar el pago existente para un usuario y solicitud dados', async () => {
      // Arrange
      mockPaymentsFindFirst.mockResolvedValue(fakePayment);

      // Act
      const result = await service.findExistingPayment(10, 'req-1');

      // Assert
      expect(result).toEqual(fakePayment);
      expect(mockPaymentsFindFirst).toHaveBeenCalledWith({
        where: { userId: 10, serviceRequestId: 'req-1' },
      });
    });

    it('debe retornar null cuando no existe pago para la combinación usuario/solicitud', async () => {
      // Arrange
      mockPaymentsFindFirst.mockResolvedValue(null);

      // Act
      const result = await service.findExistingPayment(99, 'req-999');

      // Assert
      expect(result).toBeNull();
    });
  });

  // ── createPaymentWithTransaction ─────────────────────────────────────────────
  describe('createPaymentWithTransaction', () => {
    it('debe crear el pago y su transacción dentro de una transacción ACID y retornar el pago', async () => {
      // Arrange
      mockTransaction.mockImplementation(
        async (callback: (tx: Record<string, unknown>) => Promise<unknown>) => {
          const txClient = {
            payments: { create: jest.fn().mockResolvedValue(fakePayment) },
            paymentTransaction: { create: jest.fn().mockResolvedValue({}) },
          };
          return callback(txClient);
        },
      );

      const data = {
        userId: 10,
        serviceRequestId: 'req-1',
        amount: 1500,
        totalAmount: 1500,
        platformFee: 150,
        currencyCode: 'PYG',
        paymentMethod: 'CREDIT_CARD',
        paymentProvider: 'BANCARD',
        transactionId: 'txn-ext-123',
        status: PaymentStatus.PENDING,
        professionalId: 20,
      } as unknown as Omit<
        Prisma.PaymentsUncheckedCreateInput,
        'id' | 'createdAt' | 'updatedAt'
      >;

      // Act
      const result = await service.createPaymentWithTransaction(
        data,
        'ext-txn-123',
      );

      // Assert
      expect(mockTransaction).toHaveBeenCalled();
      expect(result).toEqual(fakePayment);
    });
  });

  // ── findAllPayments ──────────────────────────────────────────────────────────
  describe('findAllPayments', () => {
    it('debe retornar todos los pagos sin filtros cuando no se proporcionan parámetros', async () => {
      // Arrange
      mockPaymentsFindMany.mockResolvedValue([fakePayment]);

      // Act
      const result = await service.findAllPayments();

      // Assert
      expect(result).toEqual([fakePayment]);
      expect(mockPaymentsFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });

    it('debe filtrar por userId cuando se proporciona', async () => {
      // Arrange
      mockPaymentsFindMany.mockResolvedValue([fakePayment]);

      // Act
      await service.findAllPayments(10);

      // Assert
      expect(mockPaymentsFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 10 }) as object,
        }),
      );
    });

    it('debe filtrar por status cuando se proporciona', async () => {
      // Arrange
      mockPaymentsFindMany.mockResolvedValue([]);

      // Act
      await service.findAllPayments(
        undefined,
        undefined,
        PaymentStatus.COMPLETED,
      );

      // Assert
      expect(mockPaymentsFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: PaymentStatus.COMPLETED,
          }) as object,
        }),
      );
    });
  });

  // ── findPaymentById ──────────────────────────────────────────────────────────
  describe('findPaymentById', () => {
    it('debe retornar el pago cuando existe el ID', async () => {
      // Arrange
      mockPaymentsFindUnique.mockResolvedValue(fakePayment);

      // Act
      const result = await service.findPaymentById('pay-1');

      // Assert
      expect(result).toEqual(fakePayment);
      expect(mockPaymentsFindUnique).toHaveBeenCalledWith({
        where: { id: 'pay-1' },
      });
    });

    it('debe retornar null cuando no existe el pago', async () => {
      // Arrange
      mockPaymentsFindUnique.mockResolvedValue(null);

      // Act
      const result = await service.findPaymentById('pay-999');

      // Assert
      expect(result).toBeNull();
    });
  });

  // ── updatePayment ────────────────────────────────────────────────────────────
  describe('updatePayment', () => {
    it('debe actualizar y retornar el pago con los nuevos datos', async () => {
      // Arrange
      const updated = { ...fakePayment, status: PaymentStatus.COMPLETED };
      mockPaymentsUpdate.mockResolvedValue(updated);

      // Act
      const result = await service.updatePayment('pay-1', {
        status: PaymentStatus.COMPLETED,
      });

      // Assert
      expect(result).toEqual(updated);
      expect(mockPaymentsUpdate).toHaveBeenCalledWith({
        where: { id: 'pay-1' },
        data: { status: PaymentStatus.COMPLETED },
      });
    });
  });

  // ── clearDefaultPaymentMethods ───────────────────────────────────────────────
  describe('clearDefaultPaymentMethods', () => {
    it('debe desactivar todos los métodos de pago por defecto del usuario', async () => {
      // Arrange
      mockPaymentMethodUpdateMany.mockResolvedValue({ count: 2 });

      // Act
      await service.clearDefaultPaymentMethods(10);

      // Assert
      expect(mockPaymentMethodUpdateMany).toHaveBeenCalledWith({
        where: { userId: 10, isDefault: true },
        data: { isDefault: false },
      });
    });
  });

  // ── createPaymentMethod ──────────────────────────────────────────────────────
  describe('createPaymentMethod', () => {
    it('debe crear y retornar el nuevo método de pago', async () => {
      // Arrange
      mockPaymentMethodCreate.mockResolvedValue(fakePaymentMethod);

      // Act
      const result = await service.createPaymentMethod({
        userId: 10,
        type: 'CREDIT_CARD',
        provider: 'BANCARD',
        name: 'Visa terminada en 1234',
        details: {},
      } as unknown as Prisma.PaymentMethodEntityUncheckedCreateInput);

      // Assert
      expect(result).toEqual(fakePaymentMethod);
      expect(mockPaymentMethodCreate).toHaveBeenCalled();
    });
  });

  // ── findAllPaymentMethods ────────────────────────────────────────────────────
  describe('findAllPaymentMethods', () => {
    it('debe retornar los métodos de pago activos del usuario ordenados con el default primero', async () => {
      // Arrange
      const methods = [
        { ...fakePaymentMethod, isDefault: true },
        fakePaymentMethod,
      ];
      mockPaymentMethodFindMany.mockResolvedValue(methods);

      // Act
      const result = await service.findAllPaymentMethods(10);

      // Assert
      expect(result).toEqual(methods);
      expect(mockPaymentMethodFindMany).toHaveBeenCalledWith({
        where: { userId: 10, isActive: true },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      });
    });
  });

  // ── findPaymentMethodById ────────────────────────────────────────────────────
  describe('findPaymentMethodById', () => {
    it('debe retornar el método de pago que coincide con id y userId', async () => {
      // Arrange
      mockPaymentMethodFindFirst.mockResolvedValue(fakePaymentMethod);

      // Act
      const result = await service.findPaymentMethodById('pm-1', 10);

      // Assert
      expect(result).toEqual(fakePaymentMethod);
      expect(mockPaymentMethodFindFirst).toHaveBeenCalledWith({
        where: { id: 'pm-1', userId: 10 },
      });
    });

    it('debe retornar null cuando el método de pago no pertenece al usuario', async () => {
      // Arrange
      mockPaymentMethodFindFirst.mockResolvedValue(null);

      // Act
      const result = await service.findPaymentMethodById('pm-1', 99);

      // Assert
      expect(result).toBeNull();
    });
  });

  // ── countActivePaymentMethods ────────────────────────────────────────────────
  describe('countActivePaymentMethods', () => {
    it('debe retornar la cantidad de métodos de pago activos del usuario', async () => {
      // Arrange
      mockPaymentMethodCount.mockResolvedValue(3);

      // Act
      const result = await service.countActivePaymentMethods(10);

      // Assert
      expect(result).toBe(3);
      expect(mockPaymentMethodCount).toHaveBeenCalledWith({
        where: { userId: 10, isActive: true },
      });
    });
  });

  // ── updatePaymentMethod ──────────────────────────────────────────────────────
  describe('updatePaymentMethod', () => {
    it('debe actualizar y retornar el método de pago modificado', async () => {
      // Arrange
      const updated = { ...fakePaymentMethod, isDefault: true };
      mockPaymentMethodUpdate.mockResolvedValue(updated);

      // Act
      const result = await service.updatePaymentMethod('pm-1', {
        isDefault: true,
      });

      // Assert
      expect(result).toEqual(updated);
      expect(mockPaymentMethodUpdate).toHaveBeenCalledWith({
        where: { id: 'pm-1' },
        data: { isDefault: true },
      });
    });
  });

  // ── executeRefund ────────────────────────────────────────────────────────────
  describe('executeRefund', () => {
    it('debe crear una transacción de reembolso y actualizar el estado del pago en una transacción ACID', async () => {
      // Arrange
      const refundedPayment = {
        ...fakePayment,
        status: PaymentStatus.REFUNDED,
      };
      mockTransaction.mockImplementation(
        async (callback: (tx: Record<string, unknown>) => Promise<unknown>) => {
          const txClient = {
            paymentTransaction: { create: jest.fn().mockResolvedValue({}) },
            payments: { update: jest.fn().mockResolvedValue(refundedPayment) },
          };
          return callback(txClient);
        },
      );

      // Act
      const result = await service.executeRefund(
        'pay-1',
        1500,
        'defecto',
        true,
        1500,
      );

      // Assert
      expect(mockTransaction).toHaveBeenCalled();
      expect(result).toEqual(refundedPayment);
    });

    it('debe marcar el pago como PARTIAL_REFUNDED cuando el reembolso no es total', async () => {
      // Arrange
      const partialRefundedPayment = {
        ...fakePayment,
        status: PaymentStatus.PARTIAL_REFUNDED,
      };
      mockTransaction.mockImplementation(
        async (callback: (tx: Record<string, unknown>) => Promise<unknown>) => {
          const txClient = {
            paymentTransaction: { create: jest.fn().mockResolvedValue({}) },
            payments: {
              update: jest
                .fn()
                .mockImplementation(
                  ({ data }: { data: { status: PaymentStatus } }) => {
                    expect(data.status).toBe(PaymentStatus.PARTIAL_REFUNDED);
                    return Promise.resolve(partialRefundedPayment);
                  },
                ),
            },
          };
          return callback(txClient);
        },
      );

      // Act
      const result = await service.executeRefund(
        'pay-1',
        500,
        'parcial',
        false,
        500,
      );

      // Assert
      expect(result).toEqual(partialRefundedPayment);
    });
  });

  // ── findTransactionByExternalId ──────────────────────────────────────────────
  describe('findTransactionByExternalId', () => {
    it('debe retornar la transacción con el ID externo indicado', async () => {
      // Arrange
      mockTransactionFindUnique.mockResolvedValue(fakeTransaction);

      // Act
      const result = await service.findTransactionByExternalId('ext-123');

      // Assert
      expect(result).toEqual(fakeTransaction);
      expect(mockTransactionFindUnique).toHaveBeenCalledWith({
        where: { externalTransactionId: 'ext-123' },
      });
    });

    it('debe retornar null cuando no existe la transacción externa', async () => {
      // Arrange
      mockTransactionFindUnique.mockResolvedValue(null);

      // Act
      const result = await service.findTransactionByExternalId('ext-999');

      // Assert
      expect(result).toBeNull();
    });
  });

  // ── updateTransactionAndPaymentStatus ───────────────────────────────────────
  describe('updateTransactionAndPaymentStatus', () => {
    it('debe actualizar el estado de la transacción y el pago en una sola transacción ACID', async () => {
      // Arrange
      const mockTxUpdate = jest.fn().mockResolvedValue({});
      mockTransaction.mockImplementation(
        async (callback: (tx: Record<string, unknown>) => Promise<void>) => {
          const txClient = {
            paymentTransaction: { update: mockTxUpdate },
            payments: { update: mockTxUpdate },
          };
          return callback(txClient);
        },
      );

      // Act
      await service.updateTransactionAndPaymentStatus(
        'txn-1',
        'pay-1',
        TransactionStatus.COMPLETED,
        PaymentStatus.COMPLETED,
      );

      // Assert
      expect(mockTransaction).toHaveBeenCalled();
      expect(mockTxUpdate).toHaveBeenCalledTimes(2);
    });

    it('debe incluir failureReason cuando el estado es FAILED', async () => {
      // Arrange
      let capturedTxData: Record<string, unknown> | null = null;
      mockTransaction.mockImplementation(
        async (callback: (tx: Record<string, unknown>) => Promise<void>) => {
          const txClient = {
            paymentTransaction: {
              update: jest
                .fn()
                .mockImplementation(
                  ({ data }: { data: Record<string, unknown> }) => {
                    capturedTxData = data;
                    return Promise.resolve({});
                  },
                ),
            },
            payments: { update: jest.fn().mockResolvedValue({}) },
          };
          return callback(txClient);
        },
      );

      // Act
      await service.updateTransactionAndPaymentStatus(
        'txn-1',
        'pay-1',
        TransactionStatus.FAILED,
        PaymentStatus.FAILED,
        'Fondos insuficientes',
      );

      // Assert
      expect(capturedTxData).toMatchObject({
        failureReason: 'Fondos insuficientes',
      });
    });
  });

  // ── getPaymentSummary ────────────────────────────────────────────────────────
  describe('getPaymentSummary', () => {
    it('debe retornar el resumen de pagos con todos los conteos y montos', async () => {
      // Arrange
      mockPaymentsAggregate.mockResolvedValue({
        _count: { id: 10 },
        _sum: { totalAmount: 50000 },
      });
      mockPaymentsCount
        .mockResolvedValueOnce(7) // completed
        .mockResolvedValueOnce(2) // failed
        .mockResolvedValueOnce(1); // pending

      // Act
      const result = await service.getPaymentSummary();

      // Assert
      expect(result).toEqual({
        totalPayments: 10,
        totalAmount: 50000,
        successfulPayments: 7,
        failedPayments: 2,
        pendingPayments: 1,
      });
    });

    it('debe filtrar por userId cuando se proporciona', async () => {
      // Arrange
      mockPaymentsAggregate.mockResolvedValue({
        _count: { id: 0 },
        _sum: { totalAmount: null },
      });
      mockPaymentsCount.mockResolvedValue(0);

      // Act
      await service.getPaymentSummary(10);

      // Assert
      expect(mockPaymentsAggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 10 }) as object,
        }),
      );
    });

    it('debe retornar totalAmount = 0 cuando no hay pagos', async () => {
      // Arrange
      mockPaymentsAggregate.mockResolvedValue({
        _count: { id: 0 },
        _sum: { totalAmount: null },
      });
      mockPaymentsCount.mockResolvedValue(0);

      // Act
      const result = await service.getPaymentSummary();

      // Assert
      expect(result.totalAmount).toBe(0);
    });
  });

  // ── getPaymentTrends ─────────────────────────────────────────────────────────
  describe('getPaymentTrends', () => {
    it('debe ejecutar una consulta raw y retornar las tendencias diarias', async () => {
      // Arrange
      const trends = [
        {
          date: '2024-01-01',
          totalPayments: 5,
          totalAmount: 10000,
          successfulPayments: 4,
          failedPayments: 1,
        },
      ];
      mockQueryRaw.mockResolvedValue(trends);

      // Act
      const result = await service.getPaymentTrends(7);

      // Assert
      expect(result).toEqual(trends);
      expect(mockQueryRaw).toHaveBeenCalled();
    });
  });
});
