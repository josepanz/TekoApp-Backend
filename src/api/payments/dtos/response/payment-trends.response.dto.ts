import { ApiProperty } from '@nestjs/swagger';

export class PaymentTrendItemResponseDTO {
  @ApiProperty({ example: '2024-01-15' })
  date!: string;

  @ApiProperty({ example: 12 })
  count!: number;

  @ApiProperty({ example: 1560000 })
  amount!: number;
}

export class PaymentTrendsResponseDTO {
  @ApiProperty({ type: [PaymentTrendItemResponseDTO] })
  trends!: PaymentTrendItemResponseDTO[];

  @ApiProperty({ example: 30, description: 'Días consultados' })
  days!: number;
}
