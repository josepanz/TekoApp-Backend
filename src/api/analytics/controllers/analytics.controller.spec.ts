import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsApiService } from '../services/analytics.service';
import { AnalyticsQueryRequestDTO } from '../dtos/request/analytics-query.request.dto';
import { DashboardStatsResponseDTO } from '../dtos/response/dashboard-stats.response.dto';
import { CategoryPerformanceResponseDTO } from '../dtos/response/category-performance.response.dto';

const mockGetDashboardMetrics = jest.fn();
const mockGetCategoriesPerformanceMetrics = jest.fn();

describe('AnalyticsController', () => {
  let controller: AnalyticsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        {
          provide: AnalyticsApiService,
          useValue: {
            getDashboardMetrics: mockGetDashboardMetrics,
            getCategoriesPerformanceMetrics:
              mockGetCategoriesPerformanceMetrics,
          },
        },
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getDashboardStats', () => {
    it('debe delegar la consulta al servicio y retornar las métricas del dashboard', async () => {
      // Arrange
      const query = {} as AnalyticsQueryRequestDTO;
      const expected = {
        totalServices: 100,
        totalUsers: 50,
      } as unknown as DashboardStatsResponseDTO;
      mockGetDashboardMetrics.mockResolvedValue(expected);

      // Act
      const result = await controller.getDashboardStats(query);

      // Assert
      expect(result).toEqual(expected);
      expect(mockGetDashboardMetrics).toHaveBeenCalledWith(query);
    });

    it('debe propagar la excepción si el servicio falla', async () => {
      // Arrange
      mockGetDashboardMetrics.mockRejectedValue(new Error('Error interno'));

      // Act & Assert
      await expect(
        controller.getDashboardStats({} as AnalyticsQueryRequestDTO),
      ).rejects.toThrow('Error interno');
    });
  });

  describe('getCategoryPerformance', () => {
    it('debe retornar las métricas de rendimiento por categoría', async () => {
      // Arrange
      const query = {} as AnalyticsQueryRequestDTO;
      const expected = {
        categories: [{ id: 1, name: 'Plomería', totalServices: 30 }],
      } as unknown as CategoryPerformanceResponseDTO;
      mockGetCategoriesPerformanceMetrics.mockResolvedValue(expected);

      // Act
      const result = await controller.getCategoryPerformance(query);

      // Assert
      expect(result).toEqual(expected);
      expect(mockGetCategoriesPerformanceMetrics).toHaveBeenCalledWith(query);
    });

    it('debe propagar la excepción si el servicio falla', async () => {
      // Arrange
      mockGetCategoriesPerformanceMetrics.mockRejectedValue(
        new Error('Error de categorías'),
      );

      // Act & Assert
      await expect(
        controller.getCategoryPerformance({} as AnalyticsQueryRequestDTO),
      ).rejects.toThrow('Error de categorías');
    });
  });
});
