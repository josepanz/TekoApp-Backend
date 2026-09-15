import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProfessionalReferenceParamDTO {
  @ApiProperty({ description: 'referenceId (UUID) del profesional' })
  @IsUUID('4')
  referenceId!: string;
}
