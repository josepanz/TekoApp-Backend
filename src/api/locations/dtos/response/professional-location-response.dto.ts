import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProfessionalLocationResponseDTO {
  @ApiProperty({
    description: 'Latitud geográfica registrada',
    example: -25.2637,
  })
  latitude!: number;

  @ApiProperty({
    description: 'Longitud geográfica registrada',
    example: -57.5759,
  })
  longitude!: number;

  @ApiPropertyOptional({
    description: 'Última estampa de tiempo en la que mutó la coordenada',
    example: '2026-06-07T22:15:30.000Z',
  })
  lastUpdate?: Date | null;
}
