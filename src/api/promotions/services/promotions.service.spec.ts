import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PromotionStatus, PromotionType } from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { PromotionsService } from './promotions.service';

// ──────────────────────────────────────────────
// Mocks de Prisma a nivel de módulo
// ──────────────────────────────────────────────
const mockPromotionFindUnique = jest.fn();
const mockPromotionFindMany = jest.fn();
const mockPromotionCreate = jest.fn();
const mockPromotionUpdate = jest.fn();
const mockPromotionCount = jest.fn();
const mockPromotionUsageCount = jest.fn();
const mockPromotionUsageCreate = jest.fn();
const mockPromotionUsageAggregate = jest.fn();
const mockTransaction = jest.fn();

const mockPrisma = {
  extended: {
    promotion: {
      findUnique: mockPromotionFindUnique,
      findMany: mockPromotionFindMany,
      create: mockPromotionCreate,
      update: mockPromotionUpdate,
      count: mockPromotionCount,
    },
    promotionUsage: {
      count: mockPromotionUsageCount,
      create: mockPromotionUsageCreate,
      aggregate: mockPromotionUsageAggregate,
    },
    $transaction: mockTransaction,
  },
};

// ──────────────────────────────────────────────
// Fixtures reutilizables
// ──────────────────────────────────────────────
const ahora = new Date();
const ayer = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);
const manana = new Date(ahora.getTime() + 24 * 60 * 60 * 1000);

const promocionActiva = {
  id: 'promo-uuid-001',
  code: 'VERANO2025',
  name: 'Descuento de verano',
  description: '20% en todos los servicios',
  type: PromotionType.PERCENTAGE,
  status: PromotionStatus.ACTIVE,
  discountPercentage: 20,
  discountAmount: null,
  minimumAmount: 50000,
  maximumDiscount: 30000,
  maxUsage: 100,
  maxUsagePerUser: 1,
  currentUsage: 10,
  validFrom: ayer,
  validUntil: manana,
  allowedUserTypes: [],
  specificUserIds: [],
  createdById: 1,
  createdAt: ayer,
  lastChangedAt: null,
};

describe('PromotionsService', () => {
  let service: PromotionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromotionsService,
        { provide: PrismaDatasource, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PromotionsService>(PromotionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ────────────────────────────────────────────
  // findOne
  // ────────────────────────────────────────────
  describe('findOne', () => {
    it('debe lanzar NotFoundException si la promoción no existe', async () => {
      // Arrange
      mockPromotionFindUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('id-inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe retornar la promoción cuando existe', async () => {
      // Arrange
      const promConUsages = { ...promocionActiva, usages: [] };
      mockPromotionFindUnique.mockResolvedValue(promConUsages);

      // Act
      const resultado = await service.findOne(promocionActiva.id);

      // Assert
      expect(resultado).toMatchObject({
        id: promocionActiva.id,
        code: 'VERANO2025',
      });
      expect(mockPromotionFindUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: promocionActiva.id } }),
      );
    });
  });

  // ────────────────────────────────────────────
  // validatePromotion
  // ────────────────────────────────────────────
  describe('validatePromotion', () => {
    it('debe retornar isValid:true y discountAmount calculado para una promoción válida', async () => {
      // Arrange
      mockPromotionFindUnique.mockResolvedValue(promocionActiva);
      mockPromotionUsageCount.mockResolvedValue(0);

      // Act
      const resultado = await service.validatePromotion(
        'VERANO2025',
        42,
        'cliente',
        100000,
      );

      // Assert
      expect(resultado.isValid).toBe(true);
      // 20 % de 100 000 = 20 000; cap maximumDiscount=30 000 → 20 000
      expect(resultado.discountAmount).toBe(20000);
    });

    it('debe retornar isValid:false si la promoción está INACTIVE', async () => {
      // Arrange
      const promInactiva = {
        ...promocionActiva,
        status: PromotionStatus.INACTIVE,
      };
      mockPromotionFindUnique.mockResolvedValue(promInactiva);

      // Act
      const resultado = await service.validatePromotion(
        'VERANO2025',
        42,
        'cliente',
        100000,
      );

      // Assert
      expect(resultado.isValid).toBe(false);
      expect(resultado.discountAmount).toBe(0);
    });

    it('debe retornar isValid:false si el monto es menor al mínimo requerido', async () => {
      // Arrange
      mockPromotionFindUnique.mockResolvedValue(promocionActiva); // minimumAmount = 50 000
      mockPromotionUsageCount.mockResolvedValue(0);

      // Act
      const resultado = await service.validatePromotion(
        'VERANO2025',
        42,
        'cliente',
        10000, // monto menor al mínimo
      );

      // Assert
      expect(resultado.isValid).toBe(false);
      expect(resultado.discountAmount).toBe(0);
      expect(resultado.message).toContain('50000');
    });

    it('debe retornar isValid:false si el usuario ya usó la promoción el máximo de veces', async () => {
      // Arrange
      mockPromotionFindUnique.mockResolvedValue(promocionActiva); // maxUsagePerUser = 1
      mockPromotionUsageCount.mockResolvedValue(1); // ya usó 1 vez

      // Act
      const resultado = await service.validatePromotion(
        'VERANO2025',
        42,
        'cliente',
        100000,
      );

      // Assert
      expect(resultado.isValid).toBe(false);
      expect(resultado.discountAmount).toBe(0);
      expect(resultado.message).toContain('máximo');
    });
  });

  // ────────────────────────────────────────────
  // applyPromotion
  // ────────────────────────────────────────────
  describe('applyPromotion', () => {
    const dtoBase = {
      promotionCode: 'VERANO2025',
      serviceId: 'srv-uuid-001',
      serviceAmount: 100000,
      userId: 42,
      userType: 'cliente',
    };

    it('debe retornar success:true y crear el PromotionUsage cuando la promoción es válida', async () => {
      // Arrange
      mockPromotionFindUnique.mockResolvedValue(promocionActiva);
      mockPromotionUsageCount.mockResolvedValue(0);
      mockTransaction.mockResolvedValue([{}, {}]);

      // Act
      const resultado = await service.applyPromotion(dtoBase);

      // Assert
      expect(resultado.success).toBe(true);
      expect(resultado.discountAmount).toBe(20000);
      expect(resultado.finalAmount).toBe(80000);
      expect(mockTransaction).toHaveBeenCalledTimes(1);
    });

    it('debe retornar success:false cuando la validación de la promoción falla', async () => {
      // Arrange — código inexistente dispara NotFoundException → catch → isValid:false
      mockPromotionFindUnique.mockResolvedValue(null);

      // Act
      const resultado = await service.applyPromotion(dtoBase);

      // Assert
      expect(resultado.success).toBe(false);
      expect(resultado.discountAmount).toBe(0);
      expect(resultado.finalAmount).toBe(dtoBase.serviceAmount);
      expect(mockTransaction).not.toHaveBeenCalled();
    });
  });

  // ────────────────────────────────────────────
  // getPromotionStats
  // ────────────────────────────────────────────
  describe('getPromotionStats', () => {
    it('debe retornar totalPromotions, activePromotions, totalUsage y totalDiscount correctamente', async () => {
      // Arrange
      mockPromotionCount
        .mockResolvedValueOnce(25) // totalPromotions
        .mockResolvedValueOnce(8); // activePromotions
      mockPromotionUsageAggregate.mockResolvedValue({
        _count: { id: 342 },
        _sum: { discountAmount: 5750000 },
      });

      // Act
      const resultado = await service.getPromotionStats();

      // Assert
      expect(resultado).toEqual({
        totalPromotions: 25,
        activePromotions: 8,
        totalUsage: 342,
        totalDiscount: 5750000,
      });
    });

    it('debe retornar totalDiscount:0 cuando no hay usos registrados', async () => {
      // Arrange
      mockPromotionCount.mockResolvedValueOnce(5).mockResolvedValueOnce(2);
      mockPromotionUsageAggregate.mockResolvedValue({
        _count: { id: 0 },
        _sum: { discountAmount: null },
      });

      // Act
      const resultado = await service.getPromotionStats();

      // Assert
      expect(resultado.totalUsage).toBe(0);
      expect(resultado.totalDiscount).toBe(0);
    });
  });
});
