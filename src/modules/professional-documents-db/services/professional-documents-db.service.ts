import { Injectable } from '@nestjs/common';
import {
  DocumentCategory,
  DocumentReviewStatus,
  Prisma,
  ProfessionalDocuments,
} from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { PrismaPaginationUtil } from '@common/utils/prisma-pagination.util';
import {
  PaginationQueryDTO,
  PaginationResponseDTO,
} from '@common/dtos/pagination.dto';

const documentTypeInclude = { professionalDocumentType: true } as const;

const adminQueueInclude = {
  professionalDocumentType: true,
  professional: { include: { user: true } },
} as const;

export type ProfessionalDocumentWithType = ProfessionalDocuments & {
  professionalDocumentType: NonNullable<
    Awaited<
      ReturnType<
        PrismaDatasource['extended']['professionalDocumentTypes']['findUnique']
      >
    >
  >;
};

export type ProfessionalDocumentForAdminQueue = ProfessionalDocumentWithType & {
  professional: {
    referenceId: string;
    user: { firstName: string; lastName: string };
  };
};

@Injectable()
export class ProfessionalDocumentsDbService {
  constructor(private readonly prisma: PrismaDatasource) {}

  async create(
    data: Prisma.ProfessionalDocumentsUncheckedCreateInput,
  ): Promise<ProfessionalDocumentWithType> {
    return this.prisma.extended.professionalDocuments.create({
      data,
      include: documentTypeInclude,
    });
  }

  /** Todo lo cargado por el profesional (todos los estados) — usado para "Mis documentos". */
  async findAllByProfessionalId(
    professionalId: number,
  ): Promise<ProfessionalDocumentWithType[]> {
    return this.prisma.extended.professionalDocuments.findMany({
      where: { professionalId, isActive: true },
      include: documentTypeInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Solo lo aprobado y marcado visible al cliente — endpoint público. */
  async findPublicByProfessionalId(
    professionalId: number,
  ): Promise<ProfessionalDocumentWithType[]> {
    return this.prisma.extended.professionalDocuments.findMany({
      where: {
        professionalId,
        isActive: true,
        status: DocumentReviewStatus.APPROVED,
        professionalDocumentType: { isVisibleToClient: true },
      },
      include: documentTypeInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByReferenceId(
    referenceId: string,
  ): Promise<ProfessionalDocumentWithType | null> {
    return this.prisma.extended.professionalDocuments.findUnique({
      where: { referenceId },
      include: documentTypeInclude,
    });
  }

  /** ¿Existe al menos un documento activo, aprobado y sin vencer para este tipo y profesional? */
  async hasActiveApproved(
    professionalId: number,
    professionalDocumentTypeId: number,
  ): Promise<boolean> {
    const count = await this.prisma.extended.professionalDocuments.count({
      where: {
        professionalId,
        professionalDocumentTypeId,
        isActive: true,
        status: DocumentReviewStatus.APPROVED,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });
    return count > 0;
  }

  /** TOCTOU-safe: solo actualiza si sigue en alguno de los estados esperados. */
  async updateStatusConditional(
    id: number,
    expectedStatuses: DocumentReviewStatus[],
    data: Prisma.ProfessionalDocumentsUncheckedUpdateInput,
  ): Promise<number> {
    const result = await this.prisma.extended.professionalDocuments.updateMany({
      where: { id, status: { in: expectedStatuses } },
      data,
    });
    return result.count;
  }

  /**
   * Cola de revisión de staff — TODOS los profesionales, paginado, filtrable por `status`/
   * `category`. No estaba en la spec original de endpoints (que solo tenía el listado por
   * profesional puntual) — agregado porque Web (Fase 0001) lo necesita para una cola real, ver
   * openspec/decisions.md.
   */
  async findPaginatedForAdmin(
    filters: { status?: DocumentReviewStatus; category?: DocumentCategory },
    query: PaginationQueryDTO & Record<string, unknown>,
  ): Promise<{
    data: ProfessionalDocumentForAdminQueue[];
    pagination: PaginationResponseDTO;
  }> {
    const where: Prisma.ProfessionalDocumentsWhereInput = { isActive: true };
    if (filters.status) where.status = filters.status;
    if (filters.category) {
      where.professionalDocumentType = { category: filters.category };
    }

    return PrismaPaginationUtil.paginate<ProfessionalDocumentForAdminQueue>(
      this.prisma.extended.professionalDocuments,
      query,
      {
        where,
        include: adminQueueInclude,
        defaultOrderByField: 'createdAt',
        fieldMapping: { status: '', category: '' },
      },
    );
  }

  /** Aprobados vencidos — barrido del job de expiración. Incluye el profesional (para notificar). */
  async findExpiredApproved(): Promise<
    (ProfessionalDocuments & { professional: { userId: number } })[]
  > {
    return this.prisma.extended.professionalDocuments.findMany({
      where: {
        isActive: true,
        status: DocumentReviewStatus.APPROVED,
        expiresAt: { lt: new Date() },
      },
      include: { professional: { select: { userId: true } } },
    });
  }
}
