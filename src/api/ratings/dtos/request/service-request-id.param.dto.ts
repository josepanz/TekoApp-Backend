import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ServiceRequestIdParamDTO {
  @ApiProperty({
    description: 'ID UUID de la solicitud de servicio',
    example: 'b72c6323-ec6f-5fg6-a725-837725285111',
  })
  @IsUUID('4')
  serviceRequestId!: string;
}
