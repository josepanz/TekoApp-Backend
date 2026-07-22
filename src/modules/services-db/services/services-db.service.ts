import { Injectable } from '@nestjs/common';
import { Prisma, ServiceStatus, RequestStatus } from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';

// Include que trae el `referenceId` (UUID público) del servicio padre para poder exponerlo
// en las respuestas de solicitudes sin filtrar el `id` interno (Int).
const serviceRefInclude = {
  service: { select: { referenceId: true } },
} satisfies Prisma.ServiceRequestsInclude;

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
        include: {
          users: true,
          professional: { include: { user: true } },
          category: true,
        },
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

  /** Busca un servicio por su PK interna (Int). Uso interno tras resolver el referenceId. */
  async findServiceById(id: number) {
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

  /** Busca un servicio por su referenceId (UUID público recibido en la URL). */
  async findServiceByReferenceId(referenceId: string) {
    return this.prisma.extended.services.findUnique({
      where: { referenceId },
      include: {
        users: true,
        professional: true,
        category: true,
        requests: true,
      },
    });
  }

  async updateService(id: number, data: Prisma.ServicesUncheckedUpdateInput) {
    return this.prisma.extended.services.update({
      where: { id },
      data: data,
    });
  }

  /**
   * Actualiza el servicio solo si su estado actual está entre `expectedStatuses` — evita
   * condiciones de carrera entre dos transiciones concurrentes (ej. aceptar + cancelar el mismo
   * servicio al mismo tiempo). Devuelve la cantidad de filas afectadas: 0 significa que el
   * estado cambió entre la lectura de validación y esta escritura.
   */
  async updateServiceConditional(
    id: number,
    expectedStatuses: ServiceStatus[],
    data: Prisma.ServicesUncheckedUpdateInput,
  ): Promise<number> {
    const result = await this.prisma.extended.services.updateMany({
      where: { id, status: { in: expectedStatuses } },
      data,
    });
    return result.count;
  }

  async findMyServices(where: Prisma.ServicesWhereInput) {
    return this.prisma.extended.services.findMany({
      where,
      include: {
        users: true,
        professional: { include: { user: true } },
        category: true,
      },
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

  async findDuplicateRequest(serviceId: number, professionalId: number) {
    return this.prisma.extended.serviceRequests.findFirst({
      where: { serviceId, professionalId },
    });
  }

  async createServiceRequest(data: Prisma.ServiceRequestsUncheckedCreateInput) {
    return this.prisma.extended.serviceRequests.create({
      data,
      include: serviceRefInclude,
    });
  }

  async findServiceRequests(serviceId: number) {
    return this.prisma.extended.serviceRequests.findMany({
      where: { serviceId },
      include: { professional: true, ...serviceRefInclude },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Busca una solicitud por su referenceId (UUID) validando que pertenezca al servicio dado. */
  async findServiceRequestByReferenceId(
    referenceId: string,
    serviceId: number,
  ) {
    return this.prisma.extended.serviceRequests.findFirst({
      where: { referenceId, serviceId },
    });
  }

  async findServiceRequestById(id: number) {
    return this.prisma.extended.serviceRequests.findUnique({
      where: { id },
      include: serviceRefInclude,
    });
  }

  async updateServiceRequest(
    id: number,
    data: Prisma.ServiceRequestsUpdateInput,
  ) {
    return this.prisma.extended.serviceRequests.update({
      where: { id },
      data,
      include: serviceRefInclude,
    });
  }

  /**
   * Acepta una solicitud de servicio de forma atómica: el `services.updateMany` con `where:
   * { status: PENDING }` es la guarda contra la carrera (dos solicitudes aceptadas para el mismo
   * servicio, o un cliente cancelando mientras se acepta una solicitud). Si el servicio ya no
   * está PENDING, no se acepta nada y se devuelve 0 — el caller decide qué hacer (antes esto era
   * un `$transaction([...])` de array, que siempre escribía sin chequear el estado del servicio).
   */
  async acceptRequestTransaction(
    requestId: number,
    serviceId: number,
    professionalId: number,
  ): Promise<number> {
    return this.prisma.extended.$transaction(async (tx) => {
      const serviceUpdateResult = await tx.services.updateMany({
        where: { id: serviceId, status: ServiceStatus.PENDING },
        data: { status: ServiceStatus.ACCEPTED, professionalId },
      });
      if (serviceUpdateResult.count === 0) {
        return 0;
      }

      await tx.serviceRequests.update({
        where: { id: requestId },
        data: { status: RequestStatus.ACCEPTED },
      });
      await tx.serviceRequests.updateMany({
        where: {
          serviceId,
          status: RequestStatus.PENDING,
          id: { not: requestId },
        },
        data: { status: RequestStatus.REJECTED },
      });

      return serviceUpdateResult.count;
    });
  }
}
