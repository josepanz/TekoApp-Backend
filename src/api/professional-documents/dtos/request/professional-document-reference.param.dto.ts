import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProfessionalDocumentReferenceParamDTO {
  @ApiProperty({ description: 'referenceId (UUID) del documento cargado' })
  @IsUUID('4')
  referenceId!: string;
}
