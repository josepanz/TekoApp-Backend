import { Injectable } from '@nestjs/common';
import { Prisma, RatingType } from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';

@Injectable()
export class RatingsDbService {
  constructor(private readonly prisma: PrismaDatasource) {}

  async findProfessionalByUserRef(
    referenceId: string,
  ): Promise<{ id: number } | null> {
    return this.prisma.extended.professionals.findFirst({
      where: { user: { referenceId } },
      select: { id: true },
    });
  }

  async findProfessionalByUserId(
    userId: number,
  ): Promise<{ id: number } | null> {
    return this.prisma.extended.professionals.findUnique({
      where: { userId },
      select: { id: true },
    });
  }

  async findUserByReferenceId(
    referenceId: string,
  ): Promise<{ id: number } | null> {
    return this.prisma.extended.users.findUnique({
      where: { referenceId },
      select: { id: true },
    });
  }

  /** Resuelve el UUID público de un servicio a su PK interna (Int), o null si no existe. */
  async findServiceByReferenceId(
    referenceId: string,
  ): Promise<{ id: number } | null> {
    return this.prisma.extended.services.findUnique({
      where: { referenceId },
      select: { id: true },
    });
  }

  async findDuplicate(
    userId: number,
    professionalId: number,
    serviceId: number | undefined,
    type: RatingType,
  ) {
    return this.prisma.extended.rating.findFirst({
      where: { userId, professionalId, serviceId, type },
    });
  }

  async create(data: Prisma.RatingUncheckedCreateInput) {
    return this.prisma.extended.rating.create({
      data,
      include: { service: true },
    });
  }

  async findAll() {
    return this.prisma.extended.rating.findMany({
      include: { user: true, professional: true, service: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findRecent(limit: number) {
    return this.prisma.extended.rating.findMany({
      include: { user: true, professional: true, service: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
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

  async findByServiceId(serviceId: number) {
    return this.prisma.extended.rating.findMany({
      where: { serviceId, isActive: true },
      include: { user: true, professional: true, service: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: number) {
    return this.prisma.extended.rating.findUnique({
      where: { id },
      include: { user: true, professional: true, service: true },
    });
  }

  /** Busca una calificación por su referenceId (UUID público recibido en la URL). */
  async findByReferenceId(referenceId: string) {
    return this.prisma.extended.rating.findUnique({
      where: { referenceId },
      include: { user: true, professional: true, service: true },
    });
  }

  async update(id: number, data: Prisma.RatingUpdateInput) {
    return this.prisma.extended.rating.update({
      where: { id },
      data,
      include: { service: true },
    });
  }

  async deactivate(id: number): Promise<void> {
    await this.prisma.extended.rating.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async report(id: number, reason: string) {
    return this.prisma.extended.rating.update({
      where: { id },
      data: { isReported: true, reportReason: reason },
      include: { service: true },
    });
  }

  async aggregateUserStats(userId: number) {
    return Promise.all([
      this.prisma.extended.rating.aggregate({
        where: { userId },
        _count: { id: true },
        _avg: { rating: true },
      }),
      this.prisma.extended.rating.aggregate({
        where: { professionalId: userId },
        _count: { id: true },
        _avg: { rating: true },
      }),
    ]);
  }

  async getAggregateAndRatings(professionalId: number) {
    return Promise.all([
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
  }

  async groupTopRated(limit: number) {
    return this.prisma.extended.rating.groupBy({
      by: ['professionalId'],
      where: { type: RatingType.CLIENT_TO_PROFESSIONAL, isActive: true },
      _avg: { rating: true },
      _count: { id: true },
      having: { rating: { _count: { gte: 3 } } },
      orderBy: { _avg: { rating: 'desc' } },
      take: limit,
    });
  }
}
