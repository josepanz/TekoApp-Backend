// src/api/analytics/controllers/analytics.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsApiService } from '../services/analytics.service';
import { AnalyticsQueryRequestDTO } from '../dtos/request/analytics-query.request.dto';
import { DashboardStatsResponseDTO } from '../dtos/response/dashboard-stats.response.dto';
import { CategoryPerformanceResponseDTO } from '../dtos/response/category-performance.response.dto';
import {
  ApplyAnalyticsControllerDocs,
  ApplyDashboardStatsDocs,
  ApplyCategoryPerformanceDocs,
} from '../docs/analytics.docs';

@Controller('analytics')
@ApplyAnalyticsControllerDocs()
export class AnalyticsController {
  constructor(private readonly analyticsApiService: AnalyticsApiService) {}

  @Get('dashboard')
  @ApplyDashboardStatsDocs()
  async getDashboardStats(
    @Query() query: AnalyticsQueryRequestDTO,
  ): Promise<DashboardStatsResponseDTO> {
    return this.analyticsApiService.getDashboardMetrics(query);
  }

  @Get('categories')
  @ApplyCategoryPerformanceDocs()
  async getCategoryPerformance(
    @Query() query: AnalyticsQueryRequestDTO,
  ): Promise<CategoryPerformanceResponseDTO> {
    return this.analyticsApiService.getCategoriesPerformanceMetrics(query);
  }
}
