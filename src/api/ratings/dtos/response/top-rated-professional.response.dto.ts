import { ApiProperty } from '@nestjs/swagger';

export class TopRatedProfessionalResponseDTO {
  @ApiProperty({
    description: 'ID del profesional',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  professionalId!: string;

  @ApiProperty({
    description: 'Calificación promedio del profesional',
    example: 4.8,
  })
  averageRating!: number;

  @ApiProperty({
    description: 'Número total de calificaciones del profesional',
    example: 45,
  })
  totalRatings!: number;
}
