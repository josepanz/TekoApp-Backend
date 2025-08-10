import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  getDashboardStats(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getDashboardStats(query);
  }

  @Get('users')
  getUserStats(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getUserStats(
      query.startDate ? new Date(query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      query.endDate ? new Date(query.endDate) : new Date()
    );
  }

  @Get('professionals')
  getProfessionalStats(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getProfessionalStats(
      query.startDate ? new Date(query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      query.endDate ? new Date(query.endDate) : new Date()
    );
  }

  @Get('services')
  getServiceStats(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getServiceStats(
      query.startDate ? new Date(query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      query.endDate ? new Date(query.endDate) : new Date()
    );
  }

  @Get('revenue')
  getRevenueStats(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getRevenueStats(
      query.startDate ? new Date(query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      query.endDate ? new Date(query.endDate) : new Date()
    );
  }

  @Get('ratings')
  getRatingStats(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getRatingStats(
      query.startDate ? new Date(query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      query.endDate ? new Date(query.endDate) : new Date()
    );
  }

  @Get('categories/performance')
  getCategoryPerformance(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getCategoryPerformance(
      query.startDate ? new Date(query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      query.endDate ? new Date(query.endDate) : new Date()
    );
  }

  @Get('locations')
  getLocationStats(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getLocationStats(
      query.startDate ? new Date(query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      query.endDate ? new Date(query.endDate) : new Date()
    );
  }

  @Get('timeseries/:metric')
  getTimeSeriesData(@Query() query: AnalyticsQueryDto, @Param('metric') metric: string) {
    return this.analyticsService.getTimeSeriesData(query, metric);
  }

  @Get('professional/:id')
  getProfessionalAnalytics(@Param('id') professionalId: string, @Query() query: AnalyticsQueryDto) {
    // Implementar analytics específicos para un profesional
    return {
      professionalId,
      message: 'Analytics específicos del profesional en desarrollo',
      query,
    };
  }

  @Get('user/:id')
  getUserAnalytics(@Param('id') userId: string, @Query() query: AnalyticsQueryDto) {
    // Implementar analytics específicos para un usuario
    return {
      userId,
      message: 'Analytics específicos del usuario en desarrollo',
      query,
    };
  }
}
