// src/api/tracking/dtos/request/get-nearby-professionals.request.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetNearbyProfessionalsRequestDTO {
  @ApiProperty({
    description: 'Latitud del centro de búsqueda (Cliente)',
    example: -25.2912,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty({
    description: 'Longitud del centro de búsqueda (Cliente)',
    example: -57.6225,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @ApiPropertyOptional({
    description: 'Radio de búsqueda personalizado en Kilómetros',
    example: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  radiusKm?: number;
}
