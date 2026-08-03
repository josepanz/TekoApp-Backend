import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CurrencyResponseDTO {
  @ApiProperty({ description: 'Código alfabético ISO 4217', example: 'PYG' })
  alphaCode!: string;

  @ApiProperty({ description: 'Código numérico ISO 4217', example: '600' })
  numberCode!: string;

  @ApiProperty({
    description: 'Cantidad de decimales (0 para el Guaraní)',
    example: 0,
  })
  decimalQuantity!: number;

  @ApiProperty({
    description: 'Nombre de la moneda',
    example: 'Guaraní paraguayo',
  })
  name!: string;

  @ApiPropertyOptional({
    description: 'Símbolo de la moneda',
    example: '₲',
    nullable: true,
  })
  symbol!: string | null;

  @ApiProperty({ description: 'ID del país emisor', example: 1 })
  countryId!: number;

  @ApiProperty({
    description: 'Indica si la moneda está activa',
    example: true,
  })
  isActive!: boolean;
}
