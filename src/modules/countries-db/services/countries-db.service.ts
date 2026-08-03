import { Injectable } from '@nestjs/common';
import { Country, Prisma } from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { PrismaPaginationUtil } from '@common/utils/prisma-pagination.util';
import {
  PaginationQueryDTO,
  PaginationResponseDTO,
} from '@common/dtos/pagination.dto';

@Injectable()
export class CountriesDbService {
  constructor(private readonly prisma: PrismaDatasource) {}

  /**
   * Listado paginado. `countries` es un catálogo potencialmente grande (todos los países del
   * mundo si el negocio se expande), por eso se usa la paginación estándar del proyecto
   * (`PrismaPaginationUtil`) en vez de un array plano como en catálogos chicos.
   */
  async findPaginated(
    query: PaginationQueryDTO & Record<string, unknown>,
  ): Promise<{ data: Country[]; pagination: PaginationResponseDTO }> {
    const where: Prisma.CountryWhereInput = { isActive: true };

    return PrismaPaginationUtil.paginate<Country>(
      this.prisma.extended.country,
      query,
      {
        where: where,
        defaultOrderByField: 'commonName',
        searchFields: ['commonName', 'officialName', 'iso2', 'iso3'],
      },
    );
  }

  async findById(id: number): Promise<Country | null> {
    return this.prisma.extended.country.findUnique({ where: { id } });
  }
}
