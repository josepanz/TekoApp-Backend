import { Injectable } from '@nestjs/common';
import { ServiceProgressEntries } from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';

@Injectable()
export class ServiceProgressDbService {
  constructor(private readonly prisma: PrismaDatasource) {}

  async findActiveByServiceId(
    serviceId: number,
  ): Promise<ServiceProgressEntries[]> {
    return this.prisma.extended.serviceProgressEntries.findMany({
      where: { serviceId, isActive: true },
      orderBy: { entryOrder: 'asc' },
    });
  }

  async countActiveByServiceId(serviceId: number): Promise<number> {
    return this.prisma.extended.serviceProgressEntries.count({
      where: { serviceId, isActive: true },
    });
  }

  /**
   * Siguiente `entryOrder` de la secuencia — se calcula sobre TODAS las entradas (activas e
   * inactivas) para que un soft-delete nunca reabra un hueco reusable en el orden.
   */
  async getNextEntryOrder(serviceId: number): Promise<number> {
    const last = await this.prisma.extended.serviceProgressEntries.findFirst({
      where: { serviceId },
      orderBy: { entryOrder: 'desc' },
      select: { entryOrder: true },
    });
    return (last?.entryOrder ?? 0) + 1;
  }

  async createEntry(data: {
    serviceId: number;
    professionalId: number;
    note?: string;
    images: string[];
    entryOrder: number;
    createdBy: string;
  }): Promise<ServiceProgressEntries> {
    return this.prisma.extended.serviceProgressEntries.create({ data });
  }

  async findEntryByReferenceId(
    referenceId: string,
  ): Promise<ServiceProgressEntries | null> {
    return this.prisma.extended.serviceProgressEntries.findUnique({
      where: { referenceId },
    });
  }

  async softDeleteEntry(
    id: number,
    changedBy: string,
  ): Promise<ServiceProgressEntries> {
    return this.prisma.extended.serviceProgressEntries.update({
      where: { id },
      data: { isActive: false, lastChangedBy: changedBy },
    });
  }
}
