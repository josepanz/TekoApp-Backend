import { IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLocationDto {
  @ApiProperty({
    description: 'Latitud de la ubicación actual',
    example: -25.2637,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({
    description: 'Longitud de la ubicación actual',
    example: -57.5759,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({
    description: 'Precisión de la ubicación en metros',
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  accuracy?: number;

  @ApiProperty({
    description: 'Velocidad del movimiento en m/s',
    example: 5.2,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  speed?: number;

  @ApiProperty({
    description: 'Dirección del movimiento en grados',
    example: 180,
    required: false,
    minimum: 0,
    maximum: 360,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(360)
  heading?: number;
}
