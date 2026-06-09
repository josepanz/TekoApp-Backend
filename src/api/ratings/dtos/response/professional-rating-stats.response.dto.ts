import { ApiProperty } from '@nestjs/swagger';

export class RatingDistributionResponseDTO {
  @ApiProperty({
    description: 'Número de calificaciones de 1 estrella',
    example: 2,
  })
  '1'!: number;

  @ApiProperty({
    description: 'Número de calificaciones de 2 estrellas',
    example: 5,
  })
  '2'!: number;

  @ApiProperty({
    description: 'Número de calificaciones de 3 estrellas',
    example: 12,
  })
  '3'!: number;

  @ApiProperty({
    description: 'Número de calificaciones de 4 estrellas',
    example: 25,
  })
  '4'!: number;

  @ApiProperty({
    description: 'Número de calificaciones de 5 estrellas',
    example: 56,
  })
  '5'!: number;
}

export class AverageCriteriaResponseDTO {
  @ApiProperty({
    description: 'Calificación promedio de puntualidad',
    example: 4.2,
    required: false,
  })
  punctuality?: number;

  @ApiProperty({
    description: 'Calificación promedio de calidad',
    example: 4.5,
    required: false,
  })
  quality?: number;

  @ApiProperty({
    description: 'Calificación promedio de comunicación',
    example: 4.0,
    required: false,
  })
  communication?: number;

  @ApiProperty({
    description: 'Calificación promedio de limpieza',
    example: 4.3,
    required: false,
  })
  cleanliness?: number;

  @ApiProperty({
    description: 'Calificación promedio de relación calidad-precio',
    example: 4.1,
    required: false,
  })
  value?: number;
}

export class ProfessionalRatingStatsResponseDTO {
  @ApiProperty({ description: 'Calificación promedio general', example: 4.3 })
  averageRating!: number;

  @ApiProperty({ description: 'Número total de calificaciones', example: 100 })
  totalRatings!: number;

  @ApiProperty({
    description: 'Distribución de calificaciones por estrellas',
    type: RatingDistributionResponseDTO,
  })
  ratingDistribution!: RatingDistributionResponseDTO;

  @ApiProperty({
    description: 'Calificaciones promedio por criterios específicos',
    type: AverageCriteriaResponseDTO,
  })
  averageCriteria!: AverageCriteriaResponseDTO;
}
