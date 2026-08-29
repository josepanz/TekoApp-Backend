import { Injectable, NotFoundException } from '@nestjs/common';
import { MaterialCatalogDbService } from '@modules/material-catalog-db/services/material-catalog-db.service';
import { PaginationQueryDTO } from '@common/dtos/pagination.dto';
import { t } from '@common/i18n/i18n.helper';
import {
  CreateMaterialCatalogItemRequestDTO,
  GetMaterialCatalogListQueryDTO,
  UpdateMaterialCatalogItemRequestDTO,
} from '../dtos/request';
import {
  MaterialCatalogItemResponseDTO,
  MaterialCatalogListResponseDTO,
} from '../dtos/response';

@Injectable()
export class MaterialCatalogService {
  constructor(private readonly db: MaterialCatalogDbService) {}

  // Cast explícito (no mapeo campo a campo) porque `defaultPrice` es `Decimal` en el tipo estático
  // de Prisma pese a normalizarse a `number` en runtime (ver `PrismaDatasource#extended`) — mismo
  // patrón que `services-response.helper.ts#mapServiceToResponse`.
  async list(
    query: GetMaterialCatalogListQueryDTO,
  ): Promise<MaterialCatalogListResponseDTO> {
    return (await this.db.findPaginated(
      query as unknown as PaginationQueryDTO & Record<string, unknown>,
    )) as unknown as MaterialCatalogListResponseDTO;
  }

  async create(
    dto: CreateMaterialCatalogItemRequestDTO,
    createdBy: string,
  ): Promise<MaterialCatalogItemResponseDTO> {
    return this.db.create({
      ...dto,
      createdBy,
    }) as unknown as Promise<MaterialCatalogItemResponseDTO>;
  }

  async update(
    referenceId: string,
    dto: UpdateMaterialCatalogItemRequestDTO,
    lastChangedBy: string,
  ): Promise<MaterialCatalogItemResponseDTO> {
    const existing = await this.db.findByReferenceId(referenceId);
    if (!existing) {
      throw new NotFoundException(t('material-catalog.NOT_FOUND'));
    }
    return this.db.update(existing.id, {
      ...dto,
      lastChangedBy,
    }) as unknown as Promise<MaterialCatalogItemResponseDTO>;
  }
}
