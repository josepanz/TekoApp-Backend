import { ProfessionalPortfolioItems } from '@prisma/client';
import { PortfolioItemForAdminQueue } from '@modules/professional-portfolio-db/services/professional-portfolio-db.service';
import {
  AdminPortfolioItemResponseDTO,
  PortfolioItemResponseDTO,
} from '../dtos/response';

/**
 * Mapeo explícito (no cast crudo) — mismo criterio que professional-documents: el modelo Prisma
 * trae campos internos (`id`, `professionalId`, `createdBy`, `checksum`, etc.) que
 * `ClassSerializerInterceptor` no filtra sobre un objeto plano.
 */
export function mapPortfolioItemToResponse(
  item: ProfessionalPortfolioItems,
): PortfolioItemResponseDTO {
  return {
    referenceId: item.referenceId,
    fileKey: item.fileKey,
    caption: item.caption,
    sortOrder: item.sortOrder,
    isVisible: item.isVisible,
    status: item.status,
    reviewedAt: item.reviewedAt,
    rejectionReason: item.rejectionReason,
    createdAt: item.createdAt,
  };
}

export function mapPortfolioItemsToResponse(
  items: ProfessionalPortfolioItems[],
): PortfolioItemResponseDTO[] {
  return items.map(mapPortfolioItemToResponse);
}

export function mapAdminQueueItemToResponse(
  item: PortfolioItemForAdminQueue,
): AdminPortfolioItemResponseDTO {
  return {
    ...mapPortfolioItemToResponse(item),
    professional: {
      referenceId: item.professional.referenceId,
      firstName: item.professional.user.firstName,
      lastName: item.professional.user.lastName,
    },
  };
}

export function mapAdminQueueItemsToResponse(
  items: PortfolioItemForAdminQueue[],
): AdminPortfolioItemResponseDTO[] {
  return items.map(mapAdminQueueItemToResponse);
}
