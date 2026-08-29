import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';

@Injectable()
export class TipsDbService {
  constructor(private readonly prisma: PrismaDatasource) {}

  async findByPaymentId(paymentId: number) {
    return this.prisma.extended.tips.findUnique({ where: { paymentId } });
  }

  async create(data: Prisma.TipsUncheckedCreateInput) {
    return this.prisma.extended.tips.create({ data });
  }

  /**
   * Config activa más reciente para el país — `countryId: null` es el default global (mismo
   * criterio de resolución que `LegalConsentsDbService.findActiveVersionByType`: sin país
   * resuelto por Service/User todavía, así que hoy siempre se pide el default global). Devuelve
   * `null` si nunca se cargó ninguna fila (el caller aplica un fallback seguro, mismo patrón que
   * `FeeCalculatorService` con `PlatformCommissionConfig`).
   */
  async findActiveConfig(countryId: number | null = null) {
    return this.prisma.extended.tipConfig.findFirst({
      where: { countryId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
