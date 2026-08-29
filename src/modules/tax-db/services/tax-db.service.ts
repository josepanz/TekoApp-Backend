import { Injectable } from '@nestjs/common';
import { PrismaDatasource } from '@core/database/services/prisma.service';

@Injectable()
export class TaxDbService {
  constructor(private readonly prisma: PrismaDatasource) {}

  /**
   * Config activa más reciente para el país — `countryId: null` es el default global (mismo
   * criterio de resolución que `TipsDbService.findActiveConfig`: sin país resuelto por
   * Service/User todavía, así que hoy siempre se pide el default global). Devuelve `null` si
   * nunca se cargó ninguna fila (el caller aplica un fallback seguro).
   */
  async findActiveConfig(countryId: number | null = null) {
    return this.prisma.extended.taxConfig.findFirst({
      where: { countryId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
