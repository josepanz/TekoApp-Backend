import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsEnum,
  Min,
  IsHexColor,
  IsUUID,
  MaxLength,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryStatus } from '@prisma/client';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Nombre de la categoría',
    example: 'Plomería',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({
    description: 'Slug de la categoría, autogenerado si se omite',
    example: 'plomeria',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  slug?: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada',
    example: 'Servicios de reparación e instalaciones sanitarias',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Nombre del icono o clase para renderizado',
    example: 'wrench-outline',
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({
    description: 'Color identificador en formato hexadecimal',
    example: '#2ecc71',
  })
  @IsOptional()
  @IsHexColor()
  color?: string;

  @ApiPropertyOptional({
    description: 'Posición de ordenamiento en las consultas',
    default: 0,
    example: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'Estado inicial en el sistema',
    enum: CategoryStatus,
    default: CategoryStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(CategoryStatus)
  status?: CategoryStatus;

  @ApiPropertyOptional({
    description: 'Indica si es visible en los buscadores de cara al cliente',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @ApiPropertyOptional({
    description: 'Determina si exige acreditación de títulos/certificados',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  requiresVerification?: boolean;

  @ApiPropertyOptional({
    description: 'UUID de la categoría padre si actúa como subcategoría',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  parentCategoryId?: number;

  @ApiPropertyOptional({
    description:
      'Estructura libre JSONb para configurar parámetros dinámicos de frontera',
    example: { taxRate: 10, minFee: 50000 },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
