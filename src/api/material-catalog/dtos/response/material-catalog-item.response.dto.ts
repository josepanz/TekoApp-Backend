import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MaterialQualityTier } from '@prisma/client';

export class MaterialCatalogItemResponseDTO {
  @ApiProperty({ description: 'referenceId (UUID) público' })
  referenceId!: string;

  @ApiProperty()
  categoryId!: number;

  @ApiPropertyOptional({ description: 'País — null si aplica a todos' })
  countryId!: number | null;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  unit!: string;

  @ApiProperty({ enum: MaterialQualityTier })
  qualityTier!: MaterialQualityTier;

  @ApiProperty({ description: 'Precio sugerido, no regulado' })
  defaultPrice!: number;

  @ApiProperty()
  isActive!: boolean;
}
