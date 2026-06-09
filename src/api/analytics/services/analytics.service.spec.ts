import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsApiService } from './analytics.service';
import { AnalyticsDbService } from '@modules/analytics-db/services/analytics-db.service';
import { TimeRange } from '../dtos/request/analytics-query.request.dto';

const mockGetUsersMetrics = jest.fn();
const mockGetProfessionalsMetrics = jest.fn();
const mockGetServicesMetrics = jest.fn();
const mockGetRevenueMetrics = jest.fn();
const mockGetRatingsMetrics = jest.fn();
const mockGetCategoryPerformance = jest.fn();

const mockUserStats = { total: 100, active: 80, new: 10 };
const mockProfStats = { total: 30, verified: 20 };
const mockServStats = { total: 50, completed: 40 };
const mockRevStats = { total: 5000 };
const mockRatingStats = { averageRating: 4.5 };

describe('AnalyticsApiService', () => {
  let service: AnalyticsApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsApiService,
        {
          provide: AnalyticsDbService,
          useValue: {
            getUsersMetrics: mockGetUsersMetrics,
            getProfessionalsMetrics: mockGetProfessionalsMetrics,
            getServicesMetrics: mockGetServicesMetrics,
            getRevenueMetrics: mockGetRevenueMetrics,
            getRatingsMetrics: mockGetRatingsMetrics,
            getCategoryPerformance: mockGetCategoryPerformance,
          },
        },
      ],
    }).compile();

    service = module.get<AnalyticsApiService>(AnalyticsApiService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getDashboardMetrics', () => {
    beforeEach(() => {
      mockGetUsersMetrics.mockResolvedValue(mockUserStats);
      mockGetProfessionalsMetrics.mockResolvedValue(mockProfStats);
      mockGetServicesMetrics.mockResolvedValue(mockServStats);
      mockGetRevenueMetrics.mockResolvedValue(mockRevStats);
      mockGetRatingsMetrics.mockResolvedValue(mockRatingStats);
    });

    it('debe retornar el dashboard con success=true cuando se pasan fechas explícitas', async () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const query = { startDate, endDate } as never;

      // Act
      const result = await service.getDashboardMetrics(query);

      // Assert
      expect(result.success).toBe(true);
      expect(result.users).toEqual(mockUserStats);
      expect(result.professionals).toEqual(mockProfStats);
      expect(result.services).toEqual(mockServStats);
      expect(result.revenue).toEqual(mockRevStats);
      expect(result.ratings).toEqual(mockRatingStats);
      expect(result.period.startDate).toEqual(startDate);
      expect(result.period.endDate).toEqual(endDate);
    });

    it('debe llamar los 5 métodos de analytics en paralelo', async () => {
      // Arrange
      const query = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-01'),
      } as never;

      // Act
      await service.getDashboardMetrics(query);

      // Assert
      expect(mockGetUsersMetrics).toHaveBeenCalledTimes(1);
      expect(mockGetProfessionalsMetrics).toHaveBeenCalledTimes(1);
      expect(mockGetServicesMetrics).toHaveBeenCalledTimes(1);
      expect(mockGetRevenueMetrics).toHaveBeenCalledTimes(1);
      expect(mockGetRatingsMetrics).toHaveBeenCalledTimes(1);
    });

    it('debe calcular el rango de fechas para timeRange DAY', async () => {
      // Arrange
      const query = { timeRange: TimeRange.DAY } as never;

      // Act
      const result = await service.getDashboardMetrics(query);

      // Assert — el período tiene endDate y startDate calculados con fechas válidas
      expect(result.period.startDate).toBeInstanceOf(Date);
      expect(result.period.endDate).toBeInstanceOf(Date);
      const diffMs =
        result.period.endDate.getTime() - result.period.startDate.getTime();
      expect(diffMs).toBeCloseTo(24 * 60 * 60 * 1000, -3);
    });

    it('debe calcular el rango de fechas para timeRange WEEK', async () => {
      // Arrange
      const query = { timeRange: TimeRange.WEEK } as never;

      // Act
      const result = await service.getDashboardMetrics(query);

      // Assert
      const diffMs =
        result.period.endDate.getTime() - result.period.startDate.getTime();
      expect(diffMs).toBeCloseTo(7 * 24 * 60 * 60 * 1000, -3);
    });

    it('debe calcular el rango de fechas para timeRange YEAR', async () => {
      // Arrange
      const query = { timeRange: TimeRange.YEAR } as never;

      // Act
      const result = await service.getDashboardMetrics(query);

      // Assert
      const diffMs =
        result.period.endDate.getTime() - result.period.startDate.getTime();
      expect(diffMs).toBeCloseTo(365 * 24 * 60 * 60 * 1000, -3);
    });

    it('debe usar 30 días por defecto si no hay timeRange ni startDate', async () => {
      // Arrange
      const query = {} as never;

      // Act
      const result = await service.getDashboardMetrics(query);

      // Assert
      const diffMs =
        result.period.endDate.getTime() - result.period.startDate.getTime();
      expect(diffMs).toBeCloseTo(30 * 24 * 60 * 60 * 1000, -3);
    });

    it('debe llamar a los servicios db con las fechas calculadas', async () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const query = { startDate, endDate } as never;

      // Act
      await service.getDashboardMetrics(query);

      // Assert
      expect(mockGetUsersMetrics).toHaveBeenCalledWith(startDate, endDate);
      expect(mockGetRevenueMetrics).toHaveBeenCalledWith(startDate, endDate);
    });
  });

  describe('getCategoriesPerformanceMetrics', () => {
    it('debe retornar categorías mapeadas con serviceCount correcto y revenue=0', async () => {
      // Arrange
      const performanceData = [
        { name: 'Plomería', totalServices: 15 },
        { name: 'Electricidad', totalServices: 10 },
      ];
      mockGetCategoryPerformance.mockResolvedValue(performanceData);
      const query = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      } as never;

      // Act
      const result = await service.getCategoriesPerformanceMetrics(query);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual({
        category: 'Plomería',
        serviceCount: 15,
        revenue: 0,
        averageRating: 0,
      });
      expect(result.data[1]).toEqual({
        category: 'Electricidad',
        serviceCount: 10,
        revenue: 0,
        averageRating: 0,
      });
    });

    it('debe retornar lista vacía si no hay datos de categorías', async () => {
      // Arrange
      mockGetCategoryPerformance.mockResolvedValue([]);
      const query = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      } as never;

      // Act
      const result = await service.getCategoriesPerformanceMetrics(query);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });
});
