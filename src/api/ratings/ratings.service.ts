import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma, RatingType } from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';

const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class RatingsService {
  constructor(private readonly prisma: PrismaDatasource) {}

  async create(userId: number, dto: CreateRatingDto) {
    const professionalId =
      typeof dto.professionalId === 'string'
        ? ((
            await this.prisma.extended.professionals.findFirst({
              where: { user: { referenceId: dto.professionalId } },
            })
          )?.id ?? 0)
        : Number(dto.professionalId);

    const serviceId =
      ((dto as unknown as Record<string, unknown>).serviceId as
        | string
        | undefined) ??
      ((dto as unknown as Record<string, unknown>).serviceRequestId as
        | string
        | undefined);

    const existing = await this.prisma.extended.rating.findFirst({
      where: { userId, professionalId, serviceId, type: dto.type },
    });
    if (existing)
      throw new BadRequestException('Ya has calificado este servicio');

    return this.prisma.extended.rating.create({
      data: {
        userId,
        professionalId,
        serviceId,
        type: dto.type,
        rating: dto.rating,
        review:
          ((dto as unknown as Record<string, unknown>).comment as string) ??
          ((dto as unknown as Record<string, unknown>).review as string),
        criteria: dto.criteria ? dto.criteria : undefined,
        isAnonymous: dto.isAnonymous ?? false,
        createdBy: String(userId),
      },
    });
  }

  async findAll() {
    return this.prisma.extended.rating.findMany({
      include: { user: true, professional: true, service: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const rating = await this.prisma.extended.rating.findUnique({
      where: { id },
      include: { user: true, professional: true, service: true },
    });
    if (!rating) throw new NotFoundException('Calificación no encontrada');
    return rating;
  }

  async findByUser(userId: number) {
    return this.prisma.extended.rating.findMany({
      where: { userId },
      include: { professional: true, service: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByProfessional(professionalId: number) {
    return this.prisma.extended.rating.findMany({
      where: { professionalId, isActive: true },
      include: { user: true, service: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findClientRatings(professionalId: number) {
    return this.prisma.extended.rating.findMany({
      where: {
        professionalId,
        type: RatingType.CLIENT_TO_PROFESSIONAL,
        isAnonymous: false,
        isActive: true,
      },
      include: { user: true, service: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findProfessionalRatings(userId: number) {
    return this.prisma.extended.rating.findMany({
      where: {
        userId,
        type: RatingType.PROFESSIONAL_TO_CLIENT,
        isAnonymous: false,
        isActive: true,
      },
      include: { professional: true, service: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByServiceRequest(serviceRequestId: string) {
    return this.prisma.extended.rating.findMany({
      where: { serviceId: serviceRequestId, isActive: true },
      include: { user: true, professional: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserRatingStats(userId: number | string) {
    const id = typeof userId === 'string' ? Number(userId) : userId;
    const [given, received] = await Promise.all([
      this.prisma.extended.rating.aggregate({
        where: { userId: id },
        _count: { id: true },
        _avg: { rating: true },
      }),
      this.prisma.extended.rating.aggregate({
        where: { professionalId: id },
        _count: { id: true },
        _avg: { rating: true },
      }),
    ]);
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
    dto: UpdateRatingDto | Partial<Prisma.RatingUpdateInput>,
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
    return this.prisma.extended.rating.update({ where: { id }, data: dto });
  }

  async remove(id: string, userId: number) {
    const rating = await this.findOne(id);
    if (rating.userId !== userId) {
      throw new ForbiddenException('No puedes eliminar esta calificación');
    }
    const age = Date.now() - rating.createdAt.getTime();
    if (age > EDIT_WINDOW_MS) {
      throw new BadRequestException('No se puede eliminar esta calificación');
    }
    return this.prisma.extended.rating.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async reportRating(id: string, userId: number, reason: string) {
    const rating = await this.findOne(id);
    if (rating.userId === userId) {
      throw new BadRequestException(
        'No puedes reportar tu propia calificación',
      );
    }
    return this.prisma.extended.rating.update({
      where: { id },
      data: { isReported: true, reportReason: reason },
    });
  }

  async getAverageRating(professionalId: number) {
    const [aggregate, ratings] = await Promise.all([
      this.prisma.extended.rating.aggregate({
        where: {
          professionalId,
          type: RatingType.CLIENT_TO_PROFESSIONAL,
          isActive: true,
        },
        _avg: { rating: true },
        _count: { id: true },
      }),
      this.prisma.extended.rating.findMany({
        where: {
          professionalId,
          type: RatingType.CLIENT_TO_PROFESSIONAL,
          isActive: true,
        },
        select: { rating: true, criteria: true },
      }),
    ]);

    if (aggregate._count.id === 0) {
      return {
        averageRating: 0,
        totalRatings: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
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

  async getTopRatedProfessionals(limit = 10) {
    const grouped = await this.prisma.extended.rating.groupBy({
      by: ['professionalId'],
      where: { type: RatingType.CLIENT_TO_PROFESSIONAL, isActive: true },
      _avg: { rating: true },
      _count: { id: true },
      having: { rating: { _count: { gte: 3 } } },
      orderBy: { _avg: { rating: 'desc' } },
      take: limit,
    });

    return grouped.map((g) => ({
      professionalId: String(g.professionalId),
      averageRating: Math.round(Number(g._avg.rating ?? 0) * 100) / 100,
      totalRatings: g._count.id,
    }));
  }

  async getRecentRatings(limit = 20) {
    return this.prisma.extended.rating.findMany({
      include: { user: true, professional: true, service: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
