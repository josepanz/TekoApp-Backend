import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentCategory } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProfessionalDocumentTypeRequestDTO {
  @ApiProperty({ example: 'BG_CHECK_CRIMINAL_PY' })
  @IsString()
  @MaxLength(60)
  code!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: DocumentCategory })
  @IsEnum(DocumentCategory)
  category!: DocumentCategory;

  @ApiPropertyOptional({
    description:
      'null = aplica a todos los países (hoy es siempre el caso real)',
  })
  @IsOptional()
  @IsInt()
  countryId?: number;

  @ApiPropertyOptional({
    description: 'null = aplica a todas las categorías de servicio',
  })
  @IsOptional()
  @IsInt()
  professionalCategoryId?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({ description: 'null = no vence' })
  @IsOptional()
  @IsInt()
  @Min(1)
  validityDays?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  requiresStaffReview?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isVisibleToClient?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
