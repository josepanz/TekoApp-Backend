import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProfessionalReferenceIdParamDTO {
  @ApiProperty({
    description: 'Reference ID (UUID) público del profesional',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID()
  referenceId!: string;
}
