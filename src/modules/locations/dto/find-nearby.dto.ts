import { IsNumber, IsOptional, IsUUID, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class FindNearbyDto {
  @ApiProperty({
    description: 'Latitud de la ubicación de búsqueda',
    example: -25.2637,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({
    description: 'Longitud de la ubicación de búsqueda',
    example: -57.5759,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({
    description: 'Radio de búsqueda en kilómetros',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 50,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  @Transform(({ value }) => parseFloat(value))
  radius?: number = 10;

  @ApiProperty({
    description: 'ID de la categoría de servicio',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({
    description: 'Número máximo de resultados',
    example: 50,
    default: 50,
    minimum: 1,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value))
  limit?: number = 50;

  @ApiProperty({
    description: 'Filtrar solo profesionales disponibles',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  availableOnly?: boolean = true;

  @ApiProperty({
    description: 'Filtrar solo profesionales en línea',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  onlineOnly?: boolean = true;
}
