import { IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class GetProfessionalsAreaQueryDTO {
  @ApiProperty({
    description: 'Latitud mínima del cuadrante (Bounding Box)',
    example: -25.3,
    minimum: -90,
    maximum: 90,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  readonly minLat!: number;

  @ApiProperty({
    description: 'Latitud máxima del cuadrante (Bounding Box)',
    example: -25.2,
    minimum: -90,
    maximum: 90,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  readonly maxLat!: number;

  @ApiProperty({
    description: 'Longitud mínima del cuadrante (Bounding Box)',
    example: -57.6,
    minimum: -180,
    maximum: 180,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  readonly minLng!: number;

  @ApiProperty({
    description: 'Longitud máxima del cuadrante (Bounding Box)',
    example: -57.5,
    minimum: -180,
    maximum: 180,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  readonly maxLng!: number;
}
