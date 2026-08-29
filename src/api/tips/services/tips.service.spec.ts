import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PaymentStatus, TipMode } from '@prisma/client';
import { TipsDbService } from '@modules/tips-db/services/tips-db.service';
import { PaymentDbService } from '@modules/payments-db/services/payment-db.service';
import { TipsService } from './tips.service';

const mockFindByPaymentId = jest.fn();
const mockCreate = jest.fn();
const mockFindActiveConfig = jest.fn();
const mockFindPaymentByReferenceId = jest.fn();

const PAYMENT_REF = 'pay-uuid-1';
const PAYMENT_PK = 10;
const CLIENT_USER_ID = 1;
const PROFESSIONAL_ID = 5;

function buildPayment(overrides: Record<string, unknown> = {}) {
  return {
    id: PAYMENT_PK,
    referenceId: PAYMENT_REF,
    userId: CLIENT_USER_ID,
    professionalId: PROFESSIONAL_ID,
    amount: 100000,
    currencyCode: 'PYG',
    status: PaymentStatus.PAID,
    ...overrides,
  };
}

describe('TipsService', () => {
  let service: TipsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TipsService,
        {
          provide: TipsDbService,
          useValue: {
            findByPaymentId: mockFindByPaymentId,
            create: mockCreate,
            findActiveConfig: mockFindActiveConfig,
          },
        },
        {
          provide: PaymentDbService,
          useValue: {
            findPaymentByReferenceId: mockFindPaymentByReferenceId,
          },
        },
      ],
    }).compile();

    service = module.get<TipsService>(TipsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getConfig', () => {
    it('debe retornar la config activa mapeada', async () => {
      // Arrange
      mockFindActiveConfig.mockResolvedValue({
        isEnabled: true,
        isMandatory: true,
        suggestedPercentages: [5, 10],
        allowFreeAmount: false,
      });

      // Act
      const result = await service.getConfig();

      // Assert
      expect(result).toEqual({
        isEnabled: true,
        isMandatory: true,
        suggestedPercentages: [5, 10],
        allowFreeAmount: false,
      });
    });

    it('debe retornar el default seguro cuando nunca se cargó ninguna config', async () => {
      // Arrange
      mockFindActiveConfig.mockResolvedValue(null);

      // Act
      const result = await service.getConfig();

      // Assert
      expect(result).toEqual({
        isEnabled: true,
        isMandatory: false,
        suggestedPercentages: [10, 15, 20],
        allowFreeAmount: true,
      });
    });
  });

  describe('createTip', () => {
    beforeEach(() => {
      mockFindPaymentByReferenceId.mockResolvedValue(buildPayment());
      mockFindByPaymentId.mockResolvedValue(null);
      mockFindActiveConfig.mockResolvedValue(null); // usa el default seguro
    });

    it('debe calcular el monto server-side cuando mode=PERCENTAGE', async () => {
      // Arrange
      mockCreate.mockResolvedValue({
        referenceId: 'tip-uuid-1',
        mode: TipMode.PERCENTAGE,
        percentage: 10,
        amount: 10000,
        currencyCode: 'PYG',
        createdAt: new Date(),
      });

      // Act
      await service.createTip(PAYMENT_REF, CLIENT_USER_ID, {
        mode: TipMode.PERCENTAGE,
        percentage: 10,
      });

      // Assert — 10% de 100000 = 10000, nunca toca fee/tax/totalAmount del pago
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentId: PAYMENT_PK,
          userId: CLIENT_USER_ID,
          professionalId: PROFESSIONAL_ID,
          mode: TipMode.PERCENTAGE,
          percentage: 10,
          amount: 10000,
          currencyCode: 'PYG',
        }),
      );
    });

    it('debe usar el monto provisto directo cuando mode=FIXED', async () => {
      // Arrange
      mockCreate.mockResolvedValue({
        referenceId: 'tip-uuid-1',
        mode: TipMode.FIXED,
        percentage: null,
        amount: 20000,
        currencyCode: 'PYG',
        createdAt: new Date(),
      });

      // Act
      await service.createTip(PAYMENT_REF, CLIENT_USER_ID, {
        mode: TipMode.FIXED,
        amount: 20000,
      });

      // Assert
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: TipMode.FIXED,
          percentage: undefined,
          amount: 20000,
        }),
      );
    });

    it('debe lanzar NotFoundException cuando el pago no existe', async () => {
      // Arrange
      mockFindPaymentByReferenceId.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.createTip(PAYMENT_REF, CLIENT_USER_ID, {
          mode: TipMode.FREE,
          amount: 5000,
        }),
      ).rejects.toThrow(NotFoundException);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('debe lanzar ForbiddenException cuando quien pide no es el cliente dueño del pago', async () => {
      // Act & Assert
      await expect(
        service.createTip(PAYMENT_REF, 999, {
          mode: TipMode.FREE,
          amount: 5000,
        }),
      ).rejects.toThrow(ForbiddenException);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException cuando el pago todavía no está PAID/COMPLETED', async () => {
      // Arrange
      mockFindPaymentByReferenceId.mockResolvedValue(
        buildPayment({ status: PaymentStatus.PENDING }),
      );

      // Act & Assert
      await expect(
        service.createTip(PAYMENT_REF, CLIENT_USER_ID, {
          mode: TipMode.FREE,
          amount: 5000,
        }),
      ).rejects.toThrow(BadRequestException);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException cuando el pago ya tiene una propina', async () => {
      // Arrange
      mockFindByPaymentId.mockResolvedValue({ id: 1 });

      // Act & Assert
      await expect(
        service.createTip(PAYMENT_REF, CLIENT_USER_ID, {
          mode: TipMode.FREE,
          amount: 5000,
        }),
      ).rejects.toThrow(BadRequestException);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException cuando las propinas están deshabilitadas', async () => {
      // Arrange
      mockFindActiveConfig.mockResolvedValue({
        isEnabled: false,
        isMandatory: false,
        suggestedPercentages: [10],
        allowFreeAmount: true,
      });

      // Act & Assert
      await expect(
        service.createTip(PAYMENT_REF, CLIENT_USER_ID, {
          mode: TipMode.FREE,
          amount: 5000,
        }),
      ).rejects.toThrow(BadRequestException);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException cuando mode=FREE y la config no permite monto libre', async () => {
      // Arrange
      mockFindActiveConfig.mockResolvedValue({
        isEnabled: true,
        isMandatory: false,
        suggestedPercentages: [10],
        allowFreeAmount: false,
      });

      // Act & Assert
      await expect(
        service.createTip(PAYMENT_REF, CLIENT_USER_ID, {
          mode: TipMode.FREE,
          amount: 5000,
        }),
      ).rejects.toThrow(BadRequestException);
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  describe('getTip', () => {
    it('debe retornar la propina mapeada cuando existe', async () => {
      // Arrange
      mockFindPaymentByReferenceId.mockResolvedValue(buildPayment());
      mockFindByPaymentId.mockResolvedValue({
        referenceId: 'tip-uuid-1',
        mode: TipMode.FIXED,
        percentage: null,
        amount: 20000,
        currencyCode: 'PYG',
        createdAt: new Date(),
      });

      // Act
      const result = await service.getTip(PAYMENT_REF);

      // Assert
      expect(result?.referenceId).toBe('tip-uuid-1');
    });

    it('debe retornar null cuando el pago no tiene propina todavía', async () => {
      // Arrange
      mockFindPaymentByReferenceId.mockResolvedValue(buildPayment());
      mockFindByPaymentId.mockResolvedValue(null);

      // Act
      const result = await service.getTip(PAYMENT_REF);

      // Assert
      expect(result).toBeNull();
    });

    it('debe lanzar NotFoundException cuando el pago no existe', async () => {
      // Arrange
      mockFindPaymentByReferenceId.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getTip('no-existe')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
