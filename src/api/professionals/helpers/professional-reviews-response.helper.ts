import { RatingType } from '@prisma/client';
import { ProfessionalReviewWithRelations } from '@modules/professionals-db/types/professionals-db.type';
import { RatingViewerContext } from '@api/ratings/helpers/ratings-response.helper';
import { ReviewSummaryResponseDTO } from '../dtos/response/professional-reviews.response.dto';

/**
 * Mapea una reseña cruda de Prisma (`professionalReviewsInclude`: `user`+`service`) a su DTO
 * público — antes esto era un cast crudo (`as unknown as DTO`) que filtraba la fila COMPLETA de
 * `Users` (email, teléfono, y cualquier otro campo del modelo) sin importar `isAnonymous`, a
 * cualquier usuario logueado que consultara el perfil de un profesional. Corregido: siempre se
 * revisan las mismas reglas de anonimato que `ratings.controller.ts` (ver `RatingViewerContext`) —
 * si `isAnonymous` y quien consulta no es el autor ni tiene `ratings.audit:read`/`admin:all`, el
 * campo `user` se omite por completo (acá no hay un `userId` suelto que enmascarar, es un objeto
 * anidado).
 */
export function mapReviewToSummary(
  rating: ProfessionalReviewWithRelations,
  viewer: RatingViewerContext,
): ReviewSummaryResponseDTO {
  const isAuthor =
    rating.type === RatingType.CLIENT_TO_PROFESSIONAL
      ? rating.userId === viewer.userId
      : rating.professionalId === viewer.professionalId;
  const hideIdentity = rating.isAnonymous && !viewer.isPrivileged && !isAuthor;

  return {
    id: rating.referenceId,
    userId: rating.userId,
    rating: rating.rating as unknown as number,
    review: rating.review,
    type: rating.type,
    isAnonymous: rating.isAnonymous,
    createdAt: rating.createdAt,
    user: hideIdentity
      ? null
      : {
          id: rating.user.id,
          email: rating.user.email,
          firstName: rating.user.firstName,
          lastName: rating.user.lastName,
          phoneNumber: rating.user.phoneNumber,
        },
  };
}

export function mapReviewsToSummaries(
  ratings: ProfessionalReviewWithRelations[],
  viewer: RatingViewerContext,
): ReviewSummaryResponseDTO[] {
  return ratings.map((r) => mapReviewToSummary(r, viewer));
}
