import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PromotionStatus, PromotionType } from '@prisma/client';
import { PromotionsService } from './promotions.service';
import { PromotionsDbService } from '@modules/promotions-db/services/promotions-db.service';

const mockFindByCode = jest.fn();
const mockCreate = jest.fn();
const mockFindAll = jest.fn();
const mockFindActive = jest.fn();
const mockFindById = jest.fn();
const mockUpdate = jest.fn();
const mockDeactivate = jest.fn();
const mockCountUsageByUser = jest.fn();
const mockApplyTransaction = jest.fn();
const mockCountPromotions = jest.fn();
const mockAggregateUsage = jest.fn();

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
        {
          provide: PromotionsDbService,
          useValue: {
            findByCode: mockFindByCode,
            create: mockCreate,
            findAll: mockFindAll,
            findActive: mockFindActive,
            findById: mockFindById,
            update: mockUpdate,
            deactivate: mockDeactivate,
            countUsageByUser: mockCountUsageByUser,
            applyTransaction: mockApplyTransaction,
            countPromotions: mockCountPromotions,
            aggregateUsage: mockAggregateUsage,
          },
        },
      ],
    }).compile();

    service = module.get<PromotionsService>(PromotionsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('debe crear la promoción cuando el código no existe', async () => {
      // Arrange
      const dto = {
        code: 'NUEVO2025',
        type: PromotionType.PERCENTAGE,
      } as never;
      mockFindByCode.mockResolvedValue(null);
      mockCreate.mockResolvedValue({ ...promocionActiva, code: 'NUEVO2025' });

      // Act
      const result = await service.create(dto, 1);

      // Assert
      expect(mockFindByCode).toHaveBeenCalledWith('NUEVO2025');
      expect(mockCreate).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('debe lanzar BadRequestException cuando el código ya existe', async () => {
      // Arrange
      const dto = { code: 'VERANO2025' } as never;
      mockFindByCode.mockResolvedValue(promocionActiva);

      // Act & Assert
      await expect(service.create(dto, 1)).rejects.toThrow(BadRequestException);
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('debe retornar todas las promociones ordenadas por fecha de creación', async () => {
      // Arrange
      mockFindAll.mockResolvedValue([promocionActiva]);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toBeDefined();
      expect(mockFindAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('debe retornar la promoción cuando existe', async () => {
      // Arrange
      const promConUsages = { ...promocionActiva, usages: [] };
      mockFindById.mockResolvedValue(promConUsages);

      // Act
      const resultado = await service.findOne(promocionActiva.id);

      // Assert
      expect(resultado).toMatchObject({
        id: promocionActiva.id,
        code: 'VERANO2025',
      });
      expect(mockFindById).toHaveBeenCalledWith(promocionActiva.id);
    });

    it('debe lanzar NotFoundException si la promoción no existe', async () => {
      // Arrange
      mockFindById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('id-inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('debe desactivar la promoción cuando existe', async () => {
      // Arrange
      mockFindById.mockResolvedValue({ ...promocionActiva, usages: [] });
      mockDeactivate.mockResolvedValue({
        ...promocionActiva,
        status: PromotionStatus.INACTIVE,
      });

      // Act
      const result = await service.remove(promocionActiva.id);

      // Assert
      expect(mockDeactivate).toHaveBeenCalledWith(promocionActiva.id);
      expect(result).toBeDefined();
    });
  });

  describe('validatePromotion', () => {
    it('debe retornar isValid:true y discountAmount calculado para una promoción válida', async () => {
      // Arrange
      mockFindByCode.mockResolvedValue(promocionActiva);
      mockCountUsageByUser.mockResolvedValue(0);

      // Act
      const resultado = await service.validatePromotion(
        'VERANO2025',
        42,
        'cliente',
        100000,
      );

      // Assert
      expect(resultado.isValid).toBe(true);
      // 20% de 100 000 = 20 000; cap maximumDiscount=30 000 → 20 000
      expect(resultado.discountAmount).toBe(20000);
    });

    it('debe retornar isValid:false si la promoción está INACTIVE', async () => {
      // Arrange
      mockFindByCode.mockResolvedValue({
        ...promocionActiva,
        status: PromotionStatus.INACTIVE,
      });

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
      mockFindByCode.mockResolvedValue(promocionActiva); // minimumAmount = 50 000
      mockCountUsageByUser.mockResolvedValue(0);

      // Act
      const resultado = await service.validatePromotion(
        'VERANO2025',
        42,
        'cliente',
        10000,
      );

      // Assert
      expect(resultado.isValid).toBe(false);
      expect(resultado.discountAmount).toBe(0);
      expect(resultado.message).toContain('50000');
    });

    it('debe retornar isValid:false si el usuario ya usó la promoción el máximo de veces', async () => {
      // Arrange
      mockFindByCode.mockResolvedValue(promocionActiva); // maxUsagePerUser = 1
      mockCountUsageByUser.mockResolvedValue(1);

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

  describe('applyPromotion', () => {
    const dtoBase = {
      promotionCode: 'VERANO2025',
      serviceId: 'srv-uuid-001',
      serviceAmount: 100000,
      userId: 42,
      userType: 'cliente',
    };

    it('debe retornar success:true y aplicar el descuento cuando la promoción es válida', async () => {
      // Arrange
      mockFindByCode.mockResolvedValue(promocionActiva);
      mockCountUsageByUser.mockResolvedValue(0);
      mockApplyTransaction.mockResolvedValue(undefined);

      // Act
      const resultado = await service.applyPromotion(dtoBase);

      // Assert
      expect(resultado.success).toBe(true);
      expect(resultado.discountAmount).toBe(20000);
      expect(resultado.finalAmount).toBe(80000);
      expect(mockApplyTransaction).toHaveBeenCalledTimes(1);
    });

    it('debe retornar success:false cuando la validación de la promoción falla', async () => {
      // Arrange — código inexistente dispara NotFoundException → catch → isValid:false
      mockFindByCode.mockResolvedValue(null);

      // Act
      const resultado = await service.applyPromotion(dtoBase);

      // Assert
      expect(resultado.success).toBe(false);
      expect(resultado.discountAmount).toBe(0);
      expect(resultado.finalAmount).toBe(dtoBase.serviceAmount);
      expect(mockApplyTransaction).not.toHaveBeenCalled();
    });
  });

  describe('getPromotionStats', () => {
    it('debe retornar totalPromotions, activePromotions, totalUsage y totalDiscount correctamente', async () => {
      // Arrange
      mockCountPromotions.mockResolvedValueOnce(25).mockResolvedValueOnce(8);
      mockAggregateUsage.mockResolvedValue({
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
      mockCountPromotions.mockResolvedValueOnce(5).mockResolvedValueOnce(2);
      mockAggregateUsage.mockResolvedValue({
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
