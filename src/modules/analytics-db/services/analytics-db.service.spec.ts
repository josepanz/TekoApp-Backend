import { Test, TestingModule } from '@nestjs/testing';
import { ServiceStatus, PaymentStatus } from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { AnalyticsDbService } from './analytics-db.service';

// ── Mock functions ─────────────────────────────────────────────────────────────
const mockUsersCount = jest.fn();
const mockProfessionalsCount = jest.fn();
const mockServicesCount = jest.fn();
const mockPaymentsAggregate = jest.fn();
const mockRatingAggregate = jest.fn();
const mockCategoryFindMany = jest.fn();

const mockPrisma = {
  extended: {
    users: { count: mockUsersCount },
    professionals: { count: mockProfessionalsCount },
    services: { count: mockServicesCount },
    payments: { aggregate: mockPaymentsAggregate },
    rating: { aggregate: mockRatingAggregate },
    category: { findMany: mockCategoryFindMany },
  },
};

// ── Fixtures ──────────────────────────────────────────────────────────────────
const START = new Date('2024-01-01T00:00:00Z');
const END = new Date('2024-01-31T23:59:59Z');

describe('AnalyticsDbService', () => {
  let service: AnalyticsDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsDbService,
        { provide: PrismaDatasource, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AnalyticsDbService>(AnalyticsDbService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── getUsersMetrics ──────────────────────────────────────────────────────────
  describe('getUsersMetrics', () => {
    it('debe retornar métricas de usuarios con crecimiento calculado correctamente', async () => {
      // Arrange
      mockUsersCount
        .mockResolvedValueOnce(200) // total
        .mockResolvedValueOnce(20) // currentNew
        .mockResolvedValueOnce(150) // active
        .mockResolvedValueOnce(10); // previousNew

      // Act
      const result = await service.getUsersMetrics(START, END);

      // Assert
      expect(result).toEqual({ total: 200, new: 20, active: 150, growth: 100 });
      expect(mockUsersCount).toHaveBeenCalledTimes(4);
    });

    it('debe retornar growth = 100 cuando no había usuarios en el periodo anterior pero hay nuevos ahora', async () => {
      // Arrange
      mockUsersCount
        .mockResolvedValueOnce(5) // total
        .mockResolvedValueOnce(5) // currentNew
        .mockResolvedValueOnce(5) // active
        .mockResolvedValueOnce(0); // previousNew = 0

      // Act
      const result = await service.getUsersMetrics(START, END);

      // Assert
      expect(result.growth).toBe(100);
    });

    it('debe retornar growth = 0 cuando no hay usuarios nuevos en ninguno de los dos periodos', async () => {
      // Arrange
      mockUsersCount
        .mockResolvedValueOnce(0) // total
        .mockResolvedValueOnce(0) // currentNew
        .mockResolvedValueOnce(0) // active
        .mockResolvedValueOnce(0); // previousNew

      // Act
      const result = await service.getUsersMetrics(START, END);

      // Assert
      expect(result.growth).toBe(0);
    });
  });

  // ── getProfessionalsMetrics ──────────────────────────────────────────────────
  describe('getProfessionalsMetrics', () => {
    it('debe retornar métricas de profesionales con los conteos correctos', async () => {
      // Arrange
      mockProfessionalsCount
        .mockResolvedValueOnce(50) // total activos
        .mockResolvedValueOnce(5) // nuevos en periodo
        .mockResolvedValueOnce(30) // disponibles y activos
        .mockResolvedValueOnce(40); // verificados y activos

      // Act
      const result = await service.getProfessionalsMetrics(START, END);

      // Assert
      expect(result).toEqual({
        total: 50,
        new: 5,
        available: 30,
        verified: 40,
        growth: 0,
      });
      expect(mockProfessionalsCount).toHaveBeenCalledTimes(4);
    });

    it('debe retornar zeros cuando no hay profesionales registrados', async () => {
      // Arrange
      mockProfessionalsCount.mockResolvedValue(0);

      // Act
      const result = await service.getProfessionalsMetrics(START, END);

      // Assert
      expect(result).toEqual({
        total: 0,
        new: 0,
        available: 0,
        verified: 0,
        growth: 0,
      });
    });
  });

  // ── getServicesMetrics ───────────────────────────────────────────────────────
  describe('getServicesMetrics', () => {
    it('debe retornar métricas de servicios calculando activos como total menos completados y cancelados', async () => {
      // Arrange
      mockServicesCount
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(60) // completed
        .mockResolvedValueOnce(20) // pending
        .mockResolvedValueOnce(15); // cancelled

      // Act
      const result = await service.getServicesMetrics(START, END);

      // Assert
      expect(result).toEqual({
        total: 100,
        active: 25, // 100 - 60 - 15
        completed: 60,
        pending: 20,
        cancelled: 15,
        growth: 0,
      });
    });

    it('debe retornar todos los conteos en cero cuando no hay servicios en el rango', async () => {
      // Arrange
      mockServicesCount.mockResolvedValue(0);

      // Act
      const result = await service.getServicesMetrics(START, END);

      // Assert
      expect(result.total).toBe(0);
      expect(result.active).toBe(0);
    });

    it('debe filtrar por el rango de fechas recibido en todos los conteos', async () => {
      // Arrange
      mockServicesCount.mockResolvedValue(0);

      // Act
      await service.getServicesMetrics(START, END);

      // Assert
      const calls: unknown[][] = mockServicesCount.mock.calls as unknown[][];
      calls.forEach((call: unknown[]) => {
        const createdAtMatcher: unknown = expect.objectContaining({
          createdAt: { gte: START, lte: END },
        });
        expect(call[0]).toMatchObject({ where: createdAtMatcher });
      });
    });
  });

  // ── getRevenueMetrics ────────────────────────────────────────────────────────
  describe('getRevenueMetrics', () => {
    it('debe retornar métricas de ingresos a partir de la agregación de pagos completados', async () => {
      // Arrange
      mockPaymentsAggregate.mockResolvedValue({
        _sum: { totalAmount: 50000, platformFee: 5000 },
        _count: { id: 12 },
        _avg: { totalAmount: 4166.67 },
      });

      // Act
      const result = await service.getRevenueMetrics(START, END);

      // Assert
      expect(result).toEqual({
        total: 50000,
        period: 50000,
        platformRevenue: 5000,
        transactions: 12,
        average: 4166.67,
        growth: 0,
      });
      const whereContaining: unknown = expect.objectContaining({
        status: PaymentStatus.COMPLETED,
      });
      expect(mockPaymentsAggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: whereContaining,
        }),
      );
    });

    it('debe retornar ceros cuando no hay pagos en el periodo', async () => {
      // Arrange
      mockPaymentsAggregate.mockResolvedValue({
        _sum: { totalAmount: null, platformFee: null },
        _count: { id: 0 },
        _avg: { totalAmount: null },
      });

      // Act
      const result = await service.getRevenueMetrics(START, END);

      // Assert
      expect(result.total).toBe(0);
      expect(result.platformRevenue).toBe(0);
      expect(result.transactions).toBe(0);
      expect(result.average).toBe(0);
    });
  });

  // ── getRatingsMetrics ────────────────────────────────────────────────────────
  describe('getRatingsMetrics', () => {
    it('debe retornar el promedio de calificaciones redondeado a dos decimales', async () => {
      // Arrange
      mockRatingAggregate.mockResolvedValue({
        _avg: { rating: 4.567 },
        _count: { id: 30 },
      });

      // Act
      const result = await service.getRatingsMetrics(START, END);

      // Assert
      expect(result.average).toBe(4.57);
      expect(result.total).toBe(30);
      expect(result.period).toBe(30);
    });

    it('debe retornar average = 0 cuando no hay calificaciones en el periodo', async () => {
      // Arrange
      mockRatingAggregate.mockResolvedValue({
        _avg: { rating: null },
        _count: { id: 0 },
      });

      // Act
      const result = await service.getRatingsMetrics(START, END);

      // Assert
      expect(result.average).toBe(0);
      expect(result.total).toBe(0);
    });
  });

  // ── getCategoryPerformance ───────────────────────────────────────────────────
  describe('getCategoryPerformance', () => {
    it('debe retornar el rendimiento de cada categoría con el conteo de servicios completados', async () => {
      // Arrange
      mockCategoryFindMany.mockResolvedValue([
        {
          id: 1,
          name: 'Limpieza',
          services: [
            { id: 's1', status: ServiceStatus.COMPLETED },
            { id: 's2', status: ServiceStatus.PENDING },
            { id: 's3', status: ServiceStatus.COMPLETED },
          ],
        },
        {
          id: 2,
          name: 'Plomería',
          services: [],
        },
      ]);

      // Act
      const result = await service.getCategoryPerformance(START, END);

      // Assert
      expect(result).toEqual([
        { id: 1, name: 'Limpieza', totalServices: 3, completedServices: 2 },
        { id: 2, name: 'Plomería', totalServices: 0, completedServices: 0 },
      ]);
    });

    it('debe retornar una lista vacía cuando no hay categorías activas', async () => {
      // Arrange
      mockCategoryFindMany.mockResolvedValue([]);

      // Act
      const result = await service.getCategoryPerformance(START, END);

      // Assert
      expect(result).toEqual([]);
    });

    it('debe filtrar únicamente categorías con status ACTIVE', async () => {
      // Arrange
      mockCategoryFindMany.mockResolvedValue([]);

      // Act
      await service.getCategoryPerformance(START, END);

      // Assert
      expect(mockCategoryFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'ACTIVE' },
        }),
      );
    });
  });
});
