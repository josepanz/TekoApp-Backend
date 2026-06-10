// src/api/tracking/dtos/request/update-location.request.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsUUID, IsOptional, Max, Min } from 'class-validator';

export class UpdateLocationRequestDTO {
  @ApiProperty({
    description: 'ID numérico del profesional en Postgres',
    example: 125,
  })
  @IsNumber()
  professionalId!: number;

  @ApiProperty({
    description: 'UUID del servicio activo en Postgres',
    example: 'f3bca852-1243-4c91-949e-b98d1a49f512',
  })
  @IsUUID()
  serviceId!: string;

  @ApiProperty({ description: 'Latitud geográfica', example: -25.2866 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty({ description: 'Longitud geográfica', example: -57.6181 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @ApiProperty({
    description: 'Dirección o rumbo en grados (0-360)',
    example: 180,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(360)
  heading?: number;

  @ApiProperty({
    description: 'Velocidad estimada del proveedor',
    example: 45.5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  speed?: number;
}
