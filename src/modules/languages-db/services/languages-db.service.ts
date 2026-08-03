import { Injectable } from '@nestjs/common';
import { Language } from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';

@Injectable()
export class LanguagesDbService {
  constructor(private readonly prisma: PrismaDatasource) {}

  // Catálogo chico (idiomas soportados) => listado plano sin paginación.
  async findAllActive(): Promise<Language[]> {
    return this.prisma.extended.language.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });
  }

  async findById(id: number): Promise<Language | null> {
    return this.prisma.extended.language.findUnique({ where: { id } });
  }
}
