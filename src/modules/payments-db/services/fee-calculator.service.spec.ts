import { Test, TestingModule } from '@nestjs/testing';
import { PaymentProvider } from '@prisma/client';

import { FeeCalculatorService } from './fee-calculator.service';
import { PrismaDatasource } from '@core/database/services/prisma.service';

// ─── Mock functions (module-scope standalone, evita @typescript-eslint/unbound-method) ───

const mockFindFirstProviderConfig = jest.fn();
const mockFindFirstCommissionConfig = jest.fn();

const mockPrisma = {
  extended: {
    paymentProviderConfig: { findFirst: mockFindFirstProviderConfig },
    platformCommissionConfig: { findFirst: mockFindFirstCommissionConfig },
  },
};

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockProviderConfig = {
  id: 1,
  provider: PaymentProvider.BANCARD,
  feePercentage: '0.03', // 3 %
  feeFixed: '500', // 500 fijos
  isActive: true,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

const mockCommissionConfig = {
  id: 1,
  percentage: '0.05', // 5 %
  fixedAmount: '200', // 200 fijos
  minimumFee: null,
  maximumFee: null,
  isDefault: true,
  isActive: true,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('FeeCalculatorService', () => {
  let service: FeeCalculatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeeCalculatorService,
        {
          provide: PrismaDatasource,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<FeeCalculatorService>(FeeCalculatorService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── calculateProviderFee ──────────────────────────────────────────────────

  describe('calculateProviderFee', () => {
    it('debe calcular el fee correctamente sumando porcentaje y monto fijo cuando existe la config del proveedor', async () => {
      // Arrange
      mockFindFirstProviderConfig.mockResolvedValue(mockProviderConfig);
      const amount = 10_000;
      // fee = 10000 * 0.03 + 500 = 300 + 500 = 800
      const expectedFee = 800;

      // Act
      const result = await service.calculateProviderFee(
        amount,
        PaymentProvider.BANCARD,
      );

      // Assert
      expect(result).toBe(expectedFee);
      expect(mockFindFirstProviderConfig).toHaveBeenCalledWith({
        where: { provider: PaymentProvider.BANCARD, isActive: true },
      });
    });

    it('debe retornar 0 cuando no existe configuración para el proveedor indicado', async () => {
      // Arrange
      mockFindFirstProviderConfig.mockResolvedValue(null);

      // Act
      const result = await service.calculateProviderFee(
        10_000,
        PaymentProvider.PAYPAL,
      );

      // Assert
      expect(result).toBe(0);
    });

    it('debe reutilizar el valor en caché en llamadas consecutivas sin volver a consultar la base de datos', async () => {
      // Arrange
      mockFindFirstProviderConfig.mockResolvedValue(mockProviderConfig);

      // Act
      await service.calculateProviderFee(5_000, PaymentProvider.BANCARD);
      await service.calculateProviderFee(5_000, PaymentProvider.BANCARD);

      // Assert — la DB solo debe haberse consultado una vez
      expect(mockFindFirstProviderConfig).toHaveBeenCalledTimes(1);
    });
  });

  // ─── calculatePlatformFee ──────────────────────────────────────────────────

  describe('calculatePlatformFee', () => {
    it('debe calcular la comisión correctamente sumando porcentaje y monto fijo cuando existe la config por defecto', async () => {
      // Arrange
      mockFindFirstCommissionConfig.mockResolvedValue(mockCommissionConfig);
      const amount = 10_000;
      // fee = 10000 * 0.05 + 200 = 500 + 200 = 700
      const expectedFee = 700;

      // Act
      const result = await service.calculatePlatformFee(amount);

      // Assert
      expect(result).toBe(expectedFee);
      expect(mockFindFirstCommissionConfig).toHaveBeenCalledWith({
        where: { isDefault: true, isActive: true },
      });
    });

    it('debe aplicar el minimumFee cuando el fee calculado es menor al mínimo configurado', async () => {
      // Arrange
      const configWithMin = {
        ...mockCommissionConfig,
        percentage: '0.001', // 0.1 %
        fixedAmount: '0',
        minimumFee: '1000', // piso de 1000
        maximumFee: null,
      };
      mockFindFirstCommissionConfig.mockResolvedValue(configWithMin);
      const amount = 100;
      // fee calculado = 100 * 0.001 + 0 = 0.1 → menor que 1000 → debe devolver 1000

      // Act
      const result = await service.calculatePlatformFee(amount);

      // Assert
      expect(result).toBe(1000);
    });

    it('debe aplicar el maximumFee cuando el fee calculado supera el máximo configurado', async () => {
      // Arrange
      const configWithMax = {
        ...mockCommissionConfig,
        percentage: '0.10', // 10 %
        fixedAmount: '0',
        minimumFee: null,
        maximumFee: '500', // techo de 500
      };
      mockFindFirstCommissionConfig.mockResolvedValue(configWithMax);
      const amount = 20_000;
      // fee calculado = 20000 * 0.10 + 0 = 2000 → mayor que 500 → debe devolver 500

      // Act
      const result = await service.calculatePlatformFee(amount);

      // Assert
      expect(result).toBe(500);
    });

    it('debe retornar 0 cuando no existe configuración por defecto activa', async () => {
      // Arrange
      mockFindFirstCommissionConfig.mockResolvedValue(null);

      // Act
      const result = await service.calculatePlatformFee(10_000);

      // Assert
      expect(result).toBe(0);
    });
  });
});
