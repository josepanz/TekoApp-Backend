// src/api/analytics/dtos/request/analytics-query.request.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginatedRequest } from '@/common/dtos/request-with-pagination.dto';

export enum TimeRange {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  QUARTER = 'QUARTER',
  YEAR = 'YEAR',
}

export enum AnalyticsType {
  USERS = 'users',
  PROFESSIONALS = 'professionals',
  SERVICES = 'services',
  PAYMENTS = 'payments',
  RATINGS = 'ratings',
  REVENUE = 'revenue',
  PERFORMANCE = 'performance',
}

export class AnalyticsQueryRequestDTO extends PaginatedRequest<AnalyticsQueryRequestDTO> {
  @ApiPropertyOptional({
    description: 'Rango de tiempo predefinido',
    enum: TimeRange,
    example: TimeRange.MONTH,
  })
  @IsOptional()
  @IsEnum(TimeRange)
  timeRange?: TimeRange;

  @ApiPropertyOptional({
    description: 'Tipo de análisis',
    enum: AnalyticsType,
    example: AnalyticsType.USERS,
  })
  @IsOptional()
  @IsEnum(AnalyticsType)
  type?: AnalyticsType;

  @ApiPropertyOptional({
    description: 'ID de categoría para filtrar resultados',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'ID de ubicación para filtrar resultados',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional({
    description: 'ID de profesional para filtrar resultados',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  professionalId?: string;

  @ApiPropertyOptional({
    description: 'ID de usuario para filtrar resultados',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  userId?: string;
}
