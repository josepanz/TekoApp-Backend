import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma, RatingType } from '@prisma/client';
import { PrismaErrorCodes } from '@common/enum/prisma-error-codes.enum';
import { PERMISSIONS } from '@common/enum/permissions.enum';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';
import { RatingsDbService } from '@modules/ratings-db/services/ratings-db.service';
import { CreateRatingRequestDTO } from '../dtos/request/create-rating.request.dto';
import { CreateProfessionalToClientRatingRequestDTO } from '../dtos/request/create-professional-to-client-rating.request.dto';
import { UpdateRatingRequestDTO } from '../dtos/request/update-rating.request.dto';
import {
  ProfessionalRatingStatsResponseDTO,
  UserRatingStatsResponseDTO,
  TopRatedProfessionalResponseDTO,
  RatingDetailResponseDTO,
} from '../dtos/response';
import {
  RatingViewerContext,
  isAuthor,
  mapRatingToResponse,
  mapRatingsToResponse,
} from '../helpers/ratings-response.helper';

import { t } from '@common/i18n/i18n.helper';
const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class RatingsService {
  constructor(private readonly db: RatingsDbService) {}

  /**
   * Resuelve la identidad de quien consulta para decidir si hay que ocultar al autor de una
   * calificación anónima (ver `RatingViewerContext`) — nunca se le oculta nada a admin/staff
   * (`ratings.audit:read`/`admin:all`).
   */
  private async buildViewerContext(
    user: IUserDataOnJwt,
  ): Promise<RatingViewerContext> {
    const isPrivileged =
      user.permissions.includes(PERMISSIONS.RATINGS.AUDIT_VIEW) ||
      user.permissions.includes(PERMISSIONS.ADMIN.ALL);
    const professional = await this.db.findProfessionalByUserId(user.id);
    return {
      userId: user.id,
      professionalId: professional?.id ?? null,
      isPrivileged,
    };
  }

  /**
   * Resuelve el UUID público de un servicio (recibido en el DTO) a su PK interna (Int). Devuelve
   * undefined si no se envió ningún UUID; lanza NotFound si el UUID no corresponde a un servicio.
   */
  private async resolveServiceId(
    serviceRef: string | undefined,
  ): Promise<number | undefined> {
    if (!serviceRef) return undefined;
    const service = await this.db.findServiceByReferenceId(serviceRef);
    if (!service) throw new NotFoundException(t('ratings.SERVICE_NOT_FOUND'));
    return service.id;
  }

  private async getRatingEntityByRef(referenceId: string) {
    const rating = await this.db.findByReferenceId(referenceId);
    if (!rating) throw new NotFoundException(t('ratings.NOT_FOUND'));
    return rating;
  }

  /**
   * Crea el rating atrapando la colisión del `@@unique([userId, professionalId, serviceId,
   * type])` — el chequeo `findDuplicate` de más arriba tiene una ventana de carrera real (dos
   * altas concurrentes pueden pasarlo ambas); sin esto, la segunda terminaría en el 409 genérico
   * del filtro global de Prisma en vez del mismo 400 `ALREADY_RATED` que ya usa el chequeo
   * no-concurrente.
   */
  private async createRatingSafely(data: Prisma.RatingUncheckedCreateInput) {
    try {
      return await this.db.create(data);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === (PrismaErrorCodes.UniqueConstraintFailed as string)
      ) {
        throw new BadRequestException(t('ratings.ALREADY_RATED'));
      }
      throw error;
    }
  }

  async create(
    userId: number,
    dto: CreateRatingRequestDTO,
  ): Promise<RatingDetailResponseDTO> {
    const professionalId =
      typeof dto.professionalId === 'string'
        ? ((await this.db.findProfessionalByUserRef(dto.professionalId))?.id ??
          0)
        : Number(dto.professionalId);

    const serviceRef =
      ((dto as unknown as Record<string, unknown>).serviceId as
        | string
        | undefined) ??
      ((dto as unknown as Record<string, unknown>).serviceRequestId as
        | string
        | undefined);
    const serviceId = await this.resolveServiceId(serviceRef);

    const existing = await this.db.findDuplicate(
      userId,
      professionalId,
      serviceId,
      dto.type,
    );
    if (existing) throw new BadRequestException(t('ratings.ALREADY_RATED'));

    const created = await this.createRatingSafely({
      userId,
      professionalId,
      serviceId,
      type: dto.type,
      rating: dto.rating,
      review:
        ((dto as unknown as Record<string, unknown>).comment as string) ??
        ((dto as unknown as Record<string, unknown>).review as string),
      criteria: dto.criteria
        ? (dto.criteria as unknown as Prisma.InputJsonValue)
        : undefined,
      isAnonymous: dto.isAnonymous ?? false,
      createdBy: String(userId),
    });
    // El caller siempre es el autor de lo que acaba de crear — nunca se le oculta a sí mismo.
    return mapRatingToResponse(created, {
      userId,
      professionalId: null,
      isPrivileged: false,
    });
  }

  // Contraparte de `create()` para el sentido inverso: acá el profesional autenticado (rater)
  // califica a un cliente (ratee). El modelo `Rating` siempre guarda `userId`/`professionalId`
  // sin importar la dirección — para `PROFESSIONAL_TO_CLIENT`, `userId` es el cliente calificado
  // y `professionalId` es el perfil profesional del que calificó, no al revés.
  async createProfessionalToClientRating(
    raterUserId: number,
    dto: CreateProfessionalToClientRatingRequestDTO,
  ): Promise<RatingDetailResponseDTO> {
    const professional = await this.db.findProfessionalByUserId(raterUserId);
    if (!professional) {
      throw new ForbiddenException(
        t('ratings.ONLY_PROFESSIONAL_CAN_RATE_CLIENT'),
      );
    }

    const client = await this.db.findUserByReferenceId(dto.clientId);
    if (!client) throw new NotFoundException(t('ratings.CLIENT_NOT_FOUND'));

    const serviceId = await this.resolveServiceId(dto.serviceRequestId);

    const existing = await this.db.findDuplicate(
      client.id,
      professional.id,
      serviceId,
      RatingType.PROFESSIONAL_TO_CLIENT,
    );
    if (existing) throw new BadRequestException(t('ratings.ALREADY_RATED'));

    const created = await this.createRatingSafely({
      userId: client.id,
      professionalId: professional.id,
      serviceId,
      type: RatingType.PROFESSIONAL_TO_CLIENT,
      rating: dto.rating,
      review: dto.comment,
      criteria: dto.criteria
        ? (dto.criteria as unknown as Prisma.InputJsonValue)
        : undefined,
      isAnonymous: dto.isAnonymous ?? false,
      createdBy: String(raterUserId),
    });
    return mapRatingToResponse(created, {
      userId: raterUserId,
      professionalId: professional.id,
      isPrivileged: false,
    });
  }

  /** Sin masking — solo alcanzable con `ratings.audit:read`/`admin:all` (ver guard del controller). */
  async findAll(): Promise<RatingDetailResponseDTO[]> {
    return mapRatingsToResponse(await this.db.findAll(), {
      userId: 0,
      professionalId: null,
      isPrivileged: true,
    });
  }

  async findOne(
    id: string,
    user: IUserDataOnJwt,
  ): Promise<RatingDetailResponseDTO> {
    const [rating, viewer] = await Promise.all([
      this.getRatingEntityByRef(id),
      this.buildViewerContext(user),
    ]);
    return mapRatingToResponse(rating, viewer);
  }

  async findByUser(
    userId: number,
    user: IUserDataOnJwt,
  ): Promise<RatingDetailResponseDTO[]> {
    const [ratings, viewer] = await Promise.all([
      this.db.findByUser(userId),
      this.buildViewerContext(user),
    ]);
    return mapRatingsToResponse(ratings, viewer);
  }

  async findByProfessional(
    professionalId: number,
    user: IUserDataOnJwt,
  ): Promise<RatingDetailResponseDTO[]> {
    const [ratings, viewer] = await Promise.all([
      this.db.findByProfessional(professionalId),
      this.buildViewerContext(user),
    ]);
    return mapRatingsToResponse(ratings, viewer);
  }

  // `findClientRatings`/`findProfessionalRatings` ya excluyen `isAnonymous` a nivel de query
  // (`ratings-db.service.ts`) — no hay nada que enmascarar, pero igual se resuelve el viewer real
  // para no depender de que ese filtro nunca cambie.
  async findClientRatings(
    professionalId: number,
    user: IUserDataOnJwt,
  ): Promise<RatingDetailResponseDTO[]> {
    const [ratings, viewer] = await Promise.all([
      this.db.findClientRatings(professionalId),
      this.buildViewerContext(user),
    ]);
    return mapRatingsToResponse(ratings, viewer);
  }

  async findProfessionalRatings(
    userId: number,
    user: IUserDataOnJwt,
  ): Promise<RatingDetailResponseDTO[]> {
    const [ratings, viewer] = await Promise.all([
      this.db.findProfessionalRatings(userId),
      this.buildViewerContext(user),
    ]);
    return mapRatingsToResponse(ratings, viewer);
  }

  async findByServiceRequest(
    serviceRef: string,
    user: IUserDataOnJwt,
  ): Promise<RatingDetailResponseDTO[]> {
    const service = await this.db.findServiceByReferenceId(serviceRef);
    if (!service) throw new NotFoundException(t('ratings.SERVICE_NOT_FOUND'));
    const [ratings, viewer] = await Promise.all([
      this.db.findByServiceId(service.id),
      this.buildViewerContext(user),
    ]);
    return mapRatingsToResponse(ratings, viewer);
  }

  async getUserRatingStats(
    userId: number | string,
  ): Promise<UserRatingStatsResponseDTO> {
    const id = typeof userId === 'string' ? Number(userId) : userId;
    const [given, received] = await this.db.aggregateUserStats(id);
    return {
      givenRatings: given._count.id,
      receivedRatings: received._count.id,
      averageGivenRating:
        Math.round(Number(given._avg.rating ?? 0) * 100) / 100,
      averageReceivedRating:
        Math.round(Number(received._avg.rating ?? 0) * 100) / 100,
    };
  }

  async update(
    id: string,
    user: IUserDataOnJwt,
    dto: UpdateRatingRequestDTO | Partial<Prisma.RatingUpdateInput>,
  ): Promise<RatingDetailResponseDTO> {
    const [rating, viewer] = await Promise.all([
      this.getRatingEntityByRef(id),
      this.buildViewerContext(user),
    ]);
    if (!isAuthor(rating, viewer)) {
      throw new ForbiddenException(t('ratings.UNAUTHORIZED_EDIT'));
    }
    const age = Date.now() - rating.createdAt.getTime();
    if (age > EDIT_WINDOW_MS) {
      throw new BadRequestException(t('ratings.CANNOT_EDIT_AFTER_24H'));
    }
    const updated = await this.db.update(
      rating.id,
      dto as Prisma.RatingUpdateInput,
    );
    return mapRatingToResponse(updated, viewer);
  }

  async remove(id: string, user: IUserDataOnJwt): Promise<void> {
    const [rating, viewer] = await Promise.all([
      this.getRatingEntityByRef(id),
      this.buildViewerContext(user),
    ]);
    if (!isAuthor(rating, viewer)) {
      throw new ForbiddenException(t('ratings.UNAUTHORIZED_DELETE'));
    }
    const age = Date.now() - rating.createdAt.getTime();
    if (age > EDIT_WINDOW_MS) {
      throw new BadRequestException(t('ratings.CANNOT_DELETE'));
    }
    await this.db.deactivate(rating.id);
  }

  async reportRating(
    id: string,
    user: IUserDataOnJwt,
    reason: string,
  ): Promise<RatingDetailResponseDTO> {
    const [rating, viewer] = await Promise.all([
      this.getRatingEntityByRef(id),
      this.buildViewerContext(user),
    ]);
    if (isAuthor(rating, viewer)) {
      throw new BadRequestException(t('ratings.CANNOT_REPORT_OWN'));
    }
    return mapRatingToResponse(await this.db.report(rating.id, reason), viewer);
  }

  async getAverageRating(
    professionalId: number,
  ): Promise<ProfessionalRatingStatsResponseDTO> {
    const [aggregate, ratings] =
      await this.db.getAggregateAndRatings(professionalId);

    if (aggregate._count.id === 0) {
      return {
        averageRating: 0,
        totalRatings: 0,
        ratingDistribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
        averageCriteria: {},
      };
    }

    const dist: Record<string, number> = {
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0,
    };
    const critTotals: Record<string, number> = {};
    const critCounts: Record<string, number> = {};

    for (const r of ratings) {
      const bucket = String(
        Math.min(5, Math.max(1, Math.floor(Number(r.rating)))),
      );
      dist[bucket] = (dist[bucket] ?? 0) + 1;
      if (r.criteria && typeof r.criteria === 'object') {
        for (const [k, v] of Object.entries(
          r.criteria as Record<string, number>,
        )) {
          critTotals[k] = (critTotals[k] ?? 0) + v;
          critCounts[k] = (critCounts[k] ?? 0) + 1;
        }
      }
    }

    const averageCriteria: Record<string, number> = {};
    for (const k of Object.keys(critTotals)) {
      averageCriteria[k] =
        Math.round((critTotals[k] / critCounts[k]) * 100) / 100;
    }

    return {
      averageRating: Math.round(Number(aggregate._avg.rating ?? 0) * 100) / 100,
      totalRatings: aggregate._count.id,
      ratingDistribution: dist as unknown as {
        '1': number;
        '2': number;
        '3': number;
        '4': number;
        '5': number;
      },
      averageCriteria,
    };
  }

  async getTopRatedProfessionals(
    limit = 10,
  ): Promise<TopRatedProfessionalResponseDTO[]> {
    const grouped = await this.db.groupTopRated(limit);

    return grouped.map((g) => ({
      professionalId: String(g.professionalId),
      averageRating: Math.round(Number(g._avg.rating ?? 0) * 100) / 100,
      totalRatings: g._count.id,
    }));
  }

  async getRecentRatings(
    limit: number,
    user: IUserDataOnJwt,
  ): Promise<RatingDetailResponseDTO[]> {
    const [ratings, viewer] = await Promise.all([
      this.db.findRecent(limit),
      this.buildViewerContext(user),
    ]);
    return mapRatingsToResponse(ratings, viewer);
  }
}
