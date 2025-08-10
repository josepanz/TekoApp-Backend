import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Professional } from '../professionals/entities/professional.entity';
import { ServiceRequest } from '../services/entities/service-request.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Rating } from '../ratings/entities/rating.entity';
import { Category } from '../categories/entities/category.entity';
import { AnalyticsQueryDto, TimeRange, AnalyticsType } from './dto/analytics-query.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Professional)
    private readonly professionalRepository: Repository<Professional>,
    @InjectRepository(ServiceRequest)
    private readonly serviceRequestRepository: Repository<ServiceRequest>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Rating)
    private readonly ratingRepository: Repository<Rating>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async getDashboardStats(query: AnalyticsQueryDto) {
    const { startDate, endDate } = this.parseDateRange(query);
    
    const [
      totalUsers,
      totalProfessionals,
      totalServices,
      totalRevenue,
      averageRating,
      activeServices,
      completedServices,
      pendingServices,
    ] = await Promise.all([
      this.getUserStats(startDate, endDate),
      this.getProfessionalStats(startDate, endDate),
      this.getServiceStats(startDate, endDate),
      this.getRevenueStats(startDate, endDate),
      this.getRatingStats(startDate, endDate),
      this.getActiveServicesCount(startDate, endDate),
      this.getCompletedServicesCount(startDate, endDate),
      this.getPendingServicesCount(startDate, endDate),
    ]);

    return {
      users: totalUsers,
      professionals: totalProfessionals,
      services: {
        total: totalServices,
        active: activeServices,
        completed: completedServices,
        pending: pendingServices,
      },
      revenue: totalRevenue,
      ratings: averageRating,
      period: { startDate, endDate },
    };
  }

  async getUserStats(startDate: Date, endDate: Date) {
    const [totalUsers, newUsers, activeUsers] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({
        where: {
          createdAt: Between(startDate, endDate),
        },
      }),
      this.userRepository.count({
        where: {
          lastLoginAt: MoreThanOrEqual(startDate),
        },
      }),
    ]);

    const userGrowth = await this.calculateGrowthRate(
      this.userRepository,
      'createdAt',
      startDate,
      endDate,
    );

    return {
      total: totalUsers,
      new: newUsers,
      active: activeUsers,
      growth: userGrowth,
    };
  }

  async getProfessionalStats(startDate: Date, endDate: Date) {
    const [totalProfessionals, newProfessionals, verifiedProfessionals] = await Promise.all([
      this.professionalRepository.count(),
      this.professionalRepository.count({
        where: {
          createdAt: Between(startDate, endDate),
        },
      }),
      this.professionalRepository.count({
        where: {
          isVerified: true,
        },
      }),
    ]);

    const professionalGrowth = await this.calculateGrowthRate(
      this.professionalRepository,
      'createdAt',
      startDate,
      endDate,
    );

    return {
      total: totalProfessionals,
      new: newProfessionals,
      verified: verifiedProfessionals,
      growth: professionalGrowth,
    };
  }

  async getServiceStats(startDate: Date, endDate: Date) {
    const [totalServices, completedServices, cancelledServices] = await Promise.all([
      this.serviceRequestRepository.count(),
      this.serviceRequestRepository.count({
        where: {
          status: 'completed',
          updatedAt: Between(startDate, endDate),
        },
      }),
      this.serviceRequestRepository.count({
        where: {
          status: 'cancelled',
          updatedAt: Between(startDate, endDate),
        },
      }),
    ]);

    const serviceGrowth = await this.calculateGrowthRate(
      this.serviceRequestRepository,
      'createdAt',
      startDate,
      endDate,
    );

    return {
      total: totalServices,
      completed: completedServices,
      cancelled: cancelledServices,
      growth: serviceGrowth,
    };
  }

  async getRevenueStats(startDate: Date, endDate: Date) {
    const [totalRevenue, periodRevenue, averageOrderValue] = await Promise.all([
      this.paymentRepository
        .createQueryBuilder('payment')
        .select('SUM(payment.amount)', 'total')
        .where('payment.status = :status', { status: 'completed' })
        .getRawOne()
        .then(result => parseFloat(result.total) || 0),
      
      this.paymentRepository
        .createQueryBuilder('payment')
        .select('SUM(payment.amount)', 'total')
        .where('payment.status = :status', { status: 'completed' })
        .andWhere('payment.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
        .getRawOne()
        .then(result => parseFloat(result.total) || 0),
      
      this.paymentRepository
        .createQueryBuilder('payment')
        .select('AVG(payment.amount)', 'average')
        .where('payment.status = :status', { status: 'completed' })
        .andWhere('payment.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
        .getRawOne()
        .then(result => parseFloat(result.average) || 0),
    ]);

    const revenueGrowth = await this.calculateRevenueGrowth(startDate, endDate);

    return {
      total: totalRevenue,
      period: periodRevenue,
      average: averageOrderValue,
      growth: revenueGrowth,
    };
  }

  async getRatingStats(startDate: Date, endDate: Date) {
    const [averageRating, totalRatings, periodRatings] = await Promise.all([
      this.ratingRepository
        .createQueryBuilder('rating')
        .select('AVG(rating.score)', 'average')
        .getRawOne()
        .then(result => parseFloat(result.average) || 0),
      
      this.ratingRepository.count(),
      
      this.ratingRepository.count({
        where: {
          createdAt: Between(startDate, endDate),
        },
      }),
    ]);

    const ratingDistribution = await this.getRatingDistribution();

    return {
      average: averageRating,
      total: totalRatings,
      period: periodRatings,
      distribution: ratingDistribution,
    };
  }

  async getCategoryPerformance(startDate: Date, endDate: Date) {
    const categories = await this.categoryRepository.find();
    const performance = [];

    for (const category of categories) {
      const [serviceCount, revenue, averageRating] = await Promise.all([
        this.serviceRequestRepository.count({
          where: {
            categoryId: category.id,
            createdAt: Between(startDate, endDate),
          },
        }),
        this.paymentRepository
          .createQueryBuilder('payment')
          .innerJoin('payment.serviceRequest', 'service')
          .select('SUM(payment.amount)', 'total')
          .where('service.categoryId = :categoryId', { categoryId: category.id })
          .andWhere('payment.status = :status', { status: 'completed' })
          .andWhere('payment.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
          .getRawOne()
          .then(result => parseFloat(result.total) || 0),
        this.ratingRepository
          .createQueryBuilder('rating')
          .innerJoin('rating.serviceRequest', 'service')
          .select('AVG(rating.score)', 'average')
          .where('service.categoryId = :categoryId', { categoryId: category.id })
          .andWhere('rating.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
          .getRawOne()
          .then(result => parseFloat(result.average) || 0),
      ]);

      performance.push({
        category: category.name,
        serviceCount,
        revenue,
        averageRating,
      });
    }

    return performance.sort((a, b) => b.revenue - a.revenue);
  }

  async getLocationStats(startDate: Date, endDate: Date) {
    // Implementar estadísticas por ubicación
    // Esto requeriría integración con el módulo de locations
    return {
      message: 'Estadísticas por ubicación en desarrollo',
    };
  }

  async getTimeSeriesData(query: AnalyticsQueryDto, metric: string) {
    const { startDate, endDate, timeRange } = query;
    const start = startDate ? new Date(startDate) : this.getDefaultStartDate(timeRange);
    const end = endDate ? new Date(endDate) : new Date();

    const data = await this.generateTimeSeriesData(metric, start, end, timeRange);
    
    return {
      metric,
      data,
      period: { start, end },
      timeRange,
    };
  }

  private async getActiveServicesCount(startDate: Date, endDate: Date): Promise<number> {
    return this.serviceRequestRepository.count({
      where: {
        status: 'in_progress',
        updatedAt: Between(startDate, endDate),
      },
    });
  }

  private async getCompletedServicesCount(startDate: Date, endDate: Date): Promise<number> {
    return this.serviceRequestRepository.count({
      where: {
        status: 'completed',
        updatedAt: Between(startDate, endDate),
      },
    });
  }

  private async getPendingServicesCount(startDate: Date, endDate: Date): Promise<number> {
    return this.serviceRequestRepository.count({
      where: {
        status: 'pending',
        createdAt: Between(startDate, endDate),
      },
    });
  }

  private async calculateGrowthRate(
    repository: Repository<any>,
    dateField: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const previousStart = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()));
    
    const [currentPeriod, previousPeriod] = await Promise.all([
      repository.count({
        where: {
          [dateField]: Between(startDate, endDate),
        },
      }),
      repository.count({
        where: {
          [dateField]: Between(previousStart, startDate),
        },
      }),
    ]);

    if (previousPeriod === 0) return currentPeriod > 0 ? 100 : 0;
    
    return ((currentPeriod - previousPeriod) / previousPeriod) * 100;
  }

  private async calculateRevenueGrowth(startDate: Date, endDate: Date): Promise<number> {
    const previousStart = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()));
    
    const [currentRevenue, previousRevenue] = await Promise.all([
      this.paymentRepository
        .createQueryBuilder('payment')
        .select('SUM(payment.amount)', 'total')
        .where('payment.status = :status', { status: 'completed' })
        .andWhere('payment.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
        .getRawOne()
        .then(result => parseFloat(result.total) || 0),
      
      this.paymentRepository
        .createQueryBuilder('payment')
        .select('SUM(payment.amount)', 'total')
        .where('payment.status = :status', { status: 'completed' })
        .andWhere('payment.createdAt BETWEEN :startDate AND :endDate', { startDate: previousStart, endDate: startDate })
        .getRawOne()
        .then(result => parseFloat(result.total) || 0),
    ]);

    if (previousRevenue === 0) return currentRevenue > 0 ? 100 : 0;
    
    return ((currentRevenue - previousRevenue) / previousRevenue) * 100;
  }

  private async getRatingDistribution(): Promise<Record<string, number>> {
    const distribution = await this.ratingRepository
      .createQueryBuilder('rating')
      .select('rating.score', 'score')
      .addSelect('COUNT(*)', 'count')
      .groupBy('rating.score')
      .orderBy('rating.score', 'DESC')
      .getRawMany();

    const result: Record<string, number> = {};
    distribution.forEach(item => {
      result[`${item.score} estrellas`] = parseInt(item.count);
    });

    return result;
  }

  private parseDateRange(query: AnalyticsQueryDto): { startDate: Date; endDate: Date } {
    let startDate: Date;
    let endDate: Date = new Date();

    if (query.startDate && query.endDate) {
      startDate = new Date(query.startDate);
      endDate = new Date(query.endDate);
    } else {
      startDate = this.getDefaultStartDate(query.timeRange);
    }

    return { startDate, endDate };
  }

  private getDefaultStartDate(timeRange?: TimeRange): Date {
    const now = new Date();
    
    switch (timeRange) {
      case TimeRange.DAY:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case TimeRange.WEEK:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case TimeRange.MONTH:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case TimeRange.QUARTER:
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case TimeRange.YEAR:
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Default: 30 days
    }
  }

  private async generateTimeSeriesData(
    metric: string,
    startDate: Date,
    endDate: Date,
    timeRange: TimeRange,
  ): Promise<any[]> {
    // Implementar generación de datos de series temporales según la métrica
    // Esto es un placeholder - se implementaría según las necesidades específicas
    return [];
  }
}
