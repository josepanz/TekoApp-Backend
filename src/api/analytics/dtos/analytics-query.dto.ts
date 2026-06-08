import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsEnum, IsString } from 'class-validator';

export enum TimeRange {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
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

export class AnalyticsQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(TimeRange)
  timeRange?: TimeRange;

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
