import { Injectable } from '@nestjs/common';
import { ServiceTypesDbService } from '@modules/service-types-db/services/service-types-db.service';
import { ServiceTypeResponseDTO } from '../dtos/response/service-type.response.dto';

@Injectable()
export class ServiceTypesService {
  constructor(private readonly db: ServiceTypesDbService) {}

  async findAll(): Promise<ServiceTypeResponseDTO[]> {
    const result = await this.db.findAllActive();
    return result;
  }
}
