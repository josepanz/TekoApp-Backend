import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedResponse } from '@common/dtos/response-with-pagination.dto';
import { PaginationResponseDTO } from '@common/dtos/pagination.dto';
import { ServiceStatus } from '@prisma/client';

export class ServiceSummaryResponseDTO {
  @ApiProperty({ example: 'uuid-string' })
  id!: string;

  @ApiProperty({ example: 'Instalación de tuberías' })
  title!: string;

  @ApiProperty({ example: 'Reparación completa del sistema de agua' })
  description!: string;

  @ApiProperty({ enum: ServiceStatus, example: ServiceStatus.COMPLETED })
  status!: ServiceStatus;

  @ApiPropertyOptional({ example: 150000 })
  totalAmount?: number | null;

  @ApiPropertyOptional({ example: 145000 })
  finalAmount?: number | null;

  @ApiPropertyOptional()
  scheduledAt?: Date | null;

  @ApiProperty()
  createdAt!: Date;
}

export class ProfessionalServicesListResponseDTO extends PaginatedResponse<ServiceSummaryResponseDTO> {
  @ApiProperty({ type: [ServiceSummaryResponseDTO] })
  declare data: ServiceSummaryResponseDTO[];

  @ApiProperty({ type: PaginationResponseDTO })
  declare pagination: PaginationResponseDTO;
}
