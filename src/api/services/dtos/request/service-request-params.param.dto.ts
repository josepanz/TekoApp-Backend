import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ServiceRequestParamsDTO {
  @ApiProperty({
    description: 'ID UUID del servicio',
    example: 'a63b5212-db5e-4ef5-9614-726614174000',
  })
  @IsUUID('4')
  id!: string;

  @ApiProperty({
    description: 'ID UUID de la solicitud',
    example: 'b72c6323-ec6f-5fg6-a725-837725285111',
  })
  @IsUUID('4')
  requestId!: string;
}
