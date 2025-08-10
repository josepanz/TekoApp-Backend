import { IsString, IsOptional, IsBoolean, IsInt, IsEnum, Min, Max, IsHexColor } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CategoryStatus } from '../entities/category.entity';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Nombre de la categoría',
    example: 'Electricista',
    maxLength: 100,
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Descripción de la categoría',
    example: 'Servicios de electricidad residencial e industrial',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Icono de la categoría (nombre del archivo o clase CSS)',
    example: 'fas fa-bolt',
    required: false,
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({
    description: 'Color hexadecimal de la categoría',
    example: '#FF6B35',
    required: false,
  })
  @IsOptional()
  @IsHexColor()
  color?: string;

  @ApiProperty({
    description: 'Orden de clasificación',
    example: 1,
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiProperty({
    description: 'Estado de la categoría',
    enum: CategoryStatus,
    example: CategoryStatus.ACTIVE,
    default: CategoryStatus.ACTIVE,
    required: false,
  })
  @IsOptional()
  @IsEnum(CategoryStatus)
  status?: CategoryStatus;

  @ApiProperty({
    description: 'Si la categoría es visible para los usuarios',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @ApiProperty({
    description: 'Si los profesionales de esta categoría requieren verificación especial',
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  requiresVerification?: boolean;

  @ApiProperty({
    description: 'ID de la categoría padre (para subcategorías)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsString()
  parentCategoryId?: string;

  @ApiProperty({
    description: 'Metadatos adicionales de la categoría',
    example: { minPrice: 20, maxPrice: 200, avgResponseTime: 15 },
    required: false,
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
