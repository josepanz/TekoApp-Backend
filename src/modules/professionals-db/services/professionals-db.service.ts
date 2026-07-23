import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  Prisma,
  ProfessionalStatus,
  ServiceStatus,
  RatingType,
} from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import { PrismaPaginationUtil } from '@common/utils/prisma-pagination.util';
import {
  PaginationQueryDTO,
  PaginationResponseDTO,
} from '@common/dtos/pagination.dto';
import {
  ProfessionalFilters,
  ProfessionalStats,
} from '../interfaces/professionals-db.interface';
import {
  ProfessionalWithRelations,
  ProfessionalServiceWithRelations,
  ProfessionalReviewWithRelations,
  professionalWithRelationsInclude,
  professionalServicesInclude,
  professionalReviewsInclude,
} from '../types/professionals-db.type';

@Injectable()
export class ProfessionalsDbService {
  constructor(private readonly prisma: PrismaDatasource) {}

  async create(
    dto: Prisma.ProfessionalsUncheckedCreateInput,
    userId: number,
  ): Promise<ProfessionalWithRelations> {
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
      include: professionalWithRelationsInclude,
    });
  }

  async findMany(
    filters: ProfessionalFilters,
    query: PaginationQueryDTO & Record<string, unknown>,
  ): Promise<{
    data: ProfessionalWithRelations[];
    pagination: PaginationResponseDTO;
  }> {
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

    return PrismaPaginationUtil.paginate<ProfessionalWithRelations>(
      this.prisma.extended.professionals,
      query,
      {
        where,
        include: professionalWithRelationsInclude,
        defaultOrderByField: 'averageRating',
        fieldMapping: {
          categoryId: '',
          isAvailable: '',
          minRating: '',
          maxPrice: '',
          latitude: '',
          longitude: '',
          radius: '',
        },
      },
    );
  }

  async findNearby(
    latitude: number,
    longitude: number,
    radius = 10,
    categoryId?: number,
  ): Promise<ProfessionalWithRelations[]> {
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
      include: professionalWithRelationsInclude,
      orderBy: { averageRating: 'desc' },
      take: 50,
    });
  }

  async findById(id: number): Promise<ProfessionalWithRelations> {
    const professional = await this.prisma.extended.professionals.findUnique({
      where: { id },
      include: professionalWithRelationsInclude,
    });
    if (!professional) throw new NotFoundException('Profesional no encontrado');
    return professional;
  }

  async findByUserId(userId: number): Promise<ProfessionalWithRelations> {
    const professional = await this.prisma.extended.professionals.findUnique({
      where: { userId },
      include: professionalWithRelationsInclude,
    });
    if (!professional) throw new NotFoundException('Profesional no encontrado');
    return professional;
  }

  async findByReferenceId(
    referenceId: string,
  ): Promise<ProfessionalWithRelations | null> {
    return this.prisma.extended.professionals.findUnique({
      where: { referenceId },
      include: professionalWithRelationsInclude,
    });
  }

  async findProfessionalByReferenceId(
    referenceId: string,
  ): Promise<ProfessionalWithRelations> {
    const professional = await this.findByReferenceId(referenceId);
    if (!professional) throw new NotFoundException('Profesional no encontrado');
    return professional;
  }

  async update(
    id: number,
    data: Prisma.ProfessionalsUpdateInput,
  ): Promise<ProfessionalWithRelations> {
    return this.prisma.extended.professionals.update({
      where: { id },
      data,
      include: professionalWithRelationsInclude,
    });
  }

  async findServices(
    professionalId: number,
    query: PaginationQueryDTO & Record<string, unknown>,
    status?: ServiceStatus,
  ): Promise<{
    data: ProfessionalServiceWithRelations[];
    pagination: PaginationResponseDTO;
  }> {
    const where: Prisma.ServicesWhereInput = { professionalId };
    if (status) where.status = status;

    return PrismaPaginationUtil.paginate<ProfessionalServiceWithRelations>(
      this.prisma.extended.services,
      query,
      {
        where,
        include: professionalServicesInclude,
        defaultOrderByField: 'createdAt',
        fieldMapping: { status: '' },
      },
    );
  }

  async findReviews(
    professionalId: number,
    query: PaginationQueryDTO & Record<string, unknown>,
  ): Promise<{
    data: ProfessionalReviewWithRelations[];
    pagination: PaginationResponseDTO;
  }> {
    const where: Prisma.RatingWhereInput = {
      professionalId,
      type: RatingType.CLIENT_TO_PROFESSIONAL,
      isActive: true,
    };

    return PrismaPaginationUtil.paginate<ProfessionalReviewWithRelations>(
      this.prisma.extended.rating,
      query,
      {
        where,
        include: professionalReviewsInclude,
        defaultOrderByField: 'createdAt',
        fieldMapping: {},
      },
    );
  }

  async getStats(id: number): Promise<ProfessionalStats> {
    const professional = await this.findById(id);

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

  async searchBySkills(
    skills: string[],
    query: PaginationQueryDTO & Record<string, unknown>,
  ): Promise<{
    data: ProfessionalWithRelations[];
    pagination: PaginationResponseDTO;
  }> {
    const where: Prisma.ProfessionalsWhereInput = {
      isActive: true,
      skills: { hasSome: skills },
    };

    return PrismaPaginationUtil.paginate<ProfessionalWithRelations>(
      this.prisma.extended.professionals,
      query,
      {
        where,
        include: professionalWithRelationsInclude,
        defaultOrderByField: 'averageRating',
        fieldMapping: { skills: '' },
      },
    );
  }

  async getTopRated(
    categoryId?: number,
    limit = 10,
  ): Promise<ProfessionalWithRelations[]> {
    const where: Prisma.ProfessionalsWhereInput = {
      isActive: true,
      averageRating: { gt: 0 },
    };
    if (categoryId) where.categoryId = categoryId;

    return this.prisma.extended.professionals.findMany({
      where,
      include: professionalWithRelationsInclude,
      orderBy: [{ averageRating: 'desc' }, { totalServices: 'desc' }],
      take: limit,
    });
  }
}
