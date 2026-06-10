import { IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CalculateDistanceQueryDTO {
  @ApiProperty({
    description: 'Latitud del Punto A',
    example: -25.2637,
    minimum: -90,
    maximum: 90,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  readonly lat1!: number;

  @ApiProperty({
    description: 'Longitud del Punto A',
    example: -57.5759,
    minimum: -180,
    maximum: 180,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  readonly lng1!: number;

  @ApiProperty({
    description: 'Latitud del Punto B',
    example: -25.2844,
    minimum: -90,
    maximum: 90,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  readonly lat2!: number;

  @ApiProperty({
    description: 'Longitud del Punto B',
    example: -57.6112,
    minimum: -180,
    maximum: 180,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  readonly lng2!: number;
}
