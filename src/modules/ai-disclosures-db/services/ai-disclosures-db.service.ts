import { Injectable } from '@nestjs/common';
import {
  AiContentDisclosures,
  AiDisclosureEntityType,
  AiDisclosureSource,
} from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { PrismaPaginationUtil } from '@common/utils/prisma-pagination.util';
import {
  PaginationQueryDTO,
  PaginationResponseDTO,
} from '@common/dtos/pagination.dto';

@Injectable()
export class AiDisclosuresDbService {
  constructor(private readonly prisma: PrismaDatasource) {}

  async findByEntity(
    entityType: AiDisclosureEntityType,
    entityReferenceId: string,
  ): Promise<AiContentDisclosures | null> {
    return this.prisma.extended.aiContentDisclosures.findUnique({
      where: {
        entityType_entityReferenceId: { entityType, entityReferenceId },
      },
    });
  }

  async upsertDisclosure(data: {
    entityType: AiDisclosureEntityType;
    entityReferenceId: string;
    source: AiDisclosureSource;
    aiProvider?: string;
    declaredByUserId?: number;
    note?: string;
    createdBy?: string;
  }): Promise<AiContentDisclosures> {
    const { entityType, entityReferenceId, ...rest } = data;
    return this.prisma.extended.aiContentDisclosures.upsert({
      where: {
        entityType_entityReferenceId: { entityType, entityReferenceId },
      },
      create: { entityType, entityReferenceId, ...rest },
      update: rest,
    });
  }

  async deleteByEntity(
    entityType: AiDisclosureEntityType,
    entityReferenceId: string,
  ): Promise<AiContentDisclosures> {
    return this.prisma.extended.aiContentDisclosures.delete({
      where: {
        entityType_entityReferenceId: { entityType, entityReferenceId },
      },
    });
  }

  async findPaginated(
    query: PaginationQueryDTO & Record<string, unknown>,
  ): Promise<{
    data: AiContentDisclosures[];
    pagination: PaginationResponseDTO;
  }> {
    return PrismaPaginationUtil.paginate<AiContentDisclosures>(
      this.prisma.extended.aiContentDisclosures,
      query,
      { defaultOrderByField: 'createdAt' },
    );
  }
}
