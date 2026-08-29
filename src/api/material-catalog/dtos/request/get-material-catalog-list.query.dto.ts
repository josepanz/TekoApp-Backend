import { ApiPropertyOptional } from '@nestjs/swagger';
import { MaterialQualityTier } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional } from 'class-validator';
import { PaginatedRequest } from '@common/dtos/request-with-pagination.dto';

export class GetMaterialCatalogListQueryDTO extends PaginatedRequest<GetMaterialCatalogListQueryDTO> {
  @ApiPropertyOptional({ description: 'Filtrar por categoría de servicio' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;

  @ApiPropertyOptional({ description: 'Filtrar por país (id interno)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  countryId?: number;

  @ApiPropertyOptional({ enum: MaterialQualityTier })
  @IsOptional()
  @IsEnum(MaterialQualityTier)
  qualityTier?: MaterialQualityTier;

  @ApiPropertyOptional({
    description: 'Omitir = todos (activos e inactivos)',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
