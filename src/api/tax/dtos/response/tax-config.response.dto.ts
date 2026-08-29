import { ApiProperty } from '@nestjs/swagger';

export class TaxConfigResponseDTO {
  @ApiProperty({
    example: false,
    description:
      'Placeholder técnico hasta contar con asesoría fiscal real por país — false por default ' +
      '(ver openspec/decisions.md, backlog post-Fase 0004 punto 5).',
  })
  isEnabled!: boolean;

  @ApiProperty({
    example: 'Sin configurar',
    description: 'Nombre descriptivo del impuesto (ej. "IVA Paraguay").',
  })
  name!: string;

  @ApiProperty({
    example: 0,
    description:
      'Tasa expresada como fracción (0.10 = 10%), no porcentaje entero.',
  })
  rate!: number;
}
