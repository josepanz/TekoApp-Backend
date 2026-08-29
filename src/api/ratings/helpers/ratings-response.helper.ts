import { RatingType } from '@prisma/client';
import { RatingDetailResponseDTO } from '../dtos/response';

/**
 * Identidad de quien consulta, para decidir si hay que ocultar al autor de una calificación
 * anónima. `professionalId` es el perfil profesional del viewer si tiene uno (null si no) —
 * necesario porque el autor de una `PROFESSIONAL_TO_CLIENT` se identifica por `professionalId`,
 * no por `userId`.
 */
export interface RatingViewerContext {
  userId: number;
  professionalId: number | null;
  /** Admin/staff (permiso `ratings.audit:read` o `admin:all`) — nunca se le oculta nada. */
  isPrivileged: boolean;
}

export function isAuthor(
  rating: { type: RatingType; userId: number; professionalId: number },
  viewer: RatingViewerContext,
): boolean {
  return rating.type === RatingType.CLIENT_TO_PROFESSIONAL
    ? rating.userId === viewer.userId
    : rating.professionalId === viewer.professionalId;
}

/**
 * Mapea una calificación cruda de Prisma a su DTO de respuesta: `id`/`referenceId` de la propia
 * calificación se exponen ambos tal cual. `serviceId` sigue siendo el referenceId (UUID) del
 * servicio asociado (o null) — nunca la PK interna — esto es independiente del id/referenceId de
 * la propia calificación.
 *
 * Cuando `isAnonymous` es true y quien consulta (`viewer`) no es ni el autor ni un usuario
 * privilegiado, se oculta (null) el campo que identifica al AUTOR — `userId` si
 * `CLIENT_TO_PROFESSIONAL`, `professionalId` si `PROFESSIONAL_TO_CLIENT` — nunca el campo del
 * calificado, que la otra parte siempre puede ver (es su propia calificación recibida).
 */
export function mapRatingToResponse(
  rating: {
    id: number;
    referenceId: string;
    type: RatingType;
    userId: number;
    professionalId: number;
    isAnonymous: boolean;
    serviceId: number | null;
    service?: { referenceId: string } | null;
    [key: string]: unknown;
  },
  viewer: RatingViewerContext,
): RatingDetailResponseDTO {
  const rest: Record<string, unknown> = { ...rating };
  delete rest.service;
  rest.serviceId = rating.service ? rating.service.referenceId : null;

  if (rating.isAnonymous && !viewer.isPrivileged && !isAuthor(rating, viewer)) {
    if (rating.type === RatingType.CLIENT_TO_PROFESSIONAL) {
      rest.userId = null;
    } else {
      rest.professionalId = null;
    }
  }

  return rest as unknown as RatingDetailResponseDTO;
}

export function mapRatingsToResponse(
  ratings: {
    id: number;
    referenceId: string;
    type: RatingType;
    userId: number;
    professionalId: number;
    isAnonymous: boolean;
    serviceId: number | null;
    service?: { referenceId: string } | null;
    [key: string]: unknown;
  }[],
  viewer: RatingViewerContext,
): RatingDetailResponseDTO[] {
  return ratings.map((r) => mapRatingToResponse(r, viewer));
}
