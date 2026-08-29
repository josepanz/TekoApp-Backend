import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ServiceProgressServiceIdParamDTO {
  @ApiProperty({
    description: 'referenceId (UUID) del servicio',
    example: 'a63b5212-db5e-4ef5-9614-726614174000',
  })
  @IsUUID('4')
  id!: string;
}
