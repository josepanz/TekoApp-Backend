import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma, RatingType } from '@prisma/client';
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
  mapRatingToResponse,
  mapRatingsToResponse,
} from '../helpers/ratings-response.helper';

const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class RatingsService {
  constructor(private readonly db: RatingsDbService) {}

  /**
   * Resuelve el UUID público de un servicio (recibido en el DTO) a su PK interna (Int). Devuelve
   * undefined si no se envió ningún UUID; lanza NotFound si el UUID no corresponde a un servicio.
   */
  private async resolveServiceId(
    serviceRef: string | undefined,
  ): Promise<number | undefined> {
    if (!serviceRef) return undefined;
    const service = await this.db.findServiceByReferenceId(serviceRef);
    if (!service) throw new NotFoundException('Servicio no encontrado');
    return service.id;
  }

  private async getRatingEntityByRef(referenceId: string) {
    const rating = await this.db.findByReferenceId(referenceId);
    if (!rating) throw new NotFoundException('Calificación no encontrada');
    return rating;
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
    if (existing)
      throw new BadRequestException('Ya has calificado este servicio');

    const created = await this.db.create({
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
    return mapRatingToResponse(created);
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
        'Solo un profesional puede calificar a un cliente',
      );
    }

    const client = await this.db.findUserByReferenceId(dto.clientId);
    if (!client) throw new NotFoundException('Cliente no encontrado');

    const serviceId = await this.resolveServiceId(dto.serviceRequestId);

    const existing = await this.db.findDuplicate(
      client.id,
      professional.id,
      serviceId,
      RatingType.PROFESSIONAL_TO_CLIENT,
    );
    if (existing)
      throw new BadRequestException('Ya has calificado este servicio');

    const created = await this.db.create({
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
    return mapRatingToResponse(created);
  }

  async findAll(): Promise<RatingDetailResponseDTO[]> {
    return mapRatingsToResponse(await this.db.findAll());
  }

  async findOne(id: string): Promise<RatingDetailResponseDTO> {
    return mapRatingToResponse(await this.getRatingEntityByRef(id));
  }

  async findByUser(userId: number): Promise<RatingDetailResponseDTO[]> {
    return mapRatingsToResponse(await this.db.findByUser(userId));
  }

  async findByProfessional(
    professionalId: number,
  ): Promise<RatingDetailResponseDTO[]> {
    return mapRatingsToResponse(
      await this.db.findByProfessional(professionalId),
    );
  }

  async findClientRatings(
    professionalId: number,
  ): Promise<RatingDetailResponseDTO[]> {
    return mapRatingsToResponse(
      await this.db.findClientRatings(professionalId),
    );
  }

  async findProfessionalRatings(
    userId: number,
  ): Promise<RatingDetailResponseDTO[]> {
    return mapRatingsToResponse(await this.db.findProfessionalRatings(userId));
  }

  async findByServiceRequest(
    serviceRef: string,
  ): Promise<RatingDetailResponseDTO[]> {
    const service = await this.db.findServiceByReferenceId(serviceRef);
    if (!service) throw new NotFoundException('Servicio no encontrado');
    return mapRatingsToResponse(await this.db.findByServiceId(service.id));
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
    userId: number,
    dto: UpdateRatingRequestDTO | Partial<Prisma.RatingUpdateInput>,
  ): Promise<RatingDetailResponseDTO> {
    const rating = await this.getRatingEntityByRef(id);
    if (rating.userId !== userId) {
      throw new ForbiddenException('No puedes editar esta calificación');
    }
    const age = Date.now() - rating.createdAt.getTime();
    if (age > EDIT_WINDOW_MS) {
      throw new BadRequestException(
        'No se puede editar la calificación después de 24 horas',
      );
    }
    const updated = await this.db.update(
      rating.id,
      dto as Prisma.RatingUpdateInput,
    );
    return mapRatingToResponse(updated);
  }

  async remove(id: string, userId: number): Promise<void> {
    const rating = await this.getRatingEntityByRef(id);
    if (rating.userId !== userId) {
      throw new ForbiddenException('No puedes eliminar esta calificación');
    }
    const age = Date.now() - rating.createdAt.getTime();
    if (age > EDIT_WINDOW_MS) {
      throw new BadRequestException('No se puede eliminar esta calificación');
    }
    await this.db.deactivate(rating.id);
  }

  async reportRating(
    id: string,
    userId: number,
    reason: string,
  ): Promise<RatingDetailResponseDTO> {
    const rating = await this.getRatingEntityByRef(id);
    if (rating.userId === userId) {
      throw new BadRequestException(
        'No puedes reportar tu propia calificación',
      );
    }
    return mapRatingToResponse(await this.db.report(rating.id, reason));
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

  async getRecentRatings(limit = 20): Promise<RatingDetailResponseDTO[]> {
    return mapRatingsToResponse(await this.db.findRecent(limit));
  }
}
