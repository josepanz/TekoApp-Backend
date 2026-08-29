import { ApiPropertyOptional } from '@nestjs/swagger';
import { LegalDocumentType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional } from 'class-validator';

export class GetLegalDocumentVersionsQueryDTO {
  @ApiPropertyOptional({ enum: LegalDocumentType })
  @IsOptional()
  @IsEnum(LegalDocumentType)
  documentType?: LegalDocumentType;

  @ApiPropertyOptional({ description: 'Filtrar por país (id interno)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  countryId?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por versiones activas/inactivas',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
