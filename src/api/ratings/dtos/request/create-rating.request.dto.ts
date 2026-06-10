import {
  IsNumber,
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  Min,
  Max,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { RatingType } from '@prisma/client';

export class RatingCriteriaRequestDTO {
  @ApiPropertyOptional({
    description: 'Calificación de puntualidad (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  punctuality?: number;

  @ApiPropertyOptional({
    description: 'Calificación de calidad del trabajo (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  quality?: number;

  @ApiPropertyOptional({
    description: 'Calificación de comunicación (1-5)',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  communication?: number;

  @ApiPropertyOptional({
    description: 'Calificación de limpieza (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  cleanliness?: number;

  @ApiPropertyOptional({
    description: 'Calificación de relación calidad-precio (1-5)',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  value?: number;
}

export class CreateRatingRequestDTO {
  @ApiProperty({
    description: 'ID del profesional calificado',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  professionalId!: string;

  @ApiProperty({
    description: 'ID de la solicitud de servicio',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  serviceRequestId!: string;

  @ApiProperty({
    description: 'Tipo de calificación',
    enum: RatingType,
    example: RatingType.CLIENT_TO_PROFESSIONAL,
  })
  @IsEnum(RatingType)
  type!: RatingType;

  @ApiProperty({
    description: 'Calificación general (1-5 estrellas)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiPropertyOptional({
    description: 'Comentario sobre el servicio',
    example: 'Excelente trabajo, muy profesional y puntual',
  })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({
    description: 'Calificaciones por criterios específicos',
    type: RatingCriteriaRequestDTO,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => RatingCriteriaRequestDTO)
  criteria?: RatingCriteriaRequestDTO;

  @ApiPropertyOptional({
    description: 'Si la calificación es anónima',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  @ApiPropertyOptional({
    description: 'Metadatos adicionales',
    example: { platform: 'mobile', appVersion: '1.2.0' },
  })
  @IsOptional()
  metadata?: Record<string, unknown>;
}
