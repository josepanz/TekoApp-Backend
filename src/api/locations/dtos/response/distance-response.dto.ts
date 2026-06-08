import { ApiProperty } from '@nestjs/swagger';

export class DistanceResponseDTO {
  @ApiProperty({
    description: 'Métrica escalar lineal resultante calculada',
    example: 4.85,
  })
  distance!: number;

  @ApiProperty({
    description: 'Unidad de medida estándar de la respuesta',
    example: 'km',
  })
  unit!: string;
}
