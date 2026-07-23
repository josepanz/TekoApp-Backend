import { RatingDetailResponseDTO } from '../dtos/response';

/**
 * Mapea una calificación cruda de Prisma a su DTO de respuesta: `id` pasa a ser el referenceId
 * (UUID) de la calificación y `serviceId` pasa a ser el referenceId (UUID) del servicio asociado
 * (o null). Nunca se filtra la PK interna (Int) de la calificación ni del servicio.
 */
export function mapRatingToResponse(rating: {
  id: number;
  referenceId: string;
  serviceId: number | null;
  service?: { referenceId: string } | null;
  [key: string]: unknown;
}): RatingDetailResponseDTO {
  const rest: Record<string, unknown> = { ...rating };
  delete rest.referenceId;
  delete rest.service;
  rest.id = rating.referenceId;
  rest.serviceId = rating.service ? rating.service.referenceId : null;
  return rest as unknown as RatingDetailResponseDTO;
}

export function mapRatingsToResponse(
  ratings: {
    id: number;
    referenceId: string;
    serviceId: number | null;
    service?: { referenceId: string } | null;
    [key: string]: unknown;
  }[],
): RatingDetailResponseDTO[] {
  return ratings.map((r) => mapRatingToResponse(r));
}
