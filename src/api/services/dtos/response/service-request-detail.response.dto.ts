import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RequestStatus } from '@prisma/client';

export class ServiceRequestDetailResponseDTO {
  @ApiProperty({ example: 'b72c6323-ec6f-5fg6-a725-837725285111' })
  id!: string;

  @ApiProperty({ example: 'a63b5212-db5e-4ef5-9614-726614174000' })
  serviceId!: string;

  @ApiProperty({ example: 2 })
  professionalId!: number;

  @ApiProperty({ enum: RequestStatus, example: RequestStatus.PENDING })
  status!: RequestStatus;

  @ApiPropertyOptional({ example: 120000 })
  proposedPrice?: number | null;

  @ApiPropertyOptional({ example: 3.0 })
  proposedHours?: number | null;

  @ApiPropertyOptional({ example: 'Puedo atenderle esta tarde' })
  message?: string | null;

  @ApiProperty()
  createdAt!: Date;
}

export class ServiceRequestsListResponseDTO {
  @ApiProperty({
    description: 'Lista de solicitudes del servicio',
    type: [ServiceRequestDetailResponseDTO],
  })
  data!: ServiceRequestDetailResponseDTO[];
}
