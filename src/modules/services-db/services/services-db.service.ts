import { Injectable } from '@nestjs/common';
import { Prisma, ServiceStatus, RequestStatus } from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';

@Injectable()
export class ServicesDbService {
  constructor(private readonly prisma: PrismaDatasource) {}

  // ─── Category ───────────────────────────────────────────────────────────────

  async findCategoryById(id: number) {
    return this.prisma.extended.category.findUnique({ where: { id } });
  }

  // ─── Services ───────────────────────────────────────────────────────────────

  async createService(data: Prisma.ServicesUncheckedCreateInput) {
    return this.prisma.extended.services.create({ data });
  }

  async findManyWithCount(
    where: Prisma.ServicesWhereInput,
    page: number,
    pageSize: number,
  ) {
    return Promise.all([
      this.prisma.extended.services.findMany({
        where,
        include: { users: true, professional: true, category: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.extended.services.count({ where }),
    ]);
  }

  async findNearby(where: Prisma.ServicesWhereInput) {
    return this.prisma.extended.services.findMany({
      where,
      include: { users: true, category: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async findServiceById(id: string) {
    return this.prisma.extended.services.findUnique({
      where: { id },
      include: {
        users: true,
        professional: true,
        category: true,
        requests: true,
      },
    });
  }

  async updateService(id: string, data: Prisma.ServicesUncheckedUpdateInput) {
    return this.prisma.extended.services.update({
      where: { id },
      data: data,
    });
  }

  async findMyServices(where: Prisma.ServicesWhereInput) {
    return this.prisma.extended.services.findMany({
      where,
      include: { users: true, professional: true, category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Professionals ──────────────────────────────────────────────────────────

  async findProfessionalById(id: number) {
    return this.prisma.extended.professionals.findUnique({ where: { id } });
  }

  async findProfessionalByUserId(userId: number) {
    return this.prisma.extended.professionals.findUnique({ where: { userId } });
  }

  // ─── Users ──────────────────────────────────────────────────────────────────

  async findUserById(id: number) {
    return this.prisma.extended.users.findUnique({ where: { id } });
  }

  // ─── Service stats ──────────────────────────────────────────────────────────

  async countServices(where: Prisma.ServicesWhereInput) {
    return this.prisma.extended.services.count({ where });
  }

  async aggregateEarnings(professionalId: number) {
    return this.prisma.extended.services.aggregate({
      where: { professionalId, status: ServiceStatus.COMPLETED },
      _sum: { finalAmount: true },
    });
  }

  // ─── Service requests ───────────────────────────────────────────────────────

  async findDuplicateRequest(serviceId: string, professionalId: number) {
    return this.prisma.extended.serviceRequests.findFirst({
      where: { serviceId, professionalId },
    });
  }

  async createServiceRequest(data: Prisma.ServiceRequestsUncheckedCreateInput) {
    return this.prisma.extended.serviceRequests.create({ data });
  }

  async findServiceRequests(serviceId: string) {
    return this.prisma.extended.serviceRequests.findMany({
      where: { serviceId },
      include: { professional: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findServiceRequest(id: string, serviceId: string) {
    return this.prisma.extended.serviceRequests.findFirst({
      where: { id, serviceId },
    });
  }

  async findServiceRequestById(id: string) {
    return this.prisma.extended.serviceRequests.findUnique({ where: { id } });
  }

  async updateServiceRequest(
    id: string,
    data: Prisma.ServiceRequestsUpdateInput,
  ) {
    return this.prisma.extended.serviceRequests.update({
      where: { id },
      data,
    });
  }

  async acceptRequestTransaction(
    requestId: string,
    serviceId: string,
    professionalId: number,
  ): Promise<void> {
    await this.prisma.extended.$transaction([
      this.prisma.extended.serviceRequests.update({
        where: { id: requestId },
        data: { status: RequestStatus.ACCEPTED },
      }),
      this.prisma.extended.services.update({
        where: { id: serviceId },
        data: { status: ServiceStatus.ACCEPTED, professionalId },
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
  }
}
