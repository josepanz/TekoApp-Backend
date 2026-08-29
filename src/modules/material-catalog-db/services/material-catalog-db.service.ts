import { Injectable } from '@nestjs/common';
import { MaterialCatalog, Prisma } from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { PrismaPaginationUtil } from '@common/utils/prisma-pagination.util';
import {
  PaginationQueryDTO,
  PaginationResponseDTO,
} from '@common/dtos/pagination.dto';

@Injectable()
export class MaterialCatalogDbService {
  constructor(private readonly prisma: PrismaDatasource) {}

  /**
   * `categoryId`/`countryId`/`qualityTier`/`isActive` son columnas directas de la tabla — se
   * dejan que `PrismaPaginationUtil` las mapee automáticamente al `where`, sin necesidad de
   * armarlo a mano (a diferencia de `legal-consents`, que filtra por relaciones anidadas).
   */
  async findPaginated(
    query: PaginationQueryDTO & Record<string, unknown>,
  ): Promise<{ data: MaterialCatalog[]; pagination: PaginationResponseDTO }> {
    return PrismaPaginationUtil.paginate<MaterialCatalog>(
      this.prisma.extended.materialCatalog,
      query,
      { defaultOrderByField: 'name' },
    );
  }

  async findById(id: number): Promise<MaterialCatalog | null> {
    return this.prisma.extended.materialCatalog.findUnique({ where: { id } });
  }

  async findByReferenceId(
    referenceId: string,
  ): Promise<MaterialCatalog | null> {
    return this.prisma.extended.materialCatalog.findUnique({
      where: { referenceId },
    });
  }

  async findManyByReferenceIds(
    referenceIds: string[],
  ): Promise<MaterialCatalog[]> {
    return this.prisma.extended.materialCatalog.findMany({
      where: { referenceId: { in: referenceIds } },
    });
  }

  async create(
    data: Prisma.MaterialCatalogUncheckedCreateInput,
  ): Promise<MaterialCatalog> {
    return this.prisma.extended.materialCatalog.create({ data });
  }

  async update(
    id: number,
    data: Prisma.MaterialCatalogUncheckedUpdateInput,
  ): Promise<MaterialCatalog> {
    return this.prisma.extended.materialCatalog.update({
      where: { id },
      data,
    });
  }
}
