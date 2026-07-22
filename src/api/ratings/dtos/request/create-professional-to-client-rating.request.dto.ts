import {
  IsNumber,
  IsString,
  IsOptional,
  IsBoolean,
  IsUUID,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { RatingCriteriaRequestDTO } from './create-rating.request.dto';

export class CreateProfessionalToClientRatingRequestDTO {
  @ApiProperty({
    description: 'referenceId (UUID) del cliente calificado',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID()
  clientId!: string;

  @ApiProperty({
    description: 'ID de la solicitud de servicio',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  serviceRequestId!: string;

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
    description: 'Comentario sobre el cliente',
    example: 'Cliente puntual y claro con los requerimientos',
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
}
