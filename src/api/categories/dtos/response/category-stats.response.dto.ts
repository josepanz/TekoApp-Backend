import { ApiProperty } from '@nestjs/swagger';

export class CategoryStatsResponseDTO {
  @ApiProperty({
    description: 'Número de profesionales asociados a la categoría',
    example: 42,
  })
  professionalCount!: number;

  @ApiProperty({
    description: 'Número de servicios vinculados a la categoría',
    example: 15,
  })
  serviceCount!: number;

  @ApiProperty({
    description: 'Calificación promedio de los profesionales de la categoría',
    example: 4.75,
  })
  averageRating!: number;

  @ApiProperty({
    description: 'Total de servicios (alias de serviceCount)',
    example: 15,
  })
  totalServices!: number;
}
