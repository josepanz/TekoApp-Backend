import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateProfessionalDocumentTypeRequestDTO } from './create-professional-document-type.request.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateProfessionalDocumentTypeRequestDTO extends PartialType(
  CreateProfessionalDocumentTypeRequestDTO,
) {
  @ApiPropertyOptional({
    description:
      'Desactiva el tipo sin borrarlo — deja de aplicarse a profesionales nuevos',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
