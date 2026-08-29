import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LegalDocumentType } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreateLegalDocumentVersionRequestDTO {
  @ApiProperty({
    description: 'Tipo de documento legal',
    enum: LegalDocumentType,
    example: LegalDocumentType.TERMS_OF_SERVICE,
  })
  @IsEnum(LegalDocumentType)
  documentType!: LegalDocumentType;

  @ApiPropertyOptional({
    description:
      'País al que aplica esta versión — omitir para una versión internacional/paraguas',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  countryId?: number;

  @ApiProperty({ description: 'Etiqueta de versión', example: '1.0.0' })
  @IsString()
  @MaxLength(20)
  version!: string;

  @ApiProperty({
    description: 'URL del texto legal real (fuera de alcance de esta feature)',
    example: 'https://tekoapp.com.py/legal/tos-1.0.0',
  })
  @IsUrl()
  @MaxLength(500)
  contentUrl!: string;

  @ApiProperty({
    description: 'Fecha de publicación',
    example: '2026-08-25T00:00:00.000Z',
  })
  @IsDateString()
  publishedAt!: string;

  @ApiPropertyOptional({
    description: 'Si la versión está activa (default true)',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
