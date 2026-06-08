import { Injectable } from '@nestjs/common';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import {
  Prisma,
  ServiceStatus,
  PaymentStatus,
  UserStatus,
} from '@prisma/client';

@Injectable()
export class AnalyticsDbService {
  constructor(private readonly prisma: PrismaDatasource) {}

  async getUsersMetrics(startDate: Date, endDate: Date) {
    const previousStart = new Date(
      startDate.getTime() - (endDate.getTime() - startDate.getTime()),
    );

    const [total, currentNew, active, previousNew] = await Promise.all([
      this.prisma.extended.users.count(),
      this.prisma.extended.users.count({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      this.prisma.extended.users.count({
        where: { status: UserStatus.ACTIVE },
      }),
      this.prisma.extended.users.count({
        where: { createdAt: { gte: previousStart, lt: startDate } },
      }),
    ]);

    const growth =
      previousNew === 0
        ? currentNew > 0
          ? 100
          : 0
        : Math.round(((currentNew - previousNew) / previousNew) * 100 * 100) /
          100;

    return { total, new: currentNew, active, growth };
  }

  async getProfessionalsMetrics(startDate: Date, endDate: Date) {
    const [total, currentNew, available, verified] = await Promise.all([
      this.prisma.extended.professionals.count({ where: { isActive: true } }),
      this.prisma.extended.professionals.count({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      this.prisma.extended.professionals.count({
        where: { isAvailable: true, isActive: true },
      }),
      this.prisma.extended.professionals.count({
        where: { verificationStatus: 'verified', isActive: true },
      }),
    ]);

    return { total, new: currentNew, available, verified, growth: 0 };
  }

  async getServicesMetrics(startDate: Date, endDate: Date) {
    const range: Prisma.ServicesWhereInput = {
      createdAt: { gte: startDate, lte: endDate },
    };

    const [total, completed, pending, cancelled] = await Promise.all([
      this.prisma.extended.services.count({ where: range }),
      this.prisma.extended.services.count({
        where: { ...range, status: ServiceStatus.COMPLETED },
      }),
      this.prisma.extended.services.count({
        where: { ...range, status: ServiceStatus.PENDING },
      }),
      this.prisma.extended.services.count({
        where: { ...range, status: ServiceStatus.CANCELLED },
      }),
    ]);

    const active = total - completed - cancelled;

    return { total, active, completed, pending, cancelled, growth: 0 };
  }

  async getRevenueMetrics(startDate: Date, endDate: Date) {
    const range: Prisma.PaymentsWhereInput = {
      createdAt: { gte: startDate, lte: endDate },
      status: PaymentStatus.COMPLETED,
    };

    const aggregate = await this.prisma.extended.payments.aggregate({
      where: range,
      _sum: { totalAmount: true, platformFee: true },
      _count: { id: true },
      _avg: { totalAmount: true },
    });

    return {
      total: Number(aggregate._sum.totalAmount ?? 0),
      period: Number(aggregate._sum.totalAmount ?? 0),
      platformRevenue: Number(aggregate._sum.platformFee ?? 0),
      transactions: aggregate._count.id,
      average: Number(aggregate._avg.totalAmount ?? 0),
      growth: 0,
    };
  }

  async getRatingsMetrics(startDate: Date, endDate: Date) {
    const range: Prisma.RatingWhereInput = {
      createdAt: { gte: startDate, lte: endDate },
    };

    const aggregate = await this.prisma.extended.rating.aggregate({
      where: range,
      _avg: { rating: true },
      _count: { id: true },
    });

    return {
      average: Math.round(Number(aggregate._avg.rating ?? 0) * 100) / 100,
      total: aggregate._count.id,
      period: aggregate._count.id,
      distribution: {} as Record<string, number>,
      growth: 0,
    };
  }

  async getCategoryPerformance(startDate: Date, endDate: Date) {
    const categories = await this.prisma.extended.category.findMany({
      where: { status: 'ACTIVE' },
      include: {
        services: {
          where: { createdAt: { gte: startDate, lte: endDate } },
          select: { id: true, status: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      totalServices: cat.services.length,
      completedServices: cat.services.filter(
        (s) => s.status === ServiceStatus.COMPLETED,
      ).length,
    }));
  }
}
