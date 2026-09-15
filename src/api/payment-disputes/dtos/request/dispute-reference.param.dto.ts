import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class DisputeReferenceParamDTO {
  @ApiProperty({ description: 'referenceId (UUID) de la disputa' })
  @IsUUID('4')
  referenceId!: string;
}
