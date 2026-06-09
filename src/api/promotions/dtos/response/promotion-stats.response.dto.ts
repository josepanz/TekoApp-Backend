import { ApiProperty } from '@nestjs/swagger';

export class PromotionStatsResponseDTO {
  @ApiProperty({ example: 25, description: 'Total de promociones registradas' })
  totalPromotions!: number;

  @ApiProperty({
    example: 8,
    description: 'Promociones actualmente activas y vigentes',
  })
  activePromotions!: number;

  @ApiProperty({ example: 342, description: 'Total de usos de promociones' })
  totalUsage!: number;

  @ApiProperty({
    example: 5750000,
    description: 'Suma total de descuentos otorgados',
  })
  totalDiscount!: number;
}
