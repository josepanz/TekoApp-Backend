import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MaterialQualityTier } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateMaterialCatalogItemRequestDTO {
  @ApiProperty({ description: 'Categoría de servicio a la que aplica' })
  @IsInt()
  categoryId!: number;

  @ApiPropertyOptional({
    description: 'País — omitir para que aplique a todos los países',
  })
  @IsOptional()
  @IsInt()
  countryId?: number;

  @ApiProperty({ example: 'Cerámica esmaltada 30x30' })
  @IsString()
  @MaxLength(150)
  name!: string;

  @ApiProperty({ example: 'm2' })
  @IsString()
  @MaxLength(30)
  unit!: string;

  @ApiProperty({ enum: MaterialQualityTier })
  @IsEnum(MaterialQualityTier)
  qualityTier!: MaterialQualityTier;

  @ApiProperty({
    description: 'Precio SUGERIDO — no es un precio regulado ni fijo',
    example: 45000,
  })
  @IsNumber()
  @Min(0)
  defaultPrice!: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
