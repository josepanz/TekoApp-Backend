import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceStatus } from '@prisma/client';
import { PaginatedRequest } from '@common/dtos/request-with-pagination.dto';

export class GetProfessionalServicesQueryDTO extends PaginatedRequest<GetProfessionalServicesQueryDTO> {
  @ApiPropertyOptional({
    description: 'Filtrar por estado del servicio',
    enum: ServiceStatus,
  })
  @IsOptional()
  @IsEnum(ServiceStatus)
  status?: ServiceStatus;
}
