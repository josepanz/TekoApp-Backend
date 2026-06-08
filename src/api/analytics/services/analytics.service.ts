// src/api/analytics/services/analytics.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { AnalyticsDbService } from '@modules/analytics-db/services/analytics-db.service';
import {
  AnalyticsQueryRequestDTO,
  TimeRange,
} from '../dtos/request/analytics-query.request.dto';
import { DashboardStatsResponseDTO } from '../dtos/response/dashboard-stats.response.dto';
import { CategoryPerformanceResponseDTO } from '../dtos/response/category-performance.response.dto';

@Injectable()
export class AnalyticsApiService {
  private readonly logger = new Logger(AnalyticsApiService.name);

  constructor(private readonly analyticsDbService: AnalyticsDbService) {}

  async getDashboardMetrics(
    query: AnalyticsQueryRequestDTO,
  ): Promise<DashboardStatsResponseDTO> {
    const { startDate, endDate } = this.calculateDateRange(query);

    const [userStats, profStats, servStats, revStats, ratingStats] =
      await Promise.all([
        this.analyticsDbService.getUsersMetrics(startDate, endDate),
        this.analyticsDbService.getProfessionalsMetrics(startDate, endDate),
        this.analyticsDbService.getServicesMetrics(startDate, endDate),
        this.analyticsDbService.getRevenueMetrics(startDate, endDate),
        this.analyticsDbService.getRatingsMetrics(startDate, endDate),
      ]);

    const response = new DashboardStatsResponseDTO();
    response.success = true;
    response.users = userStats;
    response.professionals = profStats;
    response.services = servStats;
    response.revenue = revStats;
    response.ratings = ratingStats;
    response.period = { startDate, endDate };

    return response;
  }

  async getCategoriesPerformanceMetrics(
    query: AnalyticsQueryRequestDTO,
  ): Promise<CategoryPerformanceResponseDTO> {
    const { startDate, endDate } = this.calculateDateRange(query);
    const performanceData =
      await this.analyticsDbService.getCategoryPerformance(startDate, endDate);

    const response = new CategoryPerformanceResponseDTO();
    response.success = true;
    response.data = performanceData.map((item) => ({
      category: item.name,
      serviceCount: item.totalServices,
      revenue: 0,
      averageRating: 0,
    }));
    return response;
  }

  private calculateDateRange(query: AnalyticsQueryRequestDTO): {
    startDate: Date;
    endDate: Date;
  } {
    const endDate = query.endDate ?? new Date();
    if (query.startDate) {
      return { startDate: query.startDate, endDate };
    }

    const now = new Date();
    let startRangeMs = 30 * 24 * 60 * 60 * 1000; // 30 días default

    switch (query.timeRange) {
      case TimeRange.DAY:
        startRangeMs = 24 * 60 * 60 * 1000;
        break;
      case TimeRange.WEEK:
        startRangeMs = 7 * 24 * 60 * 60 * 1000;
        break;
      case TimeRange.MONTH:
        startRangeMs = 30 * 24 * 60 * 60 * 1000;
        break;
      case TimeRange.QUARTER:
        startRangeMs = 90 * 24 * 60 * 60 * 1000;
        break;
      case TimeRange.YEAR:
        startRangeMs = 365 * 24 * 60 * 60 * 1000;
        break;
    }

    return { startDate: new Date(now.getTime() - startRangeMs), endDate };
  }
}
