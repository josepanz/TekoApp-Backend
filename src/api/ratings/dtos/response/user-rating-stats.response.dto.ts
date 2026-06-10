import { ApiProperty } from '@nestjs/swagger';

export class UserRatingStatsResponseDTO {
  @ApiProperty({
    description: 'Número de calificaciones dadas por el usuario',
    example: 15,
  })
  givenRatings!: number;

  @ApiProperty({
    description: 'Número de calificaciones recibidas por el usuario',
    example: 8,
  })
  receivedRatings!: number;

  @ApiProperty({
    description: 'Calificación promedio de las calificaciones dadas',
    example: 4.2,
  })
  averageGivenRating!: number;

  @ApiProperty({
    description: 'Calificación promedio de las calificaciones recibidas',
    example: 4.5,
  })
  averageReceivedRating!: number;
}
