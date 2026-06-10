import { IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateLocationRequestDTO {
  @ApiProperty({
    description: 'Latitud de la ubicación actual',
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
    description: 'Longitud de la ubicación actual',
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
    description: 'Precisión de la ubicación en metros',
    example: 10,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  readonly accuracy?: number;

  @ApiPropertyOptional({
    description: 'Velocidad del movimiento en m/s',
    example: 5.2,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  readonly speed?: number;

  @ApiPropertyOptional({
    description: 'Dirección del movimiento en grados',
    example: 180,
    minimum: 0,
    maximum: 360,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(360)
  readonly heading?: number;
}
