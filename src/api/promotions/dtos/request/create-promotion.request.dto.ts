import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsDateString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  Min,
} from 'class-validator';
import { PromotionType } from '@prisma/client';

export class CreatePromotionRequestDTO {
  @ApiProperty({
    description: 'Código único de la promoción',
    example: 'PROMO2025',
  })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({
    description: 'Nombre descriptivo de la promoción',
    example: 'Descuento de verano',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada',
    example: '20% de descuento en todos los servicios',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Tipo de descuento',
    enum: PromotionType,
    example: PromotionType.PERCENTAGE,
  })
  @IsEnum(PromotionType)
  type!: PromotionType;

  @ApiProperty({
    description: 'Valor del descuento (porcentaje o monto fijo)',
    example: 20,
  })
  @IsNumber()
  @Min(0)
  discountValue!: number;

  @ApiPropertyOptional({
    description: 'Monto mínimo del servicio para aplicar la promoción',
    example: 50000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumAmount?: number;

  @ApiPropertyOptional({
    description: 'Descuento máximo permitido (para tipo PERCENTAGE)',
    example: 100000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maximumDiscount?: number;

  @ApiPropertyOptional({
    description: 'Cantidad máxima de usos totales (-1 = ilimitado)',
    example: 100,
  })
  @IsOptional()
  @IsNumber()
  maxUsage?: number;

  @ApiPropertyOptional({
    description: 'Cantidad máxima de usos por usuario',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUsagePerUser?: number;

  @ApiProperty({
    description: 'Fecha de inicio de vigencia (ISO 8601)',
    example: '2025-01-01T00:00:00Z',
  })
  @IsDateString()
  validFrom!: string;

  @ApiProperty({
    description: 'Fecha de fin de vigencia (ISO 8601)',
    example: '2025-12-31T23:59:59Z',
  })
  @IsDateString()
  validUntil!: string;

  @ApiPropertyOptional({
    description: 'Categorías de servicio aplicables',
    example: ['plomeria', 'electricidad'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableCategories?: string[];

  @ApiPropertyOptional({
    description: 'IDs de servicios específicos aplicables',
    example: ['uuid-1', 'uuid-2'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableServices?: string[];

  @ApiPropertyOptional({
    description: 'Solo para el primer uso del usuario',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isFirstTimeOnly?: boolean;

  @ApiPropertyOptional({
    description: 'Solo para profesionales',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isProfessionalOnly?: boolean;

  @ApiPropertyOptional({ description: 'Solo para clientes', example: true })
  @IsOptional()
  @IsBoolean()
  isClientOnly?: boolean;
}
