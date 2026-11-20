import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import {
  AuditLogs,
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

import { t } from '@common/i18n/i18n.helper';

export interface ProfessionalStatusActor {
  id: number;
  referenceId: string;
  email: string;
  firstName: string;
  lastName: string;
}

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
    if (!user) throw new NotFoundException(t('professionals.USER_NOT_FOUND'));

    const existing = await this.prisma.extended.professionals.findUnique({
      where: { userId },
    });
    if (existing)
      throw new ConflictException(t('professionals.USER_ALREADY_PROFESSIONAL'));

    const category = await this.prisma.extended.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category)
      throw new BadRequestException(t('professionals.CATEGORY_DOES_NOT_EXIST'));

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

  private buildListWhere(
    filters: ProfessionalFilters,
  ): Prisma.ProfessionalsWhereInput {
    const where: Prisma.ProfessionalsWhereInput = { isActive: true };

    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.onlyApproved) where.status = ProfessionalStatus.APPROVED;
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

    // Búsqueda multi-palabra (AND de ORs) sobre el nombre del usuario relacionado — mismo
    // patrón que `UsersDbService.findAll` usa para su propio filtro `name`.
    if (filters.search) {
      const ilike = Prisma.QueryMode.insensitive;
      const terms = filters.search.trim().split(/\s+/).filter(Boolean);
      if (terms.length > 0) {
        where.AND = terms.map((term) => ({
          OR: [
            { user: { firstName: { contains: term, mode: ilike } } },
            { user: { lastName: { contains: term, mode: ilike } } },
          ],
        }));
      }
    }

    return where;
  }

  async findMany(
    filters: ProfessionalFilters,
    query: PaginationQueryDTO & Record<string, unknown>,
  ): Promise<{
    data: ProfessionalWithRelations[];
    pagination: PaginationResponseDTO;
  }> {
    return PrismaPaginationUtil.paginate<ProfessionalWithRelations>(
      this.prisma.extended.professionals,
      query,
      {
        where: this.buildListWhere(filters),
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

  // Mismos filtros que findMany, sin paginar — usado por el export CSV del panel admin (el
  // volumen lo controla el filtro, no una página).
  async findAllForExport(
    filters: ProfessionalFilters,
  ): Promise<ProfessionalWithRelations[]> {
    return this.prisma.extended.professionals.findMany({
      where: this.buildListWhere(filters),
      include: professionalWithRelationsInclude,
      orderBy: { averageRating: 'desc' },
    });
  }

  async findNearby(
    latitude: number,
    longitude: number,
    radius = 10,
    categoryId?: number,
    onlyApproved = false,
  ): Promise<ProfessionalWithRelations[]> {
    const latRange = radius / 111;
    const lngRange = radius / (111 * Math.cos((latitude * Math.PI) / 180));

    const where: Prisma.ProfessionalsWhereInput = {
      isAvailable: true,
      isActive: true,
      ...(onlyApproved && { status: ProfessionalStatus.APPROVED }),
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
    if (!professional)
      throw new NotFoundException(t('professionals.NOT_FOUND'));
    return professional;
  }

  async findByUserId(userId: number): Promise<ProfessionalWithRelations> {
    const professional = await this.prisma.extended.professionals.findUnique({
      where: { userId },
      include: professionalWithRelationsInclude,
    });
    if (!professional)
      throw new NotFoundException(t('professionals.NOT_FOUND'));
    return professional;
  }

  /**
   * A diferencia de `findByUserId`, nunca lanza — devuelve `null` cuando el usuario no tiene
   * perfil profesional (ej. un cliente puro). Uso: resolver "¿este viewer es el autor de una
   * reseña PROFESSIONAL_TO_CLIENT?" sin forzar un try/catch en el caller (ver
   * `ProfessionalsService.buildReviewViewerContext`).
   */
  async findProfessionalIdByUserId(userId: number): Promise<number | null> {
    const professional = await this.prisma.extended.professionals.findUnique({
      where: { userId },
      select: { id: true },
    });
    return professional?.id ?? null;
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
    if (!professional)
      throw new NotFoundException(t('professionals.NOT_FOUND'));
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

  /**
   * Actualiza el profesional solo si su estado actual está entre `expectedStatuses` — evita
   * la condición de carrera entre dos transiciones administrativas concurrentes sobre el mismo
   * profesional (ej. verificar y suspender al mismo tiempo, o dos admins resolviendo la misma
   * verificación). Devuelve la cantidad de filas afectadas: 0 significa que el estado cambió
   * entre la lectura de validación y esta escritura.
   */
  async updateConditional(
    id: number,
    expectedStatuses: ProfessionalStatus[],
    data: Prisma.ProfessionalsUpdateInput,
  ): Promise<number> {
    const result = await this.prisma.extended.professionals.updateMany({
      where: { id, status: { in: expectedStatuses } },
      data,
    });
    return result.count;
  }

  /**
   * Transiciones de estado de un profesional, tomadas de `audit_logs` (las escribe el trigger de
   * auditoría): solo UPDATE donde `old_data.status != new_data.status`, más recientes primero.
   * El filtro se arma con los pares (from, to) del enum porque Prisma no compara dos paths JSON entre sí.
   * `actors` resuelve `changed_by` (referenceId; filas viejas pueden traer el id numérico) a usuarios.
   */
  async findStatusHistory(
    professionalId: number,
    page: number,
    pageSize: number,
  ): Promise<{
    rows: AuditLogs[];
    total: number;
    actors: ProfessionalStatusActor[];
  }> {
    const statuses = Object.values(ProfessionalStatus);
    const where: Prisma.AuditLogsWhereInput = {
      tableName: 'professionals',
      recordId: String(professionalId),
      operationType: 'UPDATE',
      OR: statuses.flatMap((from) =>
        statuses
          .filter((to) => to !== from)
          .map((to) => ({
            AND: [
              { oldData: { path: ['status'], equals: from } },
              { newData: { path: ['status'], equals: to } },
            ],
          })),
      ),
    };
    const [rows, total] = await Promise.all([
      this.prisma.extended.auditLogs.findMany({
        where,
        orderBy: [{ changedAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.extended.auditLogs.count({ where }),
    ]);

    const changedBy = [...new Set(rows.map((r) => r.changedBy))];
    const numericIds = changedBy.filter((c) => /^\d+$/.test(c)).map(Number);
    const actors = changedBy.length
      ? await this.prisma.extended.users.findMany({
          where: {
            OR: [
              { referenceId: { in: changedBy } },
              ...(numericIds.length ? [{ id: { in: numericIds } }] : []),
            ],
          },
          select: {
            id: true,
            referenceId: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        })
      : [];
    return { rows, total, actors };
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
    onlyApproved = false,
  ): Promise<{
    data: ProfessionalWithRelations[];
    pagination: PaginationResponseDTO;
  }> {
    const where: Prisma.ProfessionalsWhereInput = {
      isActive: true,
      skills: { hasSome: skills },
      ...(onlyApproved && { status: ProfessionalStatus.APPROVED }),
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
    onlyApproved = false,
  ): Promise<ProfessionalWithRelations[]> {
    const where: Prisma.ProfessionalsWhereInput = {
      isActive: true,
      averageRating: { gt: 0 },
      ...(onlyApproved && { status: ProfessionalStatus.APPROVED }),
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
