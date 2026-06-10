import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsInt,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServiceRequestDTO {
  @ApiProperty({ description: 'Título del servicio' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ description: 'Descripción detallada del servicio' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ description: 'ID de la categoría del servicio (Int)' })
  @IsInt()
  categoryId!: number;

  @ApiProperty({ description: 'ID del tipo de servicio (Int)' })
  @IsInt()
  serviceTypeId!: number;

  @ApiPropertyOptional({
    description: 'Horas estimadas (para servicios por hora)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(24)
  estimatedHours?: number;

  @ApiPropertyOptional({ description: 'Tarifa por hora' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @ApiPropertyOptional({ description: 'Precio fijo' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fixedPrice?: number;

  @ApiProperty({ description: 'Latitud de la ubicación del servicio' })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty({ description: 'Longitud de la ubicación del servicio' })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @ApiProperty({ description: 'Dirección del servicio' })
  @IsString()
  @IsNotEmpty()
  address!: string;

  @ApiPropertyOptional({ description: 'Notas adicionales' })
  @IsOptional()
  @IsString()
  additionalNotes?: string;

  @ApiPropertyOptional({
    description: 'URLs de imágenes del servicio',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ description: 'Indica si el servicio es urgente' })
  @IsOptional()
  @IsBoolean()
  isUrgent?: boolean;

  @ApiPropertyOptional({
    description: 'Fecha y hora programada para el servicio',
  })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}
