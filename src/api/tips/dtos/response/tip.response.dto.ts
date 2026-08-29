import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipMode } from '@prisma/client';

export class TipResponseDTO {
  @ApiProperty({ example: 'a63b5212-db5e-4ef5-9614-726614174000' })
  referenceId!: string;

  @ApiProperty({ enum: TipMode, example: TipMode.PERCENTAGE })
  mode!: TipMode;

  @ApiPropertyOptional({
    example: 10,
    description: 'Solo poblado cuando mode=PERCENTAGE.',
    nullable: true,
  })
  percentage!: number | null;

  @ApiProperty({
    example: 15000,
    description:
      'Monto final de la propina — 100% para el profesional, nunca entra en el ' +
      'cálculo de comisión de la plataforma.',
  })
  amount!: number;

  @ApiProperty({ example: 'PYG' })
  currencyCode!: string;

  @ApiProperty()
  createdAt!: Date;
}
