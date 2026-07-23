// src/api/payments/services/payments.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PaymentStatus, PaymentProvider, PaymentMethod } from '@prisma/client';

import { PaymentApiService } from './payments.service';
import { PaymentDbService } from '@modules/payments-db/services/payment-db.service';
import { FeeCalculatorService } from '@modules/payments-db/services/fee-calculator.service';
import { RefundReason } from '../dtos/request/refund-payment.dto';
import type { CreatePaymentDto } from '../dtos/request/create-payment.dto';
import type { RefundPaymentDto } from '../dtos/request/refund-payment.dto';
import type { CreatePaymentMethodRequestDTO } from '../dtos/request/create-payment-method.request.dto';
import type { UpdatePaymentMethodDto } from '../dtos/request/update-payment-method.dto';

// ============================================================
// Mocks a nivel de módulo — nunca inline en useValue
// ============================================================

// PaymentDbService
const mockFindServiceByReferenceId = jest.fn();
const mockFindExistingPayment = jest.fn();
const mockCreatePaymentWithTransaction = jest.fn();
const mockFindAllPayments = jest.fn();
const mockFindPaymentByReferenceId = jest.fn();
const mockUpdatePayment = jest.fn();
const mockUpdatePaymentConditional = jest.fn();
const mockExecuteRefund = jest.fn();
const mockFindTransactionByExternalId = jest.fn();
const mockUpdateTransactionAndPaymentStatus = jest.fn();
const mockCreatePaymentMethod = jest.fn();
const mockFindAllPaymentMethods = jest.fn();
const mockFindPaymentMethodByReferenceId = jest.fn();
const mockCountActivePaymentMethods = jest.fn();
const mockUpdatePaymentMethod = jest.fn();
const mockClearDefaultPaymentMethods = jest.fn();
const mockGetPaymentSummary = jest.fn();
const mockGetPaymentTrends = jest.fn();

// FeeCalculatorService
const mockCalculateProviderFee = jest.fn();
const mockCalculatePlatformFee = jest.fn();

// ============================================================
// Fixtures reutilizables
// ============================================================

// PK interna (Int) vs UUID público (referenceId, lo que viaja en la wire API).
const BASE_PAYMENT_REF = 'pay-uuid-0001';
const BASE_PAYMENT_PK = 1;
const BASE_USER_ID = 42;
const BASE_PROFESSIONAL_ID = '77';
const BASE_SERVICE_REF = 'svc-uuid-0001';
const BASE_SERVICE_PK = 30;
const BASE_PM_REF = 'pm-uuid-0001';
const BASE_PM_PK = 5;

function buildPayment(overrides: Record<string, unknown> = {}) {
  return {
    id: BASE_PAYMENT_PK,
    referenceId: BASE_PAYMENT_REF,
    userId: BASE_USER_ID,
    professionalId: Number(BASE_PROFESSIONAL_ID),
    serviceId: BASE_SERVICE_PK,
    service: { referenceId: BASE_SERVICE_REF },
    amount: 100,
    fee: 3,
    tax: 10.3,
    totalAmount: 113.3,
    currencyCode: 'USD',
    paymentMethod: PaymentMethod.CREDIT_CARD,
    paymentProvider: PaymentProvider.STRIPE,
    status: PaymentStatus.PENDING,
    refundDetails: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

function buildCreatePaymentDto(
  overrides: Partial<CreatePaymentDto> = {},
): CreatePaymentDto {
  return {
    professionalId: BASE_PROFESSIONAL_ID,
    serviceId: BASE_SERVICE_REF,
    amount: 100,
    paymentMethod: PaymentMethod.CREDIT_CARD,
    paymentProvider: PaymentProvider.STRIPE,
    currencyCode: 'USD',
    ...overrides,
  };
}

function buildRefundDto(
  overrides: Partial<RefundPaymentDto> = {},
): RefundPaymentDto {
  return {
    amount: 50,
    reason: RefundReason.CUSTOMER_REQUEST,
    ...overrides,
  };
}

// ============================================================
// Suite principal
// ============================================================

describe('PaymentApiService', () => {
  let service: PaymentApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentApiService,
        {
          provide: PaymentDbService,
          useValue: {
            findServiceByReferenceId: mockFindServiceByReferenceId,
            findExistingPayment: mockFindExistingPayment,
            createPaymentWithTransaction: mockCreatePaymentWithTransaction,
            findAllPayments: mockFindAllPayments,
            findPaymentByReferenceId: mockFindPaymentByReferenceId,
            updatePayment: mockUpdatePayment,
            updatePaymentConditional: mockUpdatePaymentConditional,
            executeRefund: mockExecuteRefund,
            findTransactionByExternalId: mockFindTransactionByExternalId,
            updateTransactionAndPaymentStatus:
              mockUpdateTransactionAndPaymentStatus,
            createPaymentMethod: mockCreatePaymentMethod,
            findAllPaymentMethods: mockFindAllPaymentMethods,
            findPaymentMethodByReferenceId: mockFindPaymentMethodByReferenceId,
            countActivePaymentMethods: mockCountActivePaymentMethods,
            updatePaymentMethod: mockUpdatePaymentMethod,
            clearDefaultPaymentMethods: mockClearDefaultPaymentMethods,
            getPaymentSummary: mockGetPaymentSummary,
            getPaymentTrends: mockGetPaymentTrends,
          },
        },
        {
          provide: FeeCalculatorService,
          useValue: {
            calculateProviderFee: mockCalculateProviderFee,
            calculatePlatformFee: mockCalculatePlatformFee,
          },
        },
      ],
    }).compile();

    service = module.get<PaymentApiService>(PaymentApiService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // createPayment
  // ============================================================

  describe('createPayment', () => {
    it('debe resolver el servicio por su UUID y calcular el fee del proveedor', async () => {
      // Arrange
      const dto = buildCreatePaymentDto();
      mockFindServiceByReferenceId.mockResolvedValue({ id: BASE_SERVICE_PK });
      mockFindExistingPayment.mockResolvedValue(null);
      mockCalculateProviderFee.mockResolvedValue(3);
      mockCalculatePlatformFee.mockResolvedValue(10.3);
      mockCreatePaymentWithTransaction.mockResolvedValue(buildPayment());

      // Act
      await service.createPayment(BASE_USER_ID, dto);

      // Assert
      expect(mockFindServiceByReferenceId).toHaveBeenCalledWith(
        BASE_SERVICE_REF,
      );
      expect(mockCalculateProviderFee).toHaveBeenCalledWith(
        dto.amount,
        dto.paymentProvider,
      );
    });

    it('debe llamar a feeCalculator.calculatePlatformFee con amount + providerFee', async () => {
      // Arrange
      const dto = buildCreatePaymentDto({ amount: 100 });
      mockFindServiceByReferenceId.mockResolvedValue({ id: BASE_SERVICE_PK });
      mockFindExistingPayment.mockResolvedValue(null);
      mockCalculateProviderFee.mockResolvedValue(3);
      mockCalculatePlatformFee.mockResolvedValue(10.3);
      mockCreatePaymentWithTransaction.mockResolvedValue(buildPayment());

      // Act
      await service.createPayment(BASE_USER_ID, dto);

      // Assert
      expect(mockCalculatePlatformFee).toHaveBeenCalledWith(103); // 100 + 3
    });

    it('debe lanzar NotFoundException si el servicio (UUID) no existe', async () => {
      // Arrange
      const dto = buildCreatePaymentDto();
      mockFindServiceByReferenceId.mockResolvedValue(null);

      // Act & Assert
      await expect(service.createPayment(BASE_USER_ID, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe lanzar BadRequestException si ya existe un pago para el mismo servicio', async () => {
      // Arrange
      const dto = buildCreatePaymentDto();
      mockFindServiceByReferenceId.mockResolvedValue({ id: BASE_SERVICE_PK });
      mockFindExistingPayment.mockResolvedValue(buildPayment());

      // Act & Assert
      await expect(service.createPayment(BASE_USER_ID, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe crear el pago con la PK interna del servicio, fee, tax y totalAmount calculados', async () => {
      // Arrange
      const dto = buildCreatePaymentDto({ amount: 100 });
      const fee = 3;
      const tax = 10.3;
      const expectedTotal = 100 + fee + tax;
      const createdPayment = buildPayment({
        fee,
        tax,
        totalAmount: expectedTotal,
      });

      mockFindServiceByReferenceId.mockResolvedValue({ id: BASE_SERVICE_PK });
      mockFindExistingPayment.mockResolvedValue(null);
      mockCalculateProviderFee.mockResolvedValue(fee);
      mockCalculatePlatformFee.mockResolvedValue(tax);
      mockCreatePaymentWithTransaction.mockResolvedValue(createdPayment);

      // Act
      const result = await service.createPayment(BASE_USER_ID, dto);

      // Assert
      expect(mockCreatePaymentWithTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          fee,
          tax,
          totalAmount: expectedTotal,
          status: PaymentStatus.PENDING,
          userId: BASE_USER_ID,
          serviceId: BASE_SERVICE_PK,
        }),
        expect.any(String), // uuid generado dinámicamente
      );
      expect(result.totalAmount).toBe(expectedTotal);
      expect(result.id).toBe(BASE_PAYMENT_REF);
      expect(result.serviceId).toBe(BASE_SERVICE_REF);
    });

    it('debe usar PaymentStatus.PENDING como estado inicial al crear el pago', async () => {
      // Arrange
      const dto = buildCreatePaymentDto();
      mockFindServiceByReferenceId.mockResolvedValue({ id: BASE_SERVICE_PK });
      mockFindExistingPayment.mockResolvedValue(null);
      mockCalculateProviderFee.mockResolvedValue(0);
      mockCalculatePlatformFee.mockResolvedValue(0);
      mockCreatePaymentWithTransaction.mockResolvedValue(buildPayment());

      // Act
      await service.createPayment(BASE_USER_ID, dto);

      // Assert
      expect(mockCreatePaymentWithTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ status: PaymentStatus.PENDING }),
        expect.any(String),
      );
    });
  });

  // ============================================================
  // getPaymentById
  // ============================================================

  describe('getPaymentById', () => {
    it('debe resolver el pago por su referenceId y exponerlo bajo la clave id', async () => {
      // Arrange
      const payment = buildPayment();
      mockFindPaymentByReferenceId.mockResolvedValue(payment);

      // Act
      const result = await service.getPaymentById(BASE_PAYMENT_REF);

      // Assert
      expect(result.id).toBe(BASE_PAYMENT_REF);
      expect(result.serviceId).toBe(BASE_SERVICE_REF);
      expect(mockFindPaymentByReferenceId).toHaveBeenCalledWith(
        BASE_PAYMENT_REF,
      );
    });

    it('debe lanzar NotFoundException cuando el pago no existe', async () => {
      // Arrange
      mockFindPaymentByReferenceId.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getPaymentById('id-inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ============================================================
  // cancelPayment
  // ============================================================

  describe('cancelPayment', () => {
    it('debe lanzar ForbiddenException si el userId no coincide con el dueño del pago', async () => {
      // Arrange
      const payment = buildPayment({
        userId: 99,
        status: PaymentStatus.PENDING,
      });
      mockFindPaymentByReferenceId.mockResolvedValue(payment);

      // Act & Assert
      await expect(
        service.cancelPayment(BASE_PAYMENT_REF, BASE_USER_ID), // BASE_USER_ID = 42, owner = 99
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe lanzar BadRequestException si el pago no está en estado PENDING', async () => {
      // Arrange
      const payment = buildPayment({
        userId: BASE_USER_ID,
        status: PaymentStatus.COMPLETED,
      });
      mockFindPaymentByReferenceId.mockResolvedValue(payment);

      // Act & Assert
      await expect(
        service.cancelPayment(BASE_PAYMENT_REF, BASE_USER_ID),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe cancelar el pago (usando la PK interna) cuando las validaciones pasan', async () => {
      // Arrange
      const payment = buildPayment({
        userId: BASE_USER_ID,
        status: PaymentStatus.PENDING,
      });
      const cancelledPayment = buildPayment({
        userId: BASE_USER_ID,
        status: PaymentStatus.CANCELLED,
      });
      mockFindPaymentByReferenceId
        .mockResolvedValueOnce(payment)
        .mockResolvedValueOnce(cancelledPayment);
      mockUpdatePaymentConditional.mockResolvedValue(1);

      // Act
      const result = await service.cancelPayment(
        BASE_PAYMENT_REF,
        BASE_USER_ID,
      );

      // Assert
      expect(mockUpdatePaymentConditional).toHaveBeenCalledWith(
        BASE_PAYMENT_PK,
        [PaymentStatus.PENDING],
        { status: PaymentStatus.CANCELLED },
      );
      expect(result.status).toBe(PaymentStatus.CANCELLED);
    });

    it('debe lanzar ConflictException si el estado cambió entre la validación y la escritura (carrera con otro proceso)', async () => {
      // Arrange
      const payment = buildPayment({
        userId: BASE_USER_ID,
        status: PaymentStatus.PENDING,
      });
      mockFindPaymentByReferenceId.mockResolvedValue(payment);
      mockUpdatePaymentConditional.mockResolvedValue(0); // otro proceso ya cambió el estado

      // Act & Assert
      await expect(
        service.cancelPayment(BASE_PAYMENT_REF, BASE_USER_ID),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ============================================================
  // refundPayment
  // ============================================================

  describe('refundPayment', () => {
    // La validación de estado/monto disponible ahora vive dentro de
    // PaymentDbService#executeRefund (bajo lock de fila, ver payment-db.service.spec.ts) — acá
    // solo se prueba que el service orquestador haga el 404 rápido y delegue correctamente.

    it('debe lanzar NotFoundException si el pago no existe', async () => {
      // Arrange
      mockFindPaymentByReferenceId.mockResolvedValue(null);
      const dto = buildRefundDto({ amount: 50 });

      // Act & Assert
      await expect(
        service.refundPayment(BASE_PAYMENT_REF, dto),
      ).rejects.toThrow(NotFoundException);
      expect(mockExecuteRefund).not.toHaveBeenCalled();
    });

    it('debe delegar el reembolso a executeRefund con la PK interna, monto y motivo', async () => {
      // Arrange
      const completed = buildPayment({ status: PaymentStatus.COMPLETED });
      const partial = buildPayment({ status: PaymentStatus.PARTIAL_REFUNDED });
      mockFindPaymentByReferenceId
        .mockResolvedValueOnce(completed) // 404 check
        .mockResolvedValueOnce(partial); // re-fetch tras el reembolso
      mockExecuteRefund.mockResolvedValue(partial);
      const dto = buildRefundDto({ amount: 50 });

      // Act
      const result = await service.refundPayment(BASE_PAYMENT_REF, dto);

      // Assert
      expect(mockExecuteRefund).toHaveBeenCalledWith(
        BASE_PAYMENT_PK,
        50,
        dto.reason,
      );
      expect(result.status).toBe(PaymentStatus.PARTIAL_REFUNDED);
    });

    it('debe propagar el BadRequestException que lance executeRefund (ej. monto excede disponible)', async () => {
      // Arrange
      const payment = buildPayment({ status: PaymentStatus.COMPLETED });
      mockFindPaymentByReferenceId.mockResolvedValue(payment);
      mockExecuteRefund.mockRejectedValue(
        new BadRequestException(
          'El monto del reembolso excede el monto disponible',
        ),
      );
      const dto = buildRefundDto({ amount: 999 });

      // Act & Assert
      await expect(
        service.refundPayment(BASE_PAYMENT_REF, dto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ============================================================
  // createPaymentMethod
  // ============================================================

  describe('createPaymentMethod', () => {
    it('debe delegar la creación al dbService y exponer el referenceId como id', async () => {
      // Arrange
      const dto: CreatePaymentMethodRequestDTO = {
        name: 'Mi tarjeta VISA',
        type: 'CREDIT_CARD',
        provider: PaymentProvider.STRIPE,
        isDefault: false,
        details: { cardLast4: '4242' },
        externalId: 'pm_stripe_001',
      } as unknown as CreatePaymentMethodRequestDTO;
      const createdMethod = {
        id: BASE_PM_PK,
        referenceId: BASE_PM_REF,
        userId: BASE_USER_ID,
        ...dto,
      };
      mockCreatePaymentMethod.mockResolvedValue(createdMethod);

      // Act
      const result = await service.createPaymentMethod(BASE_USER_ID, dto);

      // Assert
      expect(mockCreatePaymentMethod).toHaveBeenCalledTimes(1);
      expect(result.id).toBe(BASE_PM_REF);
    });
  });

  // ============================================================
  // updatePaymentMethod
  // ============================================================

  describe('updatePaymentMethod', () => {
    it('debe lanzar NotFoundException si el método de pago no existe', async () => {
      // Arrange
      mockFindPaymentMethodByReferenceId.mockResolvedValue(null);
      const dto: UpdatePaymentMethodDto = {
        name: 'Nuevo nombre',
      };

      // Act & Assert
      await expect(
        service.updatePaymentMethod('pm-inexistente', BASE_USER_ID, dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe limpiar los métodos por defecto antes de actualizar si isDefault es true', async () => {
      // Arrange
      const method = {
        id: BASE_PM_PK,
        referenceId: BASE_PM_REF,
        userId: BASE_USER_ID,
      };
      mockFindPaymentMethodByReferenceId.mockResolvedValue(method);
      mockClearDefaultPaymentMethods.mockResolvedValue(undefined);
      mockUpdatePaymentMethod.mockResolvedValue({ ...method, isDefault: true });
      const dto: UpdatePaymentMethodDto = {
        isDefault: true,
      };

      // Act
      await service.updatePaymentMethod(BASE_PM_REF, BASE_USER_ID, dto);

      // Assert
      expect(mockClearDefaultPaymentMethods).toHaveBeenCalledWith(BASE_USER_ID);
      expect(mockUpdatePaymentMethod).toHaveBeenCalledWith(
        BASE_PM_PK,
        expect.objectContaining({ isDefault: true }),
      );
    });

    it('no debe limpiar los métodos por defecto si isDefault es false', async () => {
      // Arrange
      const method = {
        id: BASE_PM_PK,
        referenceId: BASE_PM_REF,
        userId: BASE_USER_ID,
      };
      mockFindPaymentMethodByReferenceId.mockResolvedValue(method);
      mockUpdatePaymentMethod.mockResolvedValue({
        ...method,
        name: 'Actualizado',
      });
      const dto: UpdatePaymentMethodDto = {
        isDefault: false,
      };

      // Act
      await service.updatePaymentMethod(BASE_PM_REF, BASE_USER_ID, dto);

      // Assert
      expect(mockClearDefaultPaymentMethods).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // deletePaymentMethod
  // ============================================================

  describe('deletePaymentMethod', () => {
    it('debe lanzar NotFoundException si el método de pago no existe', async () => {
      // Arrange
      mockFindPaymentMethodByReferenceId.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.deletePaymentMethod('pm-inexistente', BASE_USER_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar BadRequestException si es el único método activo', async () => {
      // Arrange
      const method = {
        id: BASE_PM_PK,
        referenceId: BASE_PM_REF,
        userId: BASE_USER_ID,
      };
      mockFindPaymentMethodByReferenceId.mockResolvedValue(method);
      mockCountActivePaymentMethods.mockResolvedValue(1);

      // Act & Assert
      await expect(
        service.deletePaymentMethod(BASE_PM_REF, BASE_USER_ID),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe desactivar el método (por su PK interna) cuando existen otros métodos activos', async () => {
      // Arrange
      const method = {
        id: BASE_PM_PK,
        referenceId: BASE_PM_REF,
        userId: BASE_USER_ID,
      };
      mockFindPaymentMethodByReferenceId.mockResolvedValue(method);
      mockCountActivePaymentMethods.mockResolvedValue(3);
      mockUpdatePaymentMethod.mockResolvedValue({ ...method, isActive: false });

      // Act
      await service.deletePaymentMethod(BASE_PM_REF, BASE_USER_ID);

      // Assert
      expect(mockUpdatePaymentMethod).toHaveBeenCalledWith(BASE_PM_PK, {
        isActive: false,
      });
    });
  });

  // ============================================================
  // getMetricsSummary
  // ============================================================

  describe('getMetricsSummary', () => {
    it('debe calcular successRate correctamente como porcentaje redondeado', async () => {
      // Arrange
      mockGetPaymentSummary.mockResolvedValue({
        totalPayments: 120,
        successfulPayments: 98,
        failedPayments: 10,
        pendingPayments: 12,
        totalAmount: 15600000,
      });

      // Act
      const result = await service.getMetricsSummary(BASE_USER_ID);

      // Assert
      expect(result.successRate).toBe(81.67);
    });

    it('debe retornar successRate 0 cuando no hay pagos', async () => {
      // Arrange
      mockGetPaymentSummary.mockResolvedValue({
        totalPayments: 0,
        successfulPayments: 0,
        failedPayments: 0,
        pendingPayments: 0,
        totalAmount: 0,
      });

      // Act
      const result = await service.getMetricsSummary();

      // Assert
      expect(result.successRate).toBe(0);
      expect(result.averageAmount).toBe(0);
    });

    it('debe calcular averageAmount correctamente', async () => {
      // Arrange
      mockGetPaymentSummary.mockResolvedValue({
        totalPayments: 4,
        successfulPayments: 4,
        failedPayments: 0,
        pendingPayments: 0,
        totalAmount: 400,
      });

      // Act
      const result = await service.getMetricsSummary();

      // Assert
      expect(result.averageAmount).toBe(100);
    });
  });

  // ============================================================
  // getMetricsTrends
  // ============================================================

  describe('getMetricsTrends', () => {
    it('debe retornar objeto { trends, days } envolviendo el resultado del DB service', async () => {
      // Arrange
      const rawTrends = [
        {
          date: '2026-01-01',
          totalPayments: 5,
          totalAmount: 500,
          successfulPayments: 4,
          failedPayments: 1,
        },
        {
          date: '2026-01-02',
          totalPayments: 3,
          totalAmount: 300,
          successfulPayments: 3,
          failedPayments: 0,
        },
      ];
      const days = 30;
      mockGetPaymentTrends.mockResolvedValue(rawTrends);

      // Act
      const result = await service.getMetricsTrends(days, BASE_USER_ID);

      // Assert
      expect(result).toEqual({ trends: rawTrends, days });
      expect(mockGetPaymentTrends).toHaveBeenCalledWith(days, BASE_USER_ID);
    });

    it('debe pasar userId undefined al dbService cuando no se proporciona', async () => {
      // Arrange
      mockGetPaymentTrends.mockResolvedValue([]);

      // Act
      await service.getMetricsTrends(7);

      // Assert
      expect(mockGetPaymentTrends).toHaveBeenCalledWith(7, undefined);
    });

    it('debe preservar el valor de days en la respuesta', async () => {
      // Arrange
      const days = 90;
      mockGetPaymentTrends.mockResolvedValue([]);

      // Act
      const result = await service.getMetricsTrends(days);

      // Assert
      expect(result.days).toBe(days);
    });
  });
});
