import { ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentCategory } from '@prisma/client';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class GetProfessionalDocumentTypesListQueryDTO {
  @ApiPropertyOptional({
    description:
      'Filtrar por país — hoy siempre devuelve solo catálogo global (countryId null)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  countryId?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por categoría de servicio del profesional',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  professionalCategoryId?: number;

  @ApiPropertyOptional({ enum: DocumentCategory })
  @IsOptional()
  @IsEnum(DocumentCategory)
  category?: DocumentCategory;
}
