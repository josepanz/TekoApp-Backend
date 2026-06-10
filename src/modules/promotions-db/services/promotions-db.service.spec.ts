import { Test, TestingModule } from '@nestjs/testing';
import { PromotionStatus } from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { PromotionsDbService } from './promotions-db.service';

// ─── Mocks de promotion ───────────────────────────────────────────────────────
const mockPromotionFindUnique = jest.fn();
const mockPromotionFindMany = jest.fn();
const mockPromotionCreate = jest.fn();
const mockPromotionUpdate = jest.fn();
const mockPromotionCount = jest.fn();

// ─── Mocks de promotionUsage ──────────────────────────────────────────────────
const mockPromotionUsageCount = jest.fn();
const mockPromotionUsageCreate = jest.fn();
const mockPromotionUsageAggregate = jest.fn();

// ─── Mock de $transaction ─────────────────────────────────────────────────────
const mockTransaction = jest.fn();

const mockPrisma = {
  extended: {
    promotion: {
      findUnique: mockPromotionFindUnique,
      findMany: mockPromotionFindMany,
      create: mockPromotionCreate,
      update: mockPromotionUpdate,
      count: mockPromotionCount,
      fields: undefined,
    },
    promotionUsage: {
      count: mockPromotionUsageCount,
      create: mockPromotionUsageCreate,
      aggregate: mockPromotionUsageAggregate,
    },
    $transaction: mockTransaction,
  },
};

describe('PromotionsDbService', () => {
  let service: PromotionsDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromotionsDbService,
        { provide: PrismaDatasource, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PromotionsDbService>(PromotionsDbService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── findByCode ──────────────────────────────────────────────────────────
  describe('findByCode', () => {
    it('debe retornar la promoción cuando el código existe', async () => {
      // Arrange
      const promo = { id: 'promo-1', code: 'DESC10' };
      mockPromotionFindUnique.mockResolvedValue(promo);

      // Act
      const result = await service.findByCode('DESC10');

      // Assert
      expect(result).toEqual(promo);
      expect(mockPromotionFindUnique).toHaveBeenCalledWith({
        where: { code: 'DESC10' },
      });
    });

    it('debe retornar null cuando el código no existe', async () => {
      // Arrange
      mockPromotionFindUnique.mockResolvedValue(null);

      // Act
      const result = await service.findByCode('INEXISTENTE');

      // Assert
      expect(result).toBeNull();
    });
  });

  // ─── create ──────────────────────────────────────────────────────────────
  describe('create', () => {
    it('debe retornar la promoción creada con los datos provistos', async () => {
      // Arrange
      const data = {
        code: 'NEW20',
        discountType: 'PERCENTAGE',
        discountValue: 20,
      };
      const created = { id: 'promo-2', ...data };
      mockPromotionCreate.mockResolvedValue(created);

      // Act
      const result = await service.create(data as never);

      // Assert
      expect(result).toEqual(created);
      expect(mockPromotionCreate).toHaveBeenCalledWith({ data });
    });
  });

  // ─── findAll ─────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('debe retornar todas las promociones ordenadas por fecha de creación descendente', async () => {
      // Arrange
      const promos = [{ id: 'p1' }, { id: 'p2' }];
      mockPromotionFindMany.mockResolvedValue(promos);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual(promos);
      expect(mockPromotionFindMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  // ─── findActive ──────────────────────────────────────────────────────────
  describe('findActive', () => {
    it('debe retornar las promociones activas cuando la consulta con OR tiene éxito', async () => {
      // Arrange
      const promos = [
        { id: 'p1', status: PromotionStatus.ACTIVE, maxUsage: -1 },
      ];
      mockPromotionFindMany.mockResolvedValue(promos);

      // Act
      const result = await service.findActive();

      // Assert
      expect(result).toEqual(promos);
      expect(mockPromotionFindMany).toHaveBeenCalledTimes(1);
      expect(mockPromotionFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: PromotionStatus.ACTIVE,
            OR: expect.arrayContaining([
              expect.objectContaining({ maxUsage: -1 }) as unknown,
            ]) as unknown,
          }) as unknown,
        }),
      );
    });

    it('debe ejecutar el fallback y filtrar en memoria cuando la consulta con OR falla', async () => {
      // Arrange
      const allPromos = [
        { id: 'p1', maxUsage: -1, currentUsage: 0 }, // válida — maxUsage -1
        { id: 'p2', maxUsage: 10, currentUsage: 5 }, // válida — currentUsage < maxUsage
        { id: 'p3', maxUsage: 5, currentUsage: 5 }, // inválida — alcanzó el límite
      ];
      mockPromotionFindMany
        .mockRejectedValueOnce(new Error('OR query unsupported'))
        .mockResolvedValueOnce(allPromos);

      // Act
      const result = await service.findActive();

      // Assert
      expect(result).toHaveLength(2);
      expect(result.map((p) => p.id)).toEqual(['p1', 'p2']);
      expect(mockPromotionFindMany).toHaveBeenCalledTimes(2);
    });
  });

  // ─── findById ────────────────────────────────────────────────────────────
  describe('findById', () => {
    it('debe retornar la promoción con sus usos cuando existe el id', async () => {
      // Arrange
      const promo = { id: 'promo-1', code: 'X10', usages: [] };
      mockPromotionFindUnique.mockResolvedValue(promo);

      // Act
      const result = await service.findById('promo-1');

      // Assert
      expect(result).toEqual(promo);
      expect(mockPromotionFindUnique).toHaveBeenCalledWith({
        where: { id: 'promo-1' },
        include: { usages: true },
      });
    });
  });

  // ─── update ──────────────────────────────────────────────────────────────
  describe('update', () => {
    it('debe retornar la promoción actualizada con los datos provistos', async () => {
      // Arrange
      const updated = { id: 'promo-1', code: 'X10', maxUsage: 100 };
      mockPromotionUpdate.mockResolvedValue(updated);

      // Act
      const result = await service.update('promo-1', { maxUsage: 100 });

      // Assert
      expect(result).toEqual(updated);
      expect(mockPromotionUpdate).toHaveBeenCalledWith({
        where: { id: 'promo-1' },
        data: { maxUsage: 100 },
      });
    });
  });

  // ─── deactivate ──────────────────────────────────────────────────────────
  describe('deactivate', () => {
    it('debe marcar la promoción con status INACTIVE', async () => {
      // Arrange
      const deactivated = { id: 'promo-1', status: PromotionStatus.INACTIVE };
      mockPromotionUpdate.mockResolvedValue(deactivated);

      // Act
      const result = await service.deactivate('promo-1');

      // Assert
      expect(result).toEqual(deactivated);
      expect(mockPromotionUpdate).toHaveBeenCalledWith({
        where: { id: 'promo-1' },
        data: { status: PromotionStatus.INACTIVE },
      });
    });
  });

  // ─── countUsageByUser ────────────────────────────────────────────────────
  describe('countUsageByUser', () => {
    it('debe retornar la cantidad de veces que el usuario usó la promoción', async () => {
      // Arrange
      mockPromotionUsageCount.mockResolvedValue(3);

      // Act
      const result = await service.countUsageByUser('promo-1', 10);

      // Assert
      expect(result).toBe(3);
      expect(mockPromotionUsageCount).toHaveBeenCalledWith({
        where: { promotionId: 'promo-1', userId: 10 },
      });
    });

    it('debe retornar 0 cuando el usuario nunca usó la promoción', async () => {
      // Arrange
      mockPromotionUsageCount.mockResolvedValue(0);

      // Act
      const result = await service.countUsageByUser('promo-1', 99);

      // Assert
      expect(result).toBe(0);
    });
  });

  // ─── applyTransaction ────────────────────────────────────────────────────
  describe('applyTransaction', () => {
    it('debe ejecutar la transacción creando el uso e incrementando el contador sin retornar valor', async () => {
      // Arrange
      mockTransaction.mockResolvedValue(undefined);
      mockPromotionUsageCreate.mockReturnValue({});
      mockPromotionUpdate.mockReturnValue({});

      const data = {
        promotionId: 'promo-1',
        userId: 5,
        serviceId: 'svc-1',
        originalAmount: 100,
        discountAmount: 20,
        finalAmount: 80,
        metadata: { source: 'mobile' },
      };

      // Act
      await service.applyTransaction(data);

      // Assert
      expect(mockTransaction).toHaveBeenCalledWith(
        expect.arrayContaining([expect.anything(), expect.anything()]),
      );
      expect(mockPromotionUsageCreate).toHaveBeenCalledWith({
        data: {
          promotionId: 'promo-1',
          userId: 5,
          serviceId: 'svc-1',
          originalAmount: 100,
          discountAmount: 20,
          finalAmount: 80,
          metadata: { source: 'mobile' },
        },
      });
      expect(mockPromotionUpdate).toHaveBeenCalledWith({
        where: { id: 'promo-1' },
        data: { currentUsage: { increment: 1 } },
      });
    });

    it('debe funcionar sin serviceId ni metadata opcionales', async () => {
      // Arrange
      mockTransaction.mockResolvedValue(undefined);
      mockPromotionUsageCreate.mockReturnValue({});
      mockPromotionUpdate.mockReturnValue({});

      // Act
      await service.applyTransaction({
        promotionId: 'promo-1',
        userId: 5,
        originalAmount: 50,
        discountAmount: 10,
        finalAmount: 40,
      });

      // Assert
      expect(mockPromotionUsageCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          serviceId: undefined,
          metadata: undefined,
        }) as unknown,
      });
    });
  });

  // ─── countPromotions ─────────────────────────────────────────────────────
  describe('countPromotions', () => {
    it('debe retornar el total de promociones cuando no se aplica filtro', async () => {
      // Arrange
      mockPromotionCount.mockResolvedValue(8);

      // Act
      const result = await service.countPromotions();

      // Assert
      expect(result).toBe(8);
      expect(mockPromotionCount).toHaveBeenCalledWith({ where: undefined });
    });

    it('debe retornar el total de promociones que cumplen el filtro dado', async () => {
      // Arrange
      mockPromotionCount.mockResolvedValue(3);

      // Act
      const result = await service.countPromotions({
        status: PromotionStatus.ACTIVE,
      });

      // Assert
      expect(result).toBe(3);
      expect(mockPromotionCount).toHaveBeenCalledWith({
        where: { status: PromotionStatus.ACTIVE },
      });
    });
  });

  // ─── aggregateUsage ──────────────────────────────────────────────────────
  describe('aggregateUsage', () => {
    it('debe retornar el conteo total de usos y la suma de descuentos aplicados', async () => {
      // Arrange
      const agg = { _count: { id: 50 }, _sum: { discountAmount: 2500 } };
      mockPromotionUsageAggregate.mockResolvedValue(agg);

      // Act
      const result = await service.aggregateUsage();

      // Assert
      expect(result).toEqual(agg);
      expect(mockPromotionUsageAggregate).toHaveBeenCalledWith({
        _count: { id: true },
        _sum: { discountAmount: true },
      });
    });
  });
});
