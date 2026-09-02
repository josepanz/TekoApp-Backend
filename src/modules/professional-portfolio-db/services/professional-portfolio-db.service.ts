import { Injectable } from '@nestjs/common';
import {
  PortfolioReviewStatus,
  Prisma,
  ProfessionalPortfolioItems,
} from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { PrismaPaginationUtil } from '@common/utils/prisma-pagination.util';
import {
  PaginationQueryDTO,
  PaginationResponseDTO,
} from '@common/dtos/pagination.dto';

const adminQueueInclude = {
  professional: { include: { user: true } },
} as const;

export type PortfolioItemForAdminQueue = ProfessionalPortfolioItems & {
  professional: {
    referenceId: string;
    user: { firstName: string; lastName: string };
  };
};

@Injectable()
export class ProfessionalPortfolioDbService {
  constructor(private readonly prisma: PrismaDatasource) {}

  async create(
    data: Prisma.ProfessionalPortfolioItemsUncheckedCreateInput,
  ): Promise<ProfessionalPortfolioItems> {
    return this.prisma.extended.professionalPortfolioItems.create({ data });
  }

  /** Todas las fotos del profesional (todos los estados, visibles u ocultas) — "Mi portafolio". */
  async findAllByProfessionalId(
    professionalId: number,
  ): Promise<ProfessionalPortfolioItems[]> {
    return this.prisma.extended.professionalPortfolioItems.findMany({
      where: { professionalId, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  /** Solo lo aprobado y visible — endpoint público del perfil del profesional. */
  async findPublicByProfessionalId(
    professionalId: number,
  ): Promise<ProfessionalPortfolioItems[]> {
    return this.prisma.extended.professionalPortfolioItems.findMany({
      where: {
        professionalId,
        isActive: true,
        status: PortfolioReviewStatus.APPROVED,
        isVisible: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findByReferenceId(
    referenceId: string,
  ): Promise<ProfessionalPortfolioItems | null> {
    return this.prisma.extended.professionalPortfolioItems.findUnique({
      where: { referenceId },
    });
  }

  async update(
    id: number,
    data: Prisma.ProfessionalPortfolioItemsUncheckedUpdateInput,
  ): Promise<ProfessionalPortfolioItems> {
    return this.prisma.extended.professionalPortfolioItems.update({
      where: { id },
      data,
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.extended.professionalPortfolioItems.delete({
      where: { id },
    });
  }

  /** TOCTOU-safe: solo actualiza si sigue en alguno de los estados esperados. */
  async updateStatusConditional(
    id: number,
    expectedStatuses: PortfolioReviewStatus[],
    data: Prisma.ProfessionalPortfolioItemsUncheckedUpdateInput,
  ): Promise<number> {
    const result =
      await this.prisma.extended.professionalPortfolioItems.updateMany({
        where: { id, status: { in: expectedStatuses } },
        data,
      });
    return result.count;
  }

  /** Cola de revisión de staff — todos los profesionales, paginado, filtrable por `status`. */
  async findPaginatedForAdmin(
    filters: { status?: PortfolioReviewStatus },
    query: PaginationQueryDTO & Record<string, unknown>,
  ): Promise<{
    data: PortfolioItemForAdminQueue[];
    pagination: PaginationResponseDTO;
  }> {
    const where: Prisma.ProfessionalPortfolioItemsWhereInput = {
      isActive: true,
    };
    if (filters.status) where.status = filters.status;

    return PrismaPaginationUtil.paginate<PortfolioItemForAdminQueue>(
      this.prisma.extended.professionalPortfolioItems,
      query,
      {
        where,
        include: adminQueueInclude,
        defaultOrderByField: 'createdAt',
        fieldMapping: { status: '' },
      },
    );
  }
}
