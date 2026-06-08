import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  In,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
} from 'typeorm';
import { Service, ServiceStatus, ServiceType } from './entities/service.entity';
import {
  ServiceRequest,
  RequestStatus,
} from './entities/service-request.entity';
import { User } from '../../modules/users/entities/user.entity';
import { Professional } from '../professionals/entities/professional.entity';
import { Category } from '../../api/categories/entities/category.entity';
import {
  CreateServiceDto,
  UpdateServiceDto,
  CreateServiceRequestDto,
  RespondServiceRequestDto,
  RateServiceDto,
} from './dto';

export interface ServiceFilters {
  status?: ServiceStatus;
  type?: ServiceType;
  categoryId?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  page?: number;
  limit?: number;
}

export interface ServiceStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  totalEarnings: number;
  averageRating: number;
}

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(ServiceRequest)
    private readonly serviceRequestRepository: Repository<ServiceRequest>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Professional)
    private readonly professionalRepository: Repository<Professional>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async createService(
    createServiceDto: CreateServiceDto,
    clientId: string,
  ): Promise<Service> {
    // Verificar que el usuario existe y es un cliente
    const client = await this.userRepository.findOne({
      where: { id: clientId },
    });
    if (!client) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar que la categoría existe
    if (createServiceDto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: createServiceDto.categoryId },
      });
      if (!category) {
        throw new NotFoundException('Categoría no encontrada');
      }
    }

    const service = this.serviceRepository.create({
      ...createServiceDto,
      clientId,
      status: ServiceStatus.PENDING,
    });

    return this.serviceRepository.save(service);
  }

  async getServices(
    filters: ServiceFilters,
  ): Promise<{ services: Service[]; total: number }> {
    const queryBuilder = this.serviceRepository
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.client', 'client')
      .leftJoinAndSelect('service.professional', 'professional')
      .leftJoinAndSelect('service.category', 'category');

    // Aplicar filtros
    if (filters.status) {
      queryBuilder.andWhere('service.status = :status', {
        status: filters.status,
      });
    }

    if (filters.type) {
      queryBuilder.andWhere('service.type = :type', { type: filters.type });
    }

    if (filters.categoryId) {
      queryBuilder.andWhere('service.categoryId = :categoryId', {
        categoryId: filters.categoryId,
      });
    }

    if (filters.latitude && filters.longitude && filters.radius) {
      // Filtro por distancia (aproximación simple)
      const latRange = filters.radius / 111; // 1 grado ≈ 111 km
      const lngRange =
        filters.radius / (111 * Math.cos((filters.latitude * Math.PI) / 180));

      queryBuilder.andWhere('service.latitude BETWEEN :minLat AND :maxLat', {
        minLat: filters.latitude - latRange,
        maxLat: filters.latitude + latRange,
      });
      queryBuilder.andWhere('service.longitude BETWEEN :minLng AND :maxLng', {
        minLng: filters.longitude - lngRange,
        maxLng: filters.longitude + lngRange,
      });
    }

    // Paginación
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    queryBuilder.orderBy('service.createdAt', 'DESC').skip(offset).take(limit);

    const [services, total] = await queryBuilder.getManyAndCount();

    return { services, total };
  }

  async getNearbyServices(
    latitude: number,
    longitude: number,
    radius: number = 10,
    categoryId?: string,
  ): Promise<Service[]> {
    const queryBuilder = this.serviceRepository
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.client', 'client')
      .leftJoinAndSelect('service.category', 'category')
      .where('service.status = :status', { status: ServiceStatus.PENDING });

    if (categoryId) {
      queryBuilder.andWhere('service.categoryId = :categoryId', { categoryId });
    }

    // Filtro por distancia
    const latRange = radius / 111;
    const lngRange = radius / (111 * Math.cos((latitude * Math.PI) / 180));

    queryBuilder
      .andWhere('service.latitude BETWEEN :minLat AND :maxLat', {
        minLat: latitude - latRange,
        maxLat: latitude + latRange,
      })
      .andWhere('service.longitude BETWEEN :minLng AND :maxLng', {
        minLng: longitude - lngRange,
        maxLng: longitude + lngRange,
      })
      .orderBy('service.createdAt', 'DESC')
      .take(50);

    return queryBuilder.getMany();
  }

  async getServiceById(id: string): Promise<Service> {
    const service = await this.serviceRepository.findOne({
      where: { id },
      relations: ['client', 'professional', 'category', 'requests'],
    });

    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }

    return service;
  }

  async updateService(
    id: string,
    updateServiceDto: UpdateServiceDto,
    userId: string,
  ): Promise<Service> {
    const service = await this.getServiceById(id);

    // Verificar permisos
    if (service.clientId !== userId && service.professionalId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para modificar este servicio',
      );
    }

    // Solo permitir actualizaciones en ciertos estados
    if (!service.canBeCancelled()) {
      throw new BadRequestException(
        'No se puede modificar un servicio en este estado',
      );
    }

    Object.assign(service, updateServiceDto);
    return this.serviceRepository.save(service);
  }

  async cancelService(
    id: string,
    reason: string,
    userId: string,
  ): Promise<Service> {
    const service = await this.getServiceById(id);

    // Verificar permisos
    if (service.clientId !== userId && service.professionalId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para cancelar este servicio',
      );
    }

    if (!service.canBeCancelled()) {
      throw new BadRequestException(
        'No se puede cancelar un servicio en este estado',
      );
    }

    service.status = ServiceStatus.CANCELLED;
    service.cancelledAt = new Date();
    service.cancellationReason = reason;

    return this.serviceRepository.save(service);
  }

  async acceptService(id: string, professionalId: string): Promise<Service> {
    const service = await this.getServiceById(id);

    if (!service.canBeAccepted()) {
      throw new BadRequestException(
        'El servicio no puede ser aceptado en este estado',
      );
    }

    // Verificar que el usuario es un profesional
    const professional = await this.professionalRepository.findOne({
      where: { id: professionalId },
    });

    if (!professional) {
      throw new ForbiddenException('Usuario no es un profesional');
    }

    service.status = ServiceStatus.ACCEPTED;
    service.professionalId = professionalId;

    return this.serviceRepository.save(service);
  }

  async startService(id: string, professionalId: string): Promise<Service> {
    const service = await this.getServiceById(id);

    if (service.professionalId !== professionalId) {
      throw new ForbiddenException(
        'Solo el profesional asignado puede iniciar el servicio',
      );
    }

    if (!service.canBeStarted()) {
      throw new BadRequestException(
        'El servicio no puede ser iniciado en este estado',
      );
    }

    service.status = ServiceStatus.IN_PROGRESS;
    service.startedAt = new Date();

    return this.serviceRepository.save(service);
  }

  async completeService(id: string, professionalId: string): Promise<Service> {
    const service = await this.getServiceById(id);

    if (service.professionalId !== professionalId) {
      throw new ForbiddenException(
        'Solo el profesional asignado puede completar el servicio',
      );
    }

    if (!service.canBeCompleted()) {
      throw new BadRequestException(
        'El servicio no puede ser completado en este estado',
      );
    }

    service.status = ServiceStatus.COMPLETED;
    service.completedAt = new Date();

    // Calcular horas reales si es por hora
    if (service.type === ServiceType.HOURLY && service.startedAt) {
      const duration =
        service.completedAt.getTime() - service.startedAt.getTime();
      service.actualHours = duration / (1000 * 60 * 60); // Convertir a horas
      service.finalAmount = service.actualHours * (service.hourlyRate || 0);
    }

    return this.serviceRepository.save(service);
  }

  async rateService(
    id: string,
    ratingDto: RateServiceDto,
    userId: string,
  ): Promise<Service> {
    const service = await this.getServiceById(id);

    if (service.status !== ServiceStatus.COMPLETED) {
      throw new BadRequestException(
        'Solo se pueden calificar servicios completados',
      );
    }

    // Verificar permisos
    if (service.clientId !== userId && service.professionalId !== userId) {
      throw new ForbiddenException(
        'No tienes permisos para calificar este servicio',
      );
    }

    // Aplicar calificación según el rol
    if (service.clientId === userId) {
      service.clientRating = ratingDto.rating;
      service.clientReview = ratingDto.review;
    } else {
      service.professionalRating = ratingDto.rating;
      service.professionalReview = ratingDto.review;
    }

    return this.serviceRepository.save(service);
  }

  async createServiceRequest(
    serviceId: string,
    requestDto: CreateServiceRequestDto,
    professionalId: string,
  ): Promise<ServiceRequest> {
    const service = await this.getServiceById(serviceId);

    if (service.status !== ServiceStatus.PENDING) {
      throw new BadRequestException(
        'Solo se pueden crear solicitudes para servicios pendientes',
      );
    }

    // Verificar que no existe ya una solicitud del mismo profesional
    const existingRequest = await this.serviceRequestRepository.findOne({
      where: { serviceId, professionalId },
    });

    if (existingRequest) {
      throw new BadRequestException(
        'Ya has enviado una solicitud para este servicio',
      );
    }

    const serviceRequest = this.serviceRequestRepository.create({
      ...requestDto,
      serviceId,
      professionalId,
      status: RequestStatus.PENDING,
    });

    return this.serviceRequestRepository.save(serviceRequest);
  }

  async getServiceRequests(serviceId: string): Promise<ServiceRequest[]> {
    return this.serviceRequestRepository.find({
      where: { serviceId },
      relations: ['professional'],
      order: { createdAt: 'DESC' },
    });
  }

  async respondToServiceRequest(
    serviceId: string,
    requestId: string,
    responseDto: RespondServiceRequestDto,
    userId: string,
  ): Promise<ServiceRequest> {
    const service = await this.getServiceById(serviceId);

    if (service.clientId !== userId) {
      throw new ForbiddenException(
        'Solo el cliente puede responder a las solicitudes',
      );
    }

    const serviceRequest = await this.serviceRequestRepository.findOne({
      where: { id: requestId, serviceId },
    });

    if (!serviceRequest) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    if (responseDto.status === RequestStatus.ACCEPTED) {
      // Aceptar la solicitud y el servicio
      serviceRequest.status = RequestStatus.ACCEPTED;
      service.status = ServiceStatus.ACCEPTED;
      service.professionalId = serviceRequest.professionalId;

      // Rechazar todas las demás solicitudes
      await this.serviceRequestRepository.update(
        { serviceId, status: RequestStatus.PENDING },
        {
          status: RequestStatus.REJECTED,
          rejectionReason: 'Otra solicitud fue aceptada',
        },
      );

      await this.serviceRepository.save(service);
    } else {
      serviceRequest.status = RequestStatus.REJECTED;
      serviceRequest.rejectionReason = responseDto.reason;
    }

    serviceRequest.respondedAt = new Date();
    return this.serviceRequestRepository.save(serviceRequest);
  }

  async getMyServices(
    userId: string,
    status?: ServiceStatus,
    role?: 'client' | 'professional',
  ): Promise<Service[]> {
    const queryBuilder = this.serviceRepository
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.client', 'client')
      .leftJoinAndSelect('service.professional', 'professional')
      .leftJoinAndSelect('service.category', 'category');

    if (role === 'client') {
      queryBuilder.where('service.clientId = :userId', { userId });
    } else if (role === 'professional') {
      queryBuilder.where('service.professionalId = :userId', { userId });
    } else {
      queryBuilder.where(
        'service.clientId = :userId OR service.professionalId = :userId',
        { userId },
      );
    }

    if (status) {
      queryBuilder.andWhere('service.status = :status', { status });
    }

    queryBuilder.orderBy('service.createdAt', 'DESC');

    return queryBuilder.getMany();
  }

  async getDashboardStats(userId: string): Promise<ServiceStats> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const isProfessional = await this.professionalRepository.findOne({
      where: { id: userId },
    });

    let servicesQuery = this.serviceRepository.createQueryBuilder('service');

    if (isProfessional) {
      servicesQuery = servicesQuery.where('service.professionalId = :userId', {
        userId,
      });
    } else {
      servicesQuery = servicesQuery.where('service.clientId = :userId', {
        userId,
      });
    }

    const [total, pending, inProgress, completed, cancelled] =
      await Promise.all([
        servicesQuery.getCount(),
        servicesQuery
          .andWhere('service.status = :status', {
            status: ServiceStatus.PENDING,
          })
          .getCount(),
        servicesQuery
          .andWhere('service.status = :status', {
            status: ServiceStatus.IN_PROGRESS,
          })
          .getCount(),
        servicesQuery
          .andWhere('service.status = :status', {
            status: ServiceStatus.COMPLETED,
          })
          .getCount(),
        servicesQuery
          .andWhere('service.status = :status', {
            status: ServiceStatus.CANCELLED,
          })
          .getCount(),
      ]);

    // Calcular ganancias totales (solo para profesionales)
    let totalEarnings = 0;
    if (isProfessional) {
      const earningsResult = await this.serviceRepository
        .createQueryBuilder('service')
        .select('SUM(service.finalAmount)', 'total')
        .where('service.professionalId = :userId', { userId })
        .andWhere('service.status = :status', {
          status: ServiceStatus.COMPLETED,
        })
        .getRawOne();

      totalEarnings = parseFloat(earningsResult?.total || '0');
    }

    // Calcular calificación promedio
    const ratingField = isProfessional ? 'professionalRating' : 'clientRating';
    const ratingResult = await this.serviceRepository
      .createQueryBuilder('service')
      .select(`AVG(service.${ratingField})`, 'average')
      .where(
        isProfessional
          ? 'service.professionalId = :userId'
          : 'service.clientId = :userId',
        { userId },
      )
      .andWhere(`service.${ratingField} IS NOT NULL`)
      .getRawOne();

    const averageRating = parseFloat(ratingResult?.average || '0');

    return {
      total,
      pending,
      inProgress,
      completed,
      cancelled,
      totalEarnings,
      averageRating,
    };
  }
}
