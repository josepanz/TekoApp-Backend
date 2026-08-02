import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma, ServiceStatus, RequestStatus } from '@prisma/client';
import { ServicesDbService } from '@modules/services-db/services/services-db.service';
import { CreateServiceRequestDTO } from '../dtos/request/create-service.request.dto';
import { UpdateServiceRequestDTO } from '../dtos/request/update-service.request.dto';
import { CreateServiceRequestRequestDTO } from '../dtos/request/create-service-request.request.dto';
import { RespondServiceRequestRequestDTO } from '../dtos/request/respond-service-request.request.dto';
import { GetServicesListQueryDTO } from '../dtos/request/get-services-list.query.dto';
import {
  ServiceDetailResponseDTO,
  ServicesListResponseDTO,
  ServiceRequestDetailResponseDTO,
  ServiceRequestsListResponseDTO,
  ServiceStatsResponseDTO,
} from '../dtos/response';
import {
  mapServiceToResponse,
  mapServicesToResponse,
  mapServiceRequestToResponse,
  mapServiceRequestsToResponse,
} from '../helpers/services-response.helper';

import { t } from '@common/i18n/i18n.helper';
const CANCELLABLE = new Set<ServiceStatus>([
  ServiceStatus.PENDING,
  ServiceStatus.ACCEPTED,
]);

type ServiceEntity = NonNullable<
  Awaited<ReturnType<ServicesDbService['findServiceByReferenceId']>>
>;

@Injectable()
export class ServicesService {
  constructor(private readonly db: ServicesDbService) {}

  /**
   * Resuelve el UUID público (referenceId, recibido en la URL) a la entidad completa con su PK
   * interna (Int). Lanza NotFound si no existe. Todas las operaciones internas (updates, checks de
   * ownership, relaciones) usan `.id` numérico; el response nunca expone ese id.
   */
  private async getServiceEntityByRef(
    referenceId: string,
  ): Promise<ServiceEntity> {
    const service = await this.db.findServiceByReferenceId(referenceId);
    if (!service) throw new NotFoundException(t('services.NOT_FOUND'));
    return service;
  }

  async createService(
    dto: CreateServiceRequestDTO,
    userId: number,
  ): Promise<ServiceDetailResponseDTO> {
    const category = await this.db.findCategoryById(dto.categoryId);
    if (!category)
      throw new NotFoundException(t('services.CATEGORY_NOT_FOUND'));

    const created = await this.db.createService({
      userId,
      title: dto.title,
      description: dto.description,
      categoryId: dto.categoryId,
      serviceTypeId: dto.serviceTypeId,
      estimatedHours: dto.estimatedHours,
      hourlyRate: dto.hourlyRate,
      fixedPrice: dto.fixedPrice,
      latitude: dto.latitude,
      longitude: dto.longitude,
      address: dto.address,
      additionalNotes: dto.additionalNotes,
      images: dto.images ?? [],
      isUrgent: dto.isUrgent ?? false,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      status: ServiceStatus.PENDING,
    });
    return mapServiceToResponse(created);
  }

  async getServices(
    filters: GetServicesListQueryDTO,
  ): Promise<ServicesListResponseDTO> {
    const where: Prisma.ServicesWhereInput = {};
    if (filters.status) where.status = filters.status;
    if (filters.categoryId) where.categoryId = filters.categoryId;

    if (filters.latitude && filters.longitude && filters.radius) {
      const latRange = filters.radius / 111;
      const lngRange =
        filters.radius / (111 * Math.cos((filters.latitude * Math.PI) / 180));
      where.latitude = {
        gte: filters.latitude - latRange,
        lte: filters.latitude + latRange,
      };
      where.longitude = {
        gte: filters.longitude - lngRange,
        lte: filters.longitude + lngRange,
      };
    }

    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 10;

    const [services, total] = await this.db.findManyWithCount(
      where,
      page,
      pageSize,
    );

    return {
      data: mapServicesToResponse(services),
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getNearbyServices(
    latitude: number,
    longitude: number,
    radius = 10,
    categoryId?: number,
  ): Promise<ServiceDetailResponseDTO[]> {
    const latRange = radius / 111;
    const lngRange = radius / (111 * Math.cos((latitude * Math.PI) / 180));

    const where: Prisma.ServicesWhereInput = {
      status: ServiceStatus.PENDING,
      latitude: { gte: latitude - latRange, lte: latitude + latRange },
      longitude: { gte: longitude - lngRange, lte: longitude + lngRange },
    };
    if (categoryId) where.categoryId = categoryId;

    const services = await this.db.findNearby(where);
    return mapServicesToResponse(services);
  }

  async getServiceById(id: string): Promise<ServiceDetailResponseDTO> {
    const service = await this.getServiceEntityByRef(id);
    return mapServiceToResponse(service);
  }

  async updateService(
    id: string,
    dto: UpdateServiceRequestDTO,
    userId: number,
  ): Promise<ServiceDetailResponseDTO> {
    const service = await this.getServiceEntityByRef(id);

    if (service.userId !== userId && service.professionalId !== null) {
      const professional =
        service.professionalId != null
          ? await this.db.findProfessionalById(service.professionalId)
          : null;
      if (!professional || professional.userId !== userId) {
        throw new ForbiddenException(t('services.UNAUTHORIZED_UPDATE'));
      }
    } else if (service.userId !== userId) {
      throw new ForbiddenException(t('services.UNAUTHORIZED_UPDATE'));
    }

    if (!CANCELLABLE.has(service.status)) {
      throw new BadRequestException(t('services.CANNOT_UPDATE_IN_STATUS'));
    }

    const updatedCount = await this.db.updateServiceConditional(
      service.id,
      Array.from(CANCELLABLE),
      dto,
    );
    if (updatedCount === 0) {
      throw new ConflictException(t('services.STATUS_CHANGED_BEFORE_UPDATE'));
    }
    return this.getServiceById(id);
  }

  async cancelService(
    id: string,
    reason: string,
    userId: number,
  ): Promise<ServiceDetailResponseDTO> {
    const service = await this.getServiceEntityByRef(id);

    if (!CANCELLABLE.has(service.status)) {
      throw new BadRequestException(t('services.CANNOT_CANCEL_IN_STATUS'));
    }

    const isProfessionalOwner = service.professionalId
      ? await this.db
          .findProfessionalById(service.professionalId)
          .then((p) => p?.userId === userId)
      : false;

    if (service.userId !== userId && !isProfessionalOwner) {
      throw new ForbiddenException(t('services.UNAUTHORIZED_CANCEL'));
    }

    const updatedCount = await this.db.updateServiceConditional(
      service.id,
      Array.from(CANCELLABLE),
      {
        status: ServiceStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
    );
    if (updatedCount === 0) {
      throw new ConflictException(t('services.STATUS_CHANGED_BEFORE_CANCEL'));
    }
    return this.getServiceById(id);
  }

  async acceptService(
    id: string,
    userId: number,
  ): Promise<ServiceDetailResponseDTO> {
    const service = await this.getServiceEntityByRef(id);
    if (service.status !== ServiceStatus.PENDING) {
      throw new BadRequestException(t('services.CANNOT_BE_ACCEPTED_IN_STATUS'));
    }
    // `userId` es el id de `Users` (JWT) — se resuelve al `Professionals.id` correspondiente
    // antes de usarlo, igual que ya hacen `getMyServices`/`getDashboardStats` en este mismo
    // service. Antes se pasaba `req.user.id` directo como si ya fuera `Professionals.id`.
    const professional = await this.db.findProfessionalByUserId(userId);
    if (!professional)
      throw new ForbiddenException(t('services.USER_NOT_PROFESSIONAL'));

    const updatedCount = await this.db.updateServiceConditional(
      service.id,
      [ServiceStatus.PENDING],
      { status: ServiceStatus.ACCEPTED, professionalId: professional.id },
    );
    if (updatedCount === 0) {
      throw new ConflictException(t('services.NO_LONGER_PENDING'));
    }
    return this.getServiceById(id);
  }

  async startService(
    id: string,
    userId: number,
  ): Promise<ServiceDetailResponseDTO> {
    const service = await this.getServiceEntityByRef(id);
    const professional = await this.db.findProfessionalByUserId(userId);
    if (!professional || service.professionalId !== professional.id) {
      throw new ForbiddenException(
        t('services.ONLY_ASSIGNED_PROFESSIONAL_CAN_START'),
      );
    }
    if (service.status !== ServiceStatus.ACCEPTED) {
      throw new BadRequestException(t('services.CANNOT_BE_STARTED_IN_STATUS'));
    }

    const updatedCount = await this.db.updateServiceConditional(
      service.id,
      [ServiceStatus.ACCEPTED],
      { status: ServiceStatus.IN_PROGRESS, startedAt: new Date() },
    );
    if (updatedCount === 0) {
      throw new ConflictException(t('services.STATUS_CHANGED_BEFORE_START'));
    }
    return this.getServiceById(id);
  }

  async completeService(
    id: string,
    userId: number,
  ): Promise<ServiceDetailResponseDTO> {
    const service = await this.getServiceEntityByRef(id);
    const professional = await this.db.findProfessionalByUserId(userId);
    if (!professional || service.professionalId !== professional.id) {
      throw new ForbiddenException(
        t('services.ONLY_ASSIGNED_PROFESSIONAL_CAN_COMPLETE'),
      );
    }
    if (service.status !== ServiceStatus.IN_PROGRESS) {
      throw new BadRequestException(
        t('services.CANNOT_BE_COMPLETED_IN_STATUS'),
      );
    }

    const completedAt = new Date();
    const data: Prisma.ServicesUncheckedUpdateInput = {
      status: ServiceStatus.COMPLETED,
      completedAt,
    };

    if (service.hourlyRate && service.startedAt) {
      const ms = completedAt.getTime() - new Date(service.startedAt).getTime();
      const actualHours = ms / (1000 * 60 * 60);
      const finalAmount = actualHours * Number(service.hourlyRate);
      data.actualHours = actualHours;
      data.finalAmount = finalAmount;
    }

    const updatedCount = await this.db.updateServiceConditional(
      service.id,
      [ServiceStatus.IN_PROGRESS],
      data,
    );
    if (updatedCount === 0) {
      throw new ConflictException(t('services.STATUS_CHANGED_BEFORE_COMPLETE'));
    }
    return this.getServiceById(id);
  }

  async createServiceRequest(
    serviceId: string,
    dto: CreateServiceRequestRequestDTO,
    userId: number,
  ): Promise<ServiceRequestDetailResponseDTO> {
    const service = await this.getServiceEntityByRef(serviceId);
    if (service.status !== ServiceStatus.PENDING) {
      throw new BadRequestException(t('services.ONLY_PENDING_ACCEPT_REQUESTS'));
    }

    const professional = await this.db.findProfessionalByUserId(userId);
    if (!professional)
      throw new ForbiddenException(t('services.USER_NOT_PROFESSIONAL'));

    const existing = await this.db.findDuplicateRequest(
      service.id,
      professional.id,
    );
    if (existing)
      throw new BadRequestException(t('services.REQUEST_ALREADY_SENT'));

    const created = await this.db.createServiceRequest({
      ...dto,
      serviceId: service.id,
      professionalId: professional.id,
      status: RequestStatus.PENDING,
    });
    return mapServiceRequestToResponse(created);
  }

  async getServiceRequests(
    serviceId: string,
  ): Promise<ServiceRequestsListResponseDTO> {
    const service = await this.getServiceEntityByRef(serviceId);
    const data = await this.db.findServiceRequests(service.id);
    return { data: mapServiceRequestsToResponse(data) };
  }

  async respondToServiceRequest(
    serviceId: string,
    requestId: string,
    dto: RespondServiceRequestRequestDTO,
    userId: number,
  ): Promise<ServiceRequestDetailResponseDTO> {
    const service = await this.getServiceEntityByRef(serviceId);
    if (service.userId !== userId) {
      throw new ForbiddenException(
        t('services.ONLY_CLIENT_CAN_ANSWER_REQUESTS'),
      );
    }

    const request = await this.db.findServiceRequestByReferenceId(
      requestId,
      service.id,
    );
    if (!request) throw new NotFoundException(t('services.REQUEST_NOT_FOUND'));

    if (dto.status === RequestStatus.ACCEPTED) {
      const updatedCount = await this.db.acceptRequestTransaction(
        request.id,
        service.id,
        request.professionalId,
      );
      if (updatedCount === 0) {
        throw new ConflictException(t('services.NO_LONGER_ACCEPTING_REQUESTS'));
      }
      const accepted = await this.db.findServiceRequestById(request.id);
      if (!accepted)
        throw new NotFoundException(t('services.REQUEST_NOT_FOUND'));
      return mapServiceRequestToResponse(accepted);
    }

    const rejected = await this.db.updateServiceRequest(request.id, {
      status: RequestStatus.REJECTED,
    });
    return mapServiceRequestToResponse(rejected);
  }

  async getMyServices(
    userId: number,
    status?: ServiceStatus,
    role?: 'client' | 'professional',
  ): Promise<ServiceDetailResponseDTO[]> {
    const where: Prisma.ServicesWhereInput = {};

    if (role === 'client') {
      where.userId = userId;
    } else if (role === 'professional') {
      const professional = await this.db.findProfessionalByUserId(userId);
      if (professional) where.professionalId = professional.id;
    } else {
      const professional = await this.db.findProfessionalByUserId(userId);
      where.OR = [
        { userId },
        ...(professional ? [{ professionalId: professional.id }] : []),
      ];
    }

    if (status) where.status = status;

    const services = await this.db.findMyServices(where);
    return mapServicesToResponse(services);
  }

  async getDashboardStats(userId: number): Promise<ServiceStatsResponseDTO> {
    const user = await this.db.findUserById(userId);
    if (!user) throw new NotFoundException(t('services.USER_NOT_FOUND'));

    const professional = await this.db.findProfessionalByUserId(userId);
    const baseWhere: Prisma.ServicesWhereInput = professional
      ? { professionalId: professional.id }
      : { userId };

    const [total, pending, inProgress, completed, cancelled, earningsAgg] =
      await Promise.all([
        this.db.countServices(baseWhere),
        this.db.countServices({ ...baseWhere, status: ServiceStatus.PENDING }),
        this.db.countServices({
          ...baseWhere,
          status: ServiceStatus.IN_PROGRESS,
        }),
        this.db.countServices({
          ...baseWhere,
          status: ServiceStatus.COMPLETED,
        }),
        this.db.countServices({
          ...baseWhere,
          status: ServiceStatus.CANCELLED,
        }),
        professional
          ? this.db.aggregateEarnings(professional.id)
          : Promise.resolve({ _sum: { finalAmount: null } }),
      ]);

    return {
      total,
      pending,
      inProgress,
      completed,
      cancelled,
      totalEarnings: Number(earningsAgg._sum.finalAmount ?? 0),
    };
  }
}
