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

interface RawNamedUser {
  firstName: string;
  lastName: string;
}

function fullName(user: RawNamedUser | null | undefined): string | null {
  return user ? `${user.firstName} ${user.lastName}` : null;
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
 *
 * Tarea 9 (platform-hardening-2026-09, 2026-09-14): agrega `userName`/`professionalName`
 * resueltos desde las relaciones `user`/`professional.user` de Prisma (ya venían incluidas en
 * el query — `ratings-db.service.ts` las traía pero se descartaban acá) — Web las necesita para
 * no mostrar ids crudos en sus tablas admin. Mismo criterio de anonimato que el id: si el id
 * queda en `null`, el nombre también, nunca se filtra la identidad por esta vía. Además, esto
 * deja de filtrar las filas `user`/`professional` COMPLETAS (con email, teléfono, etc.) que
 * `{...rating}` venía copiando tal cual al objeto de respuesta — un `cast` sin
 * `plainToInstance`/`ClassSerializerInterceptor` de por medio no filtra nada solo, así que
 * viajaban enteras aunque el DTO no las declarara (hallazgo colateral, corregido de paso: ver
 * `openspec/decisions.md`).
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
    user?: RawNamedUser | null;
    professional?: { user?: RawNamedUser | null } | null;
    [key: string]: unknown;
  },
  viewer: RatingViewerContext,
): RatingDetailResponseDTO {
  const rest: Record<string, unknown> = { ...rating };
  delete rest.service;
  delete rest.user;
  delete rest.professional;
  rest.serviceId = rating.service ? rating.service.referenceId : null;

  if (rating.isAnonymous && !viewer.isPrivileged && !isAuthor(rating, viewer)) {
    if (rating.type === RatingType.CLIENT_TO_PROFESSIONAL) {
      rest.userId = null;
    } else {
      rest.professionalId = null;
    }
  }

  rest.userName = rest.userId === null ? null : fullName(rating.user);
  rest.professionalName =
    rest.professionalId === null ? null : fullName(rating.professional?.user);

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
    user?: RawNamedUser | null;
    professional?: { user?: RawNamedUser | null } | null;
    [key: string]: unknown;
  }[],
  viewer: RatingViewerContext,
): RatingDetailResponseDTO[] {
  return ratings.map((r) => mapRatingToResponse(r, viewer));
}
