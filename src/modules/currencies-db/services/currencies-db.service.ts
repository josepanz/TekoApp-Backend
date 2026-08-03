import { Injectable } from '@nestjs/common';
import { Currency } from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';

@Injectable()
export class CurrenciesDbService {
  constructor(private readonly prisma: PrismaDatasource) {}

  // Catálogo chico (monedas ISO 4217 en uso) => listado plano sin paginación.
  async findAllActive(): Promise<Currency[]> {
    return this.prisma.extended.currency.findMany({
      where: { isActive: true },
      orderBy: { alphaCode: 'asc' },
    });
  }

  async findByAlphaCode(alphaCode: string): Promise<Currency | null> {
    return this.prisma.extended.currency.findUnique({ where: { alphaCode } });
  }
}
