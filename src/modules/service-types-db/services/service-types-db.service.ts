import { Injectable } from '@nestjs/common';
import { ServiceType } from '@prisma/client';
import { PrismaDatasource } from '@core/database/services/prisma.service';

@Injectable()
export class ServiceTypesDbService {
  constructor(private readonly prisma: PrismaDatasource) {}

  async findAllActive(): Promise<ServiceType[]> {
    return this.prisma.extended.serviceType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }
}
