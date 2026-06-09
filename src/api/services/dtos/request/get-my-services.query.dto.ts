import { IsEnum, IsIn, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceStatus } from '@prisma/client';

export class GetMyServicesQueryDTO {
  @ApiPropertyOptional({
    description: 'Filtrar por estado del servicio',
    enum: ServiceStatus,
  })
  @IsOptional()
  @IsEnum(ServiceStatus)
  status?: ServiceStatus;

  @ApiPropertyOptional({
    description: 'Rol del usuario en el servicio',
    enum: ['client', 'professional'],
  })
  @IsOptional()
  @IsIn(['client', 'professional'])
  role?: 'client' | 'professional';
}
