import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { PaymentController } from '@api/payments/controllers/payments.controller';
import { PaymentApiService } from '@api/payments/services/payments.service';
import {
  CreatePaymentDto,
  UpdatePaymentDto,
  RefundPaymentDto,
  UpdatePaymentMethodDto,
  PaymentIdParamDTO,
  PaymentMethodIdParamDTO,
  PaymentWebhookParamDTO,
  PaymentListQueryDTO,
  PaymentSummaryQueryDTO,
  PaymentTrendsQueryDTO,
  CreatePaymentMethodRequestDTO,
} from '@api/payments/dtos/request';
import { RefundReason } from '@api/payments/dtos/request/refund-payment.dto';
import {
  PaymentDetailResponseDTO,
  PaymentMethodDetailResponseDTO,
  PaymentSummaryResponseDTO,
  PaymentTrendsResponseDTO,
} from '@api/payments/dtos/response';
import { PaymentProvider, PaymentStatus } from '@prisma/client';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';

// --- Mocks nivel módulo ---
const mockCreatePayment = jest.fn();
const mockGetPayments = jest.fn();
const mockGetMetricsSummary = jest.fn();
const mockGetMetricsTrends = jest.fn();
const mockGetPaymentById = jest.fn();
const mockUpdatePayment = jest.fn();
const mockCancelPayment = jest.fn();
const mockRefundPayment = jest.fn();
const mockCreatePaymentMethod = jest.fn();
const mockUpdatePaymentMethod = jest.fn();
const mockDeletePaymentMethod = jest.fn();
const mockProcessWebhook = jest.fn();

const mockUser = {
  id: 1,
  email: 'test@example.com',
  referenceId: 'ref-uuid',
  firstName: 'Test',
  lastName: 'User',
  accessLevelId: 1,
  userStatus: 'ACTIVE',
  profileStatus: 'COMPLETE',
  permissions: [],
  roles: [],
} as unknown as IUserDataOnJwt;

describe('PaymentController', () => {
  let controller: PaymentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        {
          provide: PaymentApiService,
          useValue: {
            createPayment: mockCreatePayment,
            getPayments: mockGetPayments,
            getMetricsSummary: mockGetMetricsSummary,
            getMetricsTrends: mockGetMetricsTrends,
            getPaymentById: mockGetPaymentById,
            updatePayment: mockUpdatePayment,
            cancelPayment: mockCancelPayment,
            refundPayment: mockRefundPayment,
            createPaymentMethod: mockCreatePaymentMethod,
            updatePaymentMethod: mockUpdatePaymentMethod,
            deletePaymentMethod: mockDeletePaymentMethod,
            processWebhook: mockProcessWebhook,
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<PaymentController>(PaymentController);
  });

  afterEach(() => jest.clearAllMocks());

  // ==================== create ====================
  describe('create', () => {
    it('debe crear un pago y retornar el detalle del pago creado', async () => {
      // Arrange
      const dto: CreatePaymentDto = {
        serviceRequestId: 'req-1',
        professionalId: 2,
        amount: 100,
        currencyCode: 'PYG',
        paymentMethod: 'CARD',
        paymentProvider: PaymentProvider.STRIPE,
      } as unknown as CreatePaymentDto;
      const expected: PaymentDetailResponseDTO = {
        id: 'pay-1',
      } as unknown as PaymentDetailResponseDTO;
      mockCreatePayment.mockResolvedValue(expected);

      // Act
      const result = await controller.create(dto, { user: mockUser });

      // Assert
      expect(mockCreatePayment).toHaveBeenCalledWith(mockUser.id, dto);
      expect(result).toBe(expected);
    });
  });

  // ==================== findAll ====================
  describe('findAll', () => {
    it('debe retornar la lista de pagos filtrada por los parámetros de query', async () => {
      // Arrange
      const query: PaymentListQueryDTO = {
        userId: 1,
        status: PaymentStatus.PENDING,
      };
      const expected: PaymentDetailResponseDTO[] = [
        { id: 'pay-1' },
      ] as unknown as PaymentDetailResponseDTO[];
      mockGetPayments.mockResolvedValue(expected);

      // Act
      const result = await controller.findAll(query);

      // Assert
      expect(mockGetPayments).toHaveBeenCalledWith(
        query.userId,
        query.professionalId,
        query.status,
      );
      expect(result).toBe(expected);
    });
  });

  // ==================== getSummary ====================
  describe('getSummary', () => {
    it('debe retornar el resumen de métricas de pagos', async () => {
      // Arrange
      const query: PaymentSummaryQueryDTO = {
        userId: 1,
      };
      const expected: PaymentSummaryResponseDTO = {
        totalPayments: 5,
        successfulPayments: 4,
        totalAmount: 500,
        successRate: 80,
        averageAmount: 100,
      } as PaymentSummaryResponseDTO;
      mockGetMetricsSummary.mockResolvedValue(expected);

      // Act
      const result = await controller.getSummary(query);

      // Assert
      expect(mockGetMetricsSummary).toHaveBeenCalledWith(
        query.userId,
        query.professionalId,
      );
      expect(result).toBe(expected);
    });
  });

  // ==================== getTrends ====================
  describe('getTrends', () => {
    it('debe retornar las tendencias de pagos para los días indicados', async () => {
      // Arrange
      const query: PaymentTrendsQueryDTO = { days: 30, userId: 1 };
      const expected: PaymentTrendsResponseDTO = {
        trends: [],
        days: 30,
      };
      mockGetMetricsTrends.mockResolvedValue(expected);

      // Act
      const result = await controller.getTrends(query);

      // Assert
      expect(mockGetMetricsTrends).toHaveBeenCalledWith(
        query.days,
        query.userId,
      );
      expect(result).toBe(expected);
    });
  });

  // ==================== findOne ====================
  describe('findOne', () => {
    it('debe retornar el detalle de un pago por ID', async () => {
      // Arrange
      const param: PaymentIdParamDTO = { id: 'pay-1' };
      const expected: PaymentDetailResponseDTO = {
        id: 'pay-1',
      } as unknown as PaymentDetailResponseDTO;
      mockGetPaymentById.mockResolvedValue(expected);

      // Act
      const result = await controller.findOne(param);

      // Assert
      expect(mockGetPaymentById).toHaveBeenCalledWith(param.id);
      expect(result).toBe(expected);
    });
  });

  // ==================== update ====================
  describe('update', () => {
    it('debe actualizar un pago existente y retornar el detalle actualizado', async () => {
      // Arrange
      const param: PaymentIdParamDTO = { id: 'pay-1' };
      const dto: UpdatePaymentDto = {
        amount: 200,
      };
      const expected: PaymentDetailResponseDTO = {
        id: 'pay-1',
        amount: 200,
      } as unknown as PaymentDetailResponseDTO;
      mockUpdatePayment.mockResolvedValue(expected);

      // Act
      const result = await controller.update(param, dto);

      // Assert
      expect(mockUpdatePayment).toHaveBeenCalledWith(param.id, dto);
      expect(result).toBe(expected);
    });
  });

  // ==================== cancel ====================
  describe('cancel', () => {
    it('debe cancelar un pago y retornar el detalle con estado cancelado', async () => {
      // Arrange
      const param: PaymentIdParamDTO = { id: 'pay-1' };
      const expected: PaymentDetailResponseDTO = {
        id: 'pay-1',
        status: PaymentStatus.CANCELLED,
      } as unknown as PaymentDetailResponseDTO;
      mockCancelPayment.mockResolvedValue(expected);

      // Act
      const result = await controller.cancel(param, { user: mockUser });

      // Assert
      expect(mockCancelPayment).toHaveBeenCalledWith(param.id, mockUser.id);
      expect(result).toBe(expected);
    });
  });

  // ==================== refund ====================
  describe('refund', () => {
    it('debe procesar un reembolso y retornar el pago actualizado', async () => {
      // Arrange
      const param: PaymentIdParamDTO = { id: 'pay-1' };
      const dto = {
        amount: 50,
        reason: RefundReason.SERVICE_NOT_PROVIDED,
      } as RefundPaymentDto;
      const expected: PaymentDetailResponseDTO = {
        id: 'pay-1',
      } as unknown as PaymentDetailResponseDTO;
      mockRefundPayment.mockResolvedValue(expected);

      // Act
      const result = await controller.refund(param, dto);

      // Assert
      expect(mockRefundPayment).toHaveBeenCalledWith(param.id, dto);
      expect(result).toBe(expected);
    });
  });

  // ==================== createMethod ====================
  describe('createMethod', () => {
    it('debe crear un método de pago y retornar su detalle', async () => {
      // Arrange
      const dto: CreatePaymentMethodRequestDTO = {
        name: 'Visa',
        type: 'CARD',
      } as unknown as CreatePaymentMethodRequestDTO;
      const expected: PaymentMethodDetailResponseDTO = {
        id: 'method-1',
      } as unknown as PaymentMethodDetailResponseDTO;
      mockCreatePaymentMethod.mockResolvedValue(expected);

      // Act
      const result = await controller.createMethod(dto, { user: mockUser });

      // Assert
      expect(mockCreatePaymentMethod).toHaveBeenCalledWith(mockUser.id, dto);
      expect(result).toBe(expected);
    });
  });

  // ==================== updateMethod ====================
  describe('updateMethod', () => {
    it('debe actualizar un método de pago y retornar el detalle actualizado', async () => {
      // Arrange
      const param: PaymentMethodIdParamDTO = {
        id: 'method-1',
      };
      const dto: UpdatePaymentMethodDto = {
        isDefault: true,
      };
      const expected: PaymentMethodDetailResponseDTO = {
        id: 'method-1',
        isDefault: true,
      } as unknown as PaymentMethodDetailResponseDTO;
      mockUpdatePaymentMethod.mockResolvedValue(expected);

      // Act
      const result = await controller.updateMethod(param, dto, {
        user: mockUser,
      });

      // Assert
      expect(mockUpdatePaymentMethod).toHaveBeenCalledWith(
        param.id,
        mockUser.id,
        dto,
      );
      expect(result).toBe(expected);
    });
  });

  // ==================== deleteMethod ====================
  describe('deleteMethod', () => {
    it('debe eliminar un método de pago sin retornar contenido', async () => {
      // Arrange
      const param: PaymentMethodIdParamDTO = {
        id: 'method-1',
      };
      mockDeletePaymentMethod.mockResolvedValue(undefined);

      // Act
      const result = await controller.deleteMethod(param, { user: mockUser });

      // Assert
      expect(mockDeletePaymentMethod).toHaveBeenCalledWith(
        param.id,
        mockUser.id,
      );
      expect(result).toBeUndefined();
    });
  });

  // ==================== handleWebhooks ====================
  describe('handleWebhooks', () => {
    it('debe procesar el webhook del proveedor indicado', async () => {
      // Arrange
      const param: PaymentWebhookParamDTO = {
        provider: PaymentProvider.STRIPE,
      };
      const payload: Record<string, unknown> = {
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_123' } },
      };
      mockProcessWebhook.mockResolvedValue(undefined);

      // Act
      const result = await controller.handleWebhooks(param, payload);

      // Assert
      expect(mockProcessWebhook).toHaveBeenCalledWith(param.provider, payload);
      expect(result).toBeUndefined();
    });
  });
});
