import { ApiProperty } from '@nestjs/swagger';

export class NearbyProfessionalResponseDTO {
  @ApiProperty({
    description: 'ID interno — solo para ordenamiento',
    example: 5,
  })
  id!: number;

  @ApiProperty({
    description: 'UUID público del profesional',
    example: 'e2c1a6b0-4c2f-4b7a-9c1d-3f6a9b2e7d10',
  })
  referenceId!: string;

  @ApiProperty({ description: 'ID de categoría del profesional', example: 3 })
  categoryId!: number;

  @ApiProperty({
    description: 'Descripción del profesional',
    example: 'Plomero',
  })
  description!: string;

  @ApiProperty({ description: 'Tarifa por hora', example: 50000 })
  hourlyRate!: number;

  @ApiProperty({ description: 'Latitud actual', example: -25.2637 })
  latitude!: number;

  @ApiProperty({ description: 'Longitud actual', example: -57.5759 })
  longitude!: number;

  @ApiProperty({
    description: 'Distancia al punto de búsqueda en km',
    example: 2.34,
  })
  distanceKm!: number;

  @ApiProperty({
    description: 'Disponible para tomar servicios',
    example: true,
  })
  isAvailable!: boolean;

  @ApiProperty({ description: 'Conectado en tiempo real', example: true })
  isOnline!: boolean;

  @ApiProperty({ description: 'Calificación promedio', example: 4.5 })
  averageRating!: number;
}
