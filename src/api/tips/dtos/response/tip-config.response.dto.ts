import { ApiProperty } from '@nestjs/swagger';

export class TipConfigResponseDTO {
  @ApiProperty({ example: true })
  isEnabled!: boolean;

  @ApiProperty({
    example: false,
    description:
      'Informativo — el frontend debe mostrar el paso de propina como no salteable cuando es ' +
      'true. El backend no bloquea la creación del pago si el cliente no deja propina (ver ' +
      'decisions.md).',
  })
  isMandatory!: boolean;

  @ApiProperty({ type: [Number], example: [10, 15, 20] })
  suggestedPercentages!: number[];

  @ApiProperty({ example: true })
  allowFreeAmount!: boolean;
}
