import { ApiProperty } from '@nestjs/swagger';

export class RatingDistributionDto {
  @ApiProperty({
    description: 'Número de calificaciones de 1 estrella',
    example: 2,
  })
  '1': number;

  @ApiProperty({
    description: 'Número de calificaciones de 2 estrellas',
    example: 5,
  })
  '2': number;

  @ApiProperty({
    description: 'Número de calificaciones de 3 estrellas',
    example: 12,
  })
  '3': number;

  @ApiProperty({
    description: 'Número de calificaciones de 4 estrellas',
    example: 25,
  })
  '4': number;

  @ApiProperty({
    description: 'Número de calificaciones de 5 estrellas',
    example: 56,
  })
  '5': number;
}

export class AverageCriteriaDto {
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

export class ProfessionalRatingStatsDto {
  @ApiProperty({
    description: 'Calificación promedio general',
    example: 4.3,
  })
  averageRating: number;

  @ApiProperty({
    description: 'Número total de calificaciones',
    example: 100,
  })
  totalRatings: number;

  @ApiProperty({
    description: 'Distribución de calificaciones por estrellas',
    type: RatingDistributionDto,
  })
  ratingDistribution: RatingDistributionDto;

  @ApiProperty({
    description: 'Calificaciones promedio por criterios específicos',
    type: AverageCriteriaDto,
  })
  averageCriteria: AverageCriteriaDto;
}

export class UserRatingStatsDto {
  @ApiProperty({
    description: 'Número de calificaciones dadas por el usuario',
    example: 15,
  })
  givenRatings: number;

  @ApiProperty({
    description: 'Número de calificaciones recibidas por el usuario',
    example: 8,
  })
  receivedRatings: number;

  @ApiProperty({
    description: 'Calificación promedio de las calificaciones dadas',
    example: 4.2,
  })
  averageGivenRating: number;

  @ApiProperty({
    description: 'Calificación promedio de las calificaciones recibidas',
    example: 4.5,
  })
  averageReceivedRating: number;
}

export class TopRatedProfessionalDto {
  @ApiProperty({
    description: 'ID del profesional',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  professionalId: string;

  @ApiProperty({
    description: 'Calificación promedio del profesional',
    example: 4.8,
  })
  averageRating: number;

  @ApiProperty({
    description: 'Número total de calificaciones del profesional',
    example: 45,
  })
  totalRatings: number;
}
