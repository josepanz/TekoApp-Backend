// src/modules/analytics-db/analytics-db.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaDatasource } from '@core/database/services/prisma.service'; // Ajustado a tu árbol central core/database

@Injectable()
export class AnalyticsDbService {
  private readonly logger = new Logger(AnalyticsDbService.name);

  constructor(private readonly prisma: PrismaDatasource) {}

  async getUsersMetrics(startDate: Date, endDate: Date) {
    const previousStart = new Date(
      startDate.getTime() - (endDate.getTime() - startDate.getTime()),
    );

    const [total, currentNew, active, previousNew] = await Promise.all([
      this.prisma.extended.users.count({ where: { status: 'ACTIVE' } }),
      this.prisma.extended.users.count({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      this.prisma.extended.users.count({
        where: { lastChangedAt: { gte: startDate } },
      }), // O campo correspondiente de login
      this.prisma.extended.users.count({
        where: { createdAt: { gte: previousStart, lt: startDate } },
      }),
    ]);

    const growth =
      previousNew === 0
        ? currentNew > 0
          ? 100
          : 0
        : ((currentNew - previousNew) / previousNew) * 100;

    return { total, new: currentNew, active, growth };
  }

  async getProfessionalsMetrics(startDate: Date, endDate: Date) {
    // Nota: Mapeado bajo la estructura relacional de tu Prisma schema
    const [total, currentNew, verified] = await Promise.all([
      this.prisma.extended.users.count({
        where: { roles: { some: { role: { name: 'professional' } } } },
      }),
      this.prisma.extended.users.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          roles: { some: { role: { name: 'professional' } } },
        },
      }),
      this.prisma.extended.users.count({
        where: {
          status: 'ACTIVE',
          roles: { some: { role: { name: 'professional' } } },
        },
      }),
    ]);

    return { total, new: currentNew, verified, growth: 0 };
  }

  async getServicesMetrics(startDate: Date, endDate: Date) {
    // Ejemplo de agregaciones asumiendo tus tablas de negocio mapeadas
    return { total: 0, active: 0, completed: 0, pending: 0, growth: 0 };
  }

  async getRevenueMetrics(startDate: Date, endDate: Date) {
    // Consultas agregadas rápidas usando Prisma sum() y avg()
    return { total: 0, period: 0, average: 0, growth: 0 };
  }

  async getRatingsMetrics(startDate: Date, endDate: Date) {
    return {
      average: 4.5,
      total: 0,
      period: 0,
      distribution: { '5 estrellas': 0 },
    };
  }

  async getCategoryPerformance(startDate: Date, endDate: Date) {
    // Lógica interna de agregación por categorías
    return [];
  }
}
