import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProfessionalDocumentTypeReferenceParamDTO {
  @ApiProperty({ description: 'referenceId (UUID) del tipo de documento' })
  @IsUUID('4')
  referenceId!: string;
}
