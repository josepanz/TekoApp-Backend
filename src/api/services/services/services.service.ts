import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, ServiceStatus, RequestStatus } from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';
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

const CANCELLABLE = new Set<ServiceStatus>([
  ServiceStatus.PENDING,
  ServiceStatus.ACCEPTED,
]);

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaDatasource) {}

  async createService(
    dto: CreateServiceRequestDTO,
    userId: number,
  ): Promise<ServiceDetailResponseDTO> {
    const category = await this.prisma.extended.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) throw new NotFoundException('Categoría no encontrada');

    return this.prisma.extended.services.create({
      data: {
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
      },
    }) as unknown as Promise<ServiceDetailResponseDTO>;
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

    const [services, total] = await Promise.all([
      this.prisma.extended.services.findMany({
        where,
        include: { users: true, professional: true, category: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.extended.services.count({ where }),
    ]);

    return {
      data: services as unknown as ServiceDetailResponseDTO[],
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

    return this.prisma.extended.services.findMany({
      where,
      include: { users: true, category: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }) as unknown as Promise<ServiceDetailResponseDTO[]>;
  }

  async getServiceById(id: string): Promise<ServiceDetailResponseDTO> {
    const service = await this.prisma.extended.services.findUnique({
      where: { id },
      include: {
        users: true,
        professional: true,
        category: true,
        requests: true,
      },
    });
    if (!service) throw new NotFoundException('Servicio no encontrado');
    return service as unknown as ServiceDetailResponseDTO;
  }

  async updateService(
    id: string,
    dto: UpdateServiceRequestDTO,
    userId: number,
  ): Promise<ServiceDetailResponseDTO> {
    const service = await this.getServiceById(id);

    if (service.userId !== userId && service.professionalId !== null) {
      const professional = await this.prisma.extended.professionals.findUnique({
        where: { id: service.professionalId ?? undefined },
      });
      if (!professional || professional.userId !== userId) {
        throw new ForbiddenException(
          'No tienes permisos para modificar este servicio',
        );
      }
    } else if (service.userId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para modificar este servicio',
      );
    }

    if (!CANCELLABLE.has(service.status)) {
      throw new BadRequestException(
        'No se puede modificar un servicio en este estado',
      );
    }

    return this.prisma.extended.services.update({
      where: { id },
      data: dto,
    }) as unknown as Promise<ServiceDetailResponseDTO>;
  }

  async cancelService(
    id: string,
    reason: string,
    userId: number,
  ): Promise<ServiceDetailResponseDTO> {
    const service = await this.getServiceById(id);

    if (!CANCELLABLE.has(service.status)) {
      throw new BadRequestException(
        'No se puede cancelar un servicio en este estado',
      );
    }

    const isProfessionalOwner = service.professionalId
      ? await this.prisma.extended.professionals
          .findUnique({ where: { id: service.professionalId } })
          .then((p) => p?.userId === userId)
      : false;

    if (service.userId !== userId && !isProfessionalOwner) {
      throw new ForbiddenException(
        'No tienes permisos para cancelar este servicio',
      );
    }

    return this.prisma.extended.services.update({
      where: { id },
      data: {
        status: ServiceStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
    }) as unknown as Promise<ServiceDetailResponseDTO>;
  }

  async acceptService(
    id: string,
    professionalId: number,
  ): Promise<ServiceDetailResponseDTO> {
    const service = await this.getServiceById(id);
    if (service.status !== ServiceStatus.PENDING) {
      throw new BadRequestException(
        'El servicio no puede ser aceptado en este estado',
      );
    }
    const professional = await this.prisma.extended.professionals.findUnique({
      where: { id: professionalId },
    });
    if (!professional)
      throw new ForbiddenException('Usuario no es un profesional');

    return this.prisma.extended.services.update({
      where: { id },
      data: { status: ServiceStatus.ACCEPTED, professionalId },
    }) as unknown as Promise<ServiceDetailResponseDTO>;
  }

  async startService(
    id: string,
    professionalId: number,
  ): Promise<ServiceDetailResponseDTO> {
    const service = await this.getServiceById(id);
    if (service.professionalId !== professionalId) {
      throw new ForbiddenException(
        'Solo el profesional asignado puede iniciar el servicio',
      );
    }
    if (service.status !== ServiceStatus.ACCEPTED) {
      throw new BadRequestException(
        'El servicio no puede ser iniciado en este estado',
      );
    }
    return this.prisma.extended.services.update({
      where: { id },
      data: { status: ServiceStatus.IN_PROGRESS, startedAt: new Date() },
    }) as unknown as Promise<ServiceDetailResponseDTO>;
  }

  async completeService(
    id: string,
    professionalId: number,
  ): Promise<ServiceDetailResponseDTO> {
    const service = await this.getServiceById(id);
    if (service.professionalId !== professionalId) {
      throw new ForbiddenException(
        'Solo el profesional asignado puede completar el servicio',
      );
    }
    if (service.status !== ServiceStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'El servicio no puede ser completado en este estado',
      );
    }

    const completedAt = new Date();
    const data: Prisma.ServicesUpdateInput = {
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

    return this.prisma.extended.services.update({
      where: { id },
      data,
    }) as unknown as Promise<ServiceDetailResponseDTO>;
  }

  async createServiceRequest(
    serviceId: string,
    dto: CreateServiceRequestRequestDTO,
    professionalId: number,
  ): Promise<ServiceRequestDetailResponseDTO> {
    const service = await this.getServiceById(serviceId);
    if (service.status !== ServiceStatus.PENDING) {
      throw new BadRequestException(
        'Solo se pueden crear solicitudes para servicios pendientes',
      );
    }

    const existing = await this.prisma.extended.serviceRequests.findFirst({
      where: { serviceId, professionalId },
    });
    if (existing)
      throw new BadRequestException(
        'Ya has enviado una solicitud para este servicio',
      );

    return this.prisma.extended.serviceRequests.create({
      data: {
        ...dto,
        serviceId,
        professionalId,
        status: RequestStatus.PENDING,
      },
    }) as unknown as Promise<ServiceRequestDetailResponseDTO>;
  }

  async getServiceRequests(
    serviceId: string,
  ): Promise<ServiceRequestsListResponseDTO> {
    const data = await this.prisma.extended.serviceRequests.findMany({
      where: { serviceId },
      include: { professional: true },
      orderBy: { createdAt: 'desc' },
    });
    return { data: data as unknown as ServiceRequestDetailResponseDTO[] };
  }

  async respondToServiceRequest(
    serviceId: string,
    requestId: string,
    dto: RespondServiceRequestRequestDTO,
    userId: number,
  ): Promise<ServiceRequestDetailResponseDTO> {
    const service = await this.getServiceById(serviceId);
    if (service.userId !== userId) {
      throw new ForbiddenException(
        'Solo el cliente puede responder a las solicitudes',
      );
    }

    const request = await this.prisma.extended.serviceRequests.findFirst({
      where: { id: requestId, serviceId },
    });
    if (!request) throw new NotFoundException('Solicitud no encontrada');

    if (dto.status === RequestStatus.ACCEPTED) {
      await this.prisma.extended.$transaction([
        this.prisma.extended.serviceRequests.update({
          where: { id: requestId },
          data: { status: RequestStatus.ACCEPTED },
        }),
        this.prisma.extended.services.update({
          where: { id: serviceId },
          data: {
            status: ServiceStatus.ACCEPTED,
            professionalId: request.professionalId,
          },
        }),
        this.prisma.extended.serviceRequests.updateMany({
          where: {
            serviceId,
            status: RequestStatus.PENDING,
            id: { not: requestId },
          },
          data: { status: RequestStatus.REJECTED },
        }),
      ]);
      return this.prisma.extended.serviceRequests.findUnique({
        where: { id: requestId },
      }) as unknown as Promise<ServiceRequestDetailResponseDTO>;
    }

    return this.prisma.extended.serviceRequests.update({
      where: { id: requestId },
      data: { status: RequestStatus.REJECTED },
    }) as unknown as Promise<ServiceRequestDetailResponseDTO>;
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
      const professional = await this.prisma.extended.professionals.findUnique({
        where: { userId },
      });
      if (professional) where.professionalId = professional.id;
    } else {
      const professional = await this.prisma.extended.professionals.findUnique({
        where: { userId },
      });
      where.OR = [
        { userId },
        ...(professional ? [{ professionalId: professional.id }] : []),
      ];
    }

    if (status) where.status = status;

    return this.prisma.extended.services.findMany({
      where,
      include: { users: true, professional: true, category: true },
      orderBy: { createdAt: 'desc' },
    }) as unknown as Promise<ServiceDetailResponseDTO[]>;
  }

  async getDashboardStats(userId: number): Promise<ServiceStatsResponseDTO> {
    const user = await this.prisma.extended.users.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const professional = await this.prisma.extended.professionals.findUnique({
      where: { userId },
    });
    const baseWhere: Prisma.ServicesWhereInput = professional
      ? { professionalId: professional.id }
      : { userId };

    const [total, pending, inProgress, completed, cancelled, earningsAgg] =
      await Promise.all([
        this.prisma.extended.services.count({ where: baseWhere }),
        this.prisma.extended.services.count({
          where: { ...baseWhere, status: ServiceStatus.PENDING },
        }),
        this.prisma.extended.services.count({
          where: { ...baseWhere, status: ServiceStatus.IN_PROGRESS },
        }),
        this.prisma.extended.services.count({
          where: { ...baseWhere, status: ServiceStatus.COMPLETED },
        }),
        this.prisma.extended.services.count({
          where: { ...baseWhere, status: ServiceStatus.CANCELLED },
        }),
        professional
          ? this.prisma.extended.services.aggregate({
              where: {
                professionalId: professional.id,
                status: ServiceStatus.COMPLETED,
              },
              _sum: { finalAmount: true },
            })
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
