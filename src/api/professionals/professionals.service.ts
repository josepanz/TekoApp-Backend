import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  Prisma,
  ProfessionalStatus,
  ServiceStatus,
  RatingType,
} from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';

export interface ProfessionalFilters {
  categoryId?: number;
  latitude?: number;
  longitude?: number;
  radius?: number;
  minRating?: number;
  maxPrice?: number;
  isAvailable?: boolean;
  page?: number;
  limit?: number;
}

export interface ProfessionalStats {
  totalServices: number;
  completedServices: number;
  totalEarnings: number;
  averageRating: number;
  totalRatings: number;
}

@Injectable()
export class ProfessionalsService {
  constructor(private readonly prisma: PrismaDatasource) {}

  async registerProfessional(
    dto: Prisma.ProfessionalsUncheckedCreateInput,
    userId: number,
  ) {
    const user = await this.prisma.extended.users.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const existing = await this.prisma.extended.professionals.findUnique({
      where: { userId },
    });
    if (existing)
      throw new BadRequestException('El usuario ya es un profesional');

    const category = await this.prisma.extended.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) throw new BadRequestException('La categoría no existe');

    return this.prisma.extended.professionals.create({
      data: {
        ...dto,
        userId,
        status: ProfessionalStatus.PENDING,
        isAvailable: false,
        isActive: true,
      },
    });
  }

  async getProfessionals(filters: ProfessionalFilters) {
    const where: Prisma.ProfessionalsWhereInput = { isActive: true };

    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.isAvailable !== undefined)
      where.isAvailable = filters.isAvailable;
    if (filters.minRating) where.averageRating = { gte: filters.minRating };
    if (filters.maxPrice) where.hourlyRate = { lte: filters.maxPrice };

    if (filters.latitude && filters.longitude && filters.radius) {
      const latRange = filters.radius / 111;
      const lngRange =
        filters.radius / (111 * Math.cos((filters.latitude * Math.PI) / 180));
      where.currentLatitude = {
        gte: filters.latitude - latRange,
        lte: filters.latitude + latRange,
      };
      where.currentLongitude = {
        gte: filters.longitude - lngRange,
        lte: filters.longitude + lngRange,
      };
    }

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;

    const [professionals, total] = await Promise.all([
      this.prisma.extended.professionals.findMany({
        where,
        include: { user: true, category: true },
        orderBy: { averageRating: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.extended.professionals.count({ where }),
    ]);

    return { professionals, total };
  }

  async getNearbyProfessionals(
    latitude: number,
    longitude: number,
    radius = 10,
    categoryId?: number,
  ) {
    const latRange = radius / 111;
    const lngRange = radius / (111 * Math.cos((latitude * Math.PI) / 180));

    const where: Prisma.ProfessionalsWhereInput = {
      isAvailable: true,
      isActive: true,
      currentLatitude: { gte: latitude - latRange, lte: latitude + latRange },
      currentLongitude: {
        gte: longitude - lngRange,
        lte: longitude + lngRange,
      },
    };
    if (categoryId) where.categoryId = categoryId;

    return this.prisma.extended.professionals.findMany({
      where,
      include: { user: true, category: true },
      orderBy: { averageRating: 'desc' },
      take: 50,
    });
  }

  async getProfessionalById(id: number) {
    const professional = await this.prisma.extended.professionals.findUnique({
      where: { id },
      include: { user: true, category: true },
    });
    if (!professional) throw new NotFoundException('Profesional no encontrado');
    return professional;
  }

  async getProfessionalByUserId(userId: number) {
    const professional = await this.prisma.extended.professionals.findUnique({
      where: { userId },
      include: { user: true, category: true },
    });
    if (!professional) throw new NotFoundException('Profesional no encontrado');
    return professional;
  }

  async updateProfessional(
    id: number,
    dto: Prisma.ProfessionalsUpdateInput,
    userId: number,
  ) {
    const professional = await this.getProfessionalById(id);
    if (professional.userId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para modificar este profesional',
      );
    }
    return this.prisma.extended.professionals.update({
      where: { id },
      data: dto,
    });
  }

  async updateAvailability(id: number, isAvailable: boolean, userId: number) {
    const professional = await this.getProfessionalById(id);
    if (professional.userId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para modificar este profesional',
      );
    }
    return this.prisma.extended.professionals.update({
      where: { id },
      data: { isAvailable },
    });
  }

  async updateLocation(
    id: number,
    dto: { latitude: number; longitude: number },
    userId: number,
  ) {
    const professional = await this.getProfessionalById(id);
    if (professional.userId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para modificar este profesional',
      );
    }
    return this.prisma.extended.professionals.update({
      where: { id },
      data: {
        currentLatitude: dto.latitude,
        currentLongitude: dto.longitude,
        lastLocationUpdate: new Date(),
      },
    });
  }

  async getProfessionalServices(
    id: number,
    status?: ServiceStatus,
    page = 1,
    limit = 10,
  ) {
    const where: Prisma.ServicesWhereInput = { professionalId: id };
    if (status) where.status = status;

    const [services, total] = await Promise.all([
      this.prisma.extended.services.findMany({
        where,
        include: { users: true, category: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.extended.services.count({ where }),
    ]);
    return { services, total };
  }

  async getProfessionalReviews(id: number, page = 1, limit = 10) {
    const where: Prisma.RatingWhereInput = {
      professionalId: id,
      type: RatingType.CLIENT_TO_PROFESSIONAL,
      isActive: true,
    };
    const [reviews, total] = await Promise.all([
      this.prisma.extended.rating.findMany({
        where,
        include: { user: true, service: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.extended.rating.count({ where }),
    ]);
    return { reviews, total };
  }

  async getProfessionalStats(id: number): Promise<ProfessionalStats> {
    const professional = await this.getProfessionalById(id);

    const [completedServices, earningsAgg] = await Promise.all([
      this.prisma.extended.services.count({
        where: { professionalId: id, status: ServiceStatus.COMPLETED },
      }),
      this.prisma.extended.services.aggregate({
        where: { professionalId: id, status: ServiceStatus.COMPLETED },
        _sum: { finalAmount: true },
      }),
    ]);

    return {
      totalServices: professional.totalServices,
      completedServices,
      totalEarnings: Number(earningsAgg._sum.finalAmount ?? 0),
      averageRating: Number(professional.averageRating),
      totalRatings: professional.totalRatings,
    };
  }

  async verifyProfessional(
    id: number,
    dto: { isVerified: boolean; notes?: string },
    adminId: number,
  ) {
    await this.getProfessionalById(id);
    return this.prisma.extended.professionals.update({
      where: { id },
      data: {
        verificationStatus: dto.isVerified ? 'verified' : 'rejected',
        status: dto.isVerified
          ? ProfessionalStatus.APPROVED
          : ProfessionalStatus.REJECTED,
        lastChangedBy: String(adminId),
        changedReason: dto.notes,
      },
    });
  }

  async suspendProfessional(id: number, reason: string, adminId: number) {
    await this.getProfessionalById(id);
    return this.prisma.extended.professionals.update({
      where: { id },
      data: {
        status: ProfessionalStatus.SUSPENDED,
        isActive: false,
        lastChangedBy: String(adminId),
        changedReason: reason,
      },
    });
  }

  async searchBySkills(skills: string[], page = 1, limit = 10) {
    const where: Prisma.ProfessionalsWhereInput = {
      isActive: true,
      skills: { hasSome: skills },
    };

    const [professionals, total] = await Promise.all([
      this.prisma.extended.professionals.findMany({
        where,
        include: { user: true, category: true },
        orderBy: { averageRating: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.extended.professionals.count({ where }),
    ]);
    return { professionals, total };
  }

  async getTopRatedProfessionals(categoryId?: number, limit = 10) {
    const where: Prisma.ProfessionalsWhereInput = {
      isActive: true,
      averageRating: { gt: 0 },
    };
    if (categoryId) where.categoryId = categoryId;

    return this.prisma.extended.professionals.findMany({
      where,
      include: { user: true, category: true },
      orderBy: [{ averageRating: 'desc' }, { totalServices: 'desc' }],
      take: limit,
    });
  }
}
