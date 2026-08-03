import { Test, TestingModule } from '@nestjs/testing';
import {
  PaymentStatus,
  TransactionStatus,
  TransactionType,
  Prisma,
} from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { PaymentDbService } from './payment-db.service';

const serviceRefInclude = { service: { select: { referenceId: true } } };

// ── Mock functions ─────────────────────────────────────────────────────────────
const mockPaymentsFindFirst = jest.fn();
const mockPaymentsFindMany = jest.fn();
const mockPaymentsFindUnique = jest.fn();
const mockPaymentsCreate = jest.fn();
const mockPaymentsUpdate = jest.fn();
const mockPaymentsAggregate = jest.fn();
const mockPaymentsCount = jest.fn();

const mockServicesFindUnique = jest.fn();

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
    services: {
      findUnique: mockServicesFindUnique,
    },
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
  id: 1,
  referenceId: 'pay-uuid-1',
  userId: 10,
  professionalId: 20,
  serviceId: 30,
  service: { referenceId: 'svc-uuid-1' },
  totalAmount: new Prisma.Decimal(1500),
  platformFee: new Prisma.Decimal(150),
  status: PaymentStatus.PENDING,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const fakePaymentMethod = {
  id: 1,
  referenceId: 'pm-uuid-1',
  userId: 10,
  isDefault: false,
  isActive: true,
};

const fakeTransaction = {
  id: 1,
  paymentId: 1,
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

  // ── findServiceByReferenceId ─────────────────────────────────────────────────
  describe('findServiceByReferenceId', () => {
    it('debe resolver el UUID público del servicio a su PK interna', async () => {
      // Arrange
      mockServicesFindUnique.mockResolvedValue({ id: 30 });

      // Act
      const result = await service.findServiceByReferenceId('svc-uuid-1');

      // Assert
      expect(result).toEqual({ id: 30 });
      expect(mockServicesFindUnique).toHaveBeenCalledWith({
        where: { referenceId: 'svc-uuid-1' },
        select: { id: true },
      });
    });
  });

  // ── findExistingPayment ──────────────────────────────────────────────────────
  describe('findExistingPayment', () => {
    it('debe retornar el pago existente para un usuario y servicio dados', async () => {
      // Arrange
      mockPaymentsFindFirst.mockResolvedValue(fakePayment);

      // Act
      const result = await service.findExistingPayment(10, 30);

      // Assert
      expect(result).toEqual(fakePayment);
      expect(mockPaymentsFindFirst).toHaveBeenCalledWith({
        where: { userId: 10, serviceId: 30 },
      });
    });

    it('debe retornar null cuando no existe pago para la combinación usuario/servicio', async () => {
      // Arrange
      mockPaymentsFindFirst.mockResolvedValue(null);

      // Act
      const result = await service.findExistingPayment(99, 999);

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
        serviceId: 30,
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
        'id' | 'referenceId' | 'createdAt' | 'updatedAt'
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
    it('debe retornar el pago cuando existe la PK interna', async () => {
      // Arrange
      mockPaymentsFindUnique.mockResolvedValue(fakePayment);

      // Act
      const result = await service.findPaymentById(1);

      // Assert
      expect(result).toEqual(fakePayment);
      expect(mockPaymentsFindUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: serviceRefInclude,
      });
    });

    it('debe retornar null cuando no existe el pago', async () => {
      // Arrange
      mockPaymentsFindUnique.mockResolvedValue(null);

      // Act
      const result = await service.findPaymentById(999);

      // Assert
      expect(result).toBeNull();
    });
  });

  // ── findPaymentByReferenceId ─────────────────────────────────────────────────
  describe('findPaymentByReferenceId', () => {
    it('debe buscar el pago por su referenceId (UUID público) incluyendo el servicio', async () => {
      // Arrange
      mockPaymentsFindUnique.mockResolvedValue(fakePayment);

      // Act
      const result = await service.findPaymentByReferenceId('pay-uuid-1');

      // Assert
      expect(result).toEqual(fakePayment);
      expect(mockPaymentsFindUnique).toHaveBeenCalledWith({
        where: { referenceId: 'pay-uuid-1' },
        include: serviceRefInclude,
      });
    });
  });

  // ── updatePayment ────────────────────────────────────────────────────────────
  describe('updatePayment', () => {
    it('debe actualizar y retornar el pago con los nuevos datos', async () => {
      // Arrange
      const updated = { ...fakePayment, status: PaymentStatus.COMPLETED };
      mockPaymentsUpdate.mockResolvedValue(updated);

      // Act
      const result = await service.updatePayment(1, {
        status: PaymentStatus.COMPLETED,
      });

      // Assert
      expect(result).toEqual(updated);
      expect(mockPaymentsUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: PaymentStatus.COMPLETED },
        include: serviceRefInclude,
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

  // ── findPaymentMethodByReferenceId ───────────────────────────────────────────
  describe('findPaymentMethodByReferenceId', () => {
    it('debe retornar el método de pago que coincide con referenceId y userId', async () => {
      // Arrange
      mockPaymentMethodFindFirst.mockResolvedValue(fakePaymentMethod);

      // Act
      const result = await service.findPaymentMethodByReferenceId(
        'pm-uuid-1',
        10,
      );

      // Assert
      expect(result).toEqual(fakePaymentMethod);
      expect(mockPaymentMethodFindFirst).toHaveBeenCalledWith({
        where: { referenceId: 'pm-uuid-1', userId: 10 },
      });
    });

    it('debe retornar null cuando el método de pago no pertenece al usuario', async () => {
      // Arrange
      mockPaymentMethodFindFirst.mockResolvedValue(null);

      // Act
      const result = await service.findPaymentMethodByReferenceId(
        'pm-uuid-1',
        99,
      );

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
      const result = await service.updatePaymentMethod(1, {
        isDefault: true,
      });

      // Assert
      expect(result).toEqual(updated);
      expect(mockPaymentMethodUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isDefault: true },
      });
    });
  });

  // ── executeRefund ────────────────────────────────────────────────────────────
  describe('executeRefund', () => {
    function mockLockedPayment(overrides: {
      status: PaymentStatus;
      total_amount: number;
      refund_details?: Record<string, unknown> | null;
    }) {
      return jest.fn().mockResolvedValue([
        {
          id: 1,
          status: overrides.status,
          total_amount: new Prisma.Decimal(overrides.total_amount),
          refund_details: overrides.refund_details ?? null,
        },
      ]);
    }

    it('debe bloquear la fila (FOR UPDATE), crear la transacción de reembolso y actualizar el pago en una transacción ACID', async () => {
      // Arrange
      const refundedPayment = {
        ...fakePayment,
        status: PaymentStatus.REFUNDED,
      };
      const mockCreate = jest
        .fn<Promise<Record<string, unknown>>, unknown[]>()
        .mockResolvedValue({});
      const mockUpdate = jest
        .fn<Promise<typeof refundedPayment>, unknown[]>()
        .mockResolvedValue(refundedPayment);
      mockTransaction.mockImplementation(
        async (callback: (tx: Record<string, unknown>) => Promise<unknown>) => {
          const txClient = {
            $queryRaw: mockLockedPayment({
              status: PaymentStatus.COMPLETED,
              total_amount: 1500,
            }),
            paymentTransaction: { create: mockCreate },
            payments: { update: mockUpdate },
          };
          return callback(txClient);
        },
      );

      // Act
      const result = await service.executeRefund(1, 1500, 'defecto');

      // Assert
      expect(mockTransaction).toHaveBeenCalled();
      const updateCall = mockUpdate.mock.calls[0]?.[0] as {
        where: { id: number };
        data: { status: PaymentStatus };
      };
      expect(updateCall.where).toEqual({ id: 1 });
      expect(updateCall.data.status).toBe(PaymentStatus.REFUNDED);
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
            $queryRaw: mockLockedPayment({
              status: PaymentStatus.COMPLETED,
              total_amount: 1500,
            }),
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
      const result = await service.executeRefund(1, 500, 'parcial');

      // Assert
      expect(result).toEqual(partialRefundedPayment);
    });

    it('debe sumar reembolsos previos (leídos bajo lock) al validar el monto disponible', async () => {
      // Arrange
      mockTransaction.mockImplementation(
        async (callback: (tx: Record<string, unknown>) => Promise<unknown>) => {
          const txClient = {
            $queryRaw: mockLockedPayment({
              status: PaymentStatus.COMPLETED,
              total_amount: 1000,
              refund_details: { refundedAmount: 400 },
            }),
            paymentTransaction: { create: jest.fn().mockResolvedValue({}) },
            payments: { update: jest.fn().mockResolvedValue(fakePayment) },
          };
          return callback(txClient);
        },
      );

      // Act & Assert — 400 ya reembolsados + 700 nuevos > 1000 disponibles
      await expect(service.executeRefund(1, 700, 'excede')).rejects.toThrow(
        'El monto del reembolso excede el monto disponible',
      );
    });

    it('debe rechazar el reembolso si el estado ya no es COMPLETED (otro reembolso ganó la carrera)', async () => {
      // Arrange
      mockTransaction.mockImplementation(
        async (callback: (tx: Record<string, unknown>) => Promise<unknown>) => {
          const txClient = {
            $queryRaw: mockLockedPayment({
              status: PaymentStatus.REFUNDED,
              total_amount: 1500,
            }),
            paymentTransaction: { create: jest.fn() },
            payments: { update: jest.fn() },
          };
          return callback(txClient);
        },
      );

      // Act & Assert
      await expect(service.executeRefund(1, 100, 'tarde')).rejects.toThrow(
        'Solo se pueden reembolsar pagos completados',
      );
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
        1,
        1,
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
        1,
        1,
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
