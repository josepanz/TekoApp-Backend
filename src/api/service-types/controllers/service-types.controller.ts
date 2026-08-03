import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ServiceTypesService } from '../services/service-types.service';
import { ServiceTypeResponseDTO } from '../dtos/response/service-type.response.dto';

@ApiTags('Service Types')
@Controller('service-types')
export class ServiceTypesController {
  constructor(private readonly serviceTypesService: ServiceTypesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar tipos de servicio activos' })
  @ApiResponse({ status: 200, type: [ServiceTypeResponseDTO] })
  async findAll(): Promise<ServiceTypeResponseDTO[]> {
    return this.serviceTypesService.findAll();
  }
}
