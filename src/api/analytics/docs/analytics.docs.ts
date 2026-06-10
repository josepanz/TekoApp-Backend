// src/api/analytics/docs/analytics.docs.ts
import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardStatsResponseDTO } from '../dtos/response/dashboard-stats.response.dto';
import { CategoryPerformanceResponseDTO } from '../dtos/response/category-performance.response.dto';

export function ApplyAnalyticsControllerDocs() {
  return applyDecorators(ApiTags('Analytics & KPIs del Negocio'));
}

export function ApplyDashboardStatsDocs() {
  return applyDecorators(
    ApiOperation({
      summary:
        'Obtener métricas globales consolidadas del panel de control (Dashboard)',
    }),
    ApiOkResponse({ type: DashboardStatsResponseDTO }),
  );
}

export function ApplyCategoryPerformanceDocs() {
  return applyDecorators(
    ApiOperation({
      summary:
        'Listar rendimiento financiero y operativo ordenado por categorías',
    }),
    ApiOkResponse({ type: CategoryPerformanceResponseDTO }),
  );
}
