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

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  locationId?: string;

  @IsOptional()
  @IsString()
  professionalId?: string;

  @IsOptional()
  @IsString()
  userId?: string;
}
