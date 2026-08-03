import {
  IsInt,
  IsNumber,
  IsOptional,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class FindNearbyQueryDTO {
  @ApiProperty({
    description: 'Latitud centro de búsqueda',
    example: -25.2637,
    minimum: -90,
    maximum: 90,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  readonly latitude!: number;

  @ApiProperty({
    description: 'Longitud centro de búsqueda',
    example: -57.5759,
    minimum: -180,
    maximum: 180,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  readonly longitude!: number;

  @ApiPropertyOptional({
    description: 'Radio máximo de búsqueda en kilómetros',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  readonly radius: number = 10;

  @ApiPropertyOptional({
    description: 'Filtrar por ID interno de categoría',
    example: 2,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly categoryId?: number;

  @ApiPropertyOptional({
    description: 'Número máximo de registros a retornar',
    example: 50,
    default: 50,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  readonly limit: number = 50;

  @ApiPropertyOptional({
    description: 'Filtrar solo profesionales con estado disponible habilitado',
    default: true,
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  readonly availableOnly: boolean = true;

  @ApiPropertyOptional({
    description: 'Filtrar solo profesionales conectados en tiempo real',
    default: true,
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  readonly onlineOnly: boolean = true;
}
