import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class CreateProfessionalDocumentRequestDTO {
  @ApiProperty({
    description:
      'referenceId (UUID) del ProfessionalDocumentTypes del catálogo — nunca el id interno, ' +
      'ver .claude/rules/database-conventions.md',
  })
  @IsUUID('4')
  professionalDocumentTypeReferenceId!: string;

  @ApiPropertyOptional({
    description: 'Fecha de emisión declarada del documento',
  })
  @IsOptional()
  @IsDateString()
  issuedAt?: string;
}
