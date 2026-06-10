import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RatingsDbService } from '@modules/ratings-db/services/ratings-db.service';
import { CreateRatingRequestDTO } from '../dtos/request/create-rating.request.dto';
import { UpdateRatingRequestDTO } from '../dtos/request/update-rating.request.dto';
import {
  ProfessionalRatingStatsResponseDTO,
  UserRatingStatsResponseDTO,
  TopRatedProfessionalResponseDTO,
} from '../dtos/response';

const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class RatingsService {
  constructor(private readonly db: RatingsDbService) {}

  async create(userId: number, dto: CreateRatingRequestDTO) {
    const professionalId =
      typeof dto.professionalId === 'string'
        ? ((await this.db.findProfessionalByUserRef(dto.professionalId))?.id ??
          0)
        : Number(dto.professionalId);

    const serviceId =
      ((dto as unknown as Record<string, unknown>).serviceId as
        | string
        | undefined) ??
      ((dto as unknown as Record<string, unknown>).serviceRequestId as
        | string
        | undefined);

    const existing = await this.db.findDuplicate(
      userId,
      professionalId,
      serviceId,
      dto.type,
    );
    if (existing)
      throw new BadRequestException('Ya has calificado este servicio');

    return this.db.create({
      userId,
      professionalId,
      serviceId,
      type: dto.type,
      rating: dto.rating,
      review:
        ((dto as unknown as Record<string, unknown>).comment as string) ??
        ((dto as unknown as Record<string, unknown>).review as string),
      criteria: dto.criteria
        ? (dto.criteria as unknown as import('@prisma/client').Prisma.InputJsonValue)
        : undefined,
      isAnonymous: dto.isAnonymous ?? false,
      createdBy: String(userId),
    });
  }

  async findAll() {
    return this.db.findAll();
  }

  async findOne(id: string) {
    const rating = await this.db.findById(id);
    if (!rating) throw new NotFoundException('Calificación no encontrada');
    return rating;
  }

  async findByUser(userId: number) {
    return this.db.findByUser(userId);
  }

  async findByProfessional(professionalId: number) {
    return this.db.findByProfessional(professionalId);
  }

  async findClientRatings(professionalId: number) {
    return this.db.findClientRatings(professionalId);
  }

  async findProfessionalRatings(userId: number) {
    return this.db.findProfessionalRatings(userId);
  }

  async findByServiceRequest(serviceRequestId: string) {
    return this.db.findByServiceId(serviceRequestId);
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
  ) {
    const rating = await this.findOne(id);
    if (rating.userId !== userId) {
      throw new ForbiddenException('No puedes editar esta calificación');
    }
    const age = Date.now() - rating.createdAt.getTime();
    if (age > EDIT_WINDOW_MS) {
      throw new BadRequestException(
        'No se puede editar la calificación después de 24 horas',
      );
    }
    return this.db.update(id, dto as Prisma.RatingUpdateInput);
  }

  async remove(id: string, userId: number): Promise<void> {
    const rating = await this.findOne(id);
    if (rating.userId !== userId) {
      throw new ForbiddenException('No puedes eliminar esta calificación');
    }
    const age = Date.now() - rating.createdAt.getTime();
    if (age > EDIT_WINDOW_MS) {
      throw new BadRequestException('No se puede eliminar esta calificación');
    }
    await this.db.deactivate(id);
  }

  async reportRating(id: string, userId: number, reason: string) {
    const rating = await this.findOne(id);
    if (rating.userId === userId) {
      throw new BadRequestException(
        'No puedes reportar tu propia calificación',
      );
    }
    return this.db.report(id, reason);
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

  async getRecentRatings(limit = 20) {
    return this.db.findRecent(limit);
  }
}
