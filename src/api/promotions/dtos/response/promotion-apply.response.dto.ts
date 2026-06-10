import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PromotionDetailResponseDTO } from './promotion-detail.response.dto';

export class PromotionApplyResponseDTO {
  @ApiProperty({
    example: true,
    description: 'Indica si la promoción fue aplicada correctamente',
  })
  success!: boolean;

  @ApiProperty({ example: 30000, description: 'Monto de descuento aplicado' })
  discountAmount!: number;

  @ApiProperty({
    example: 120000,
    description: 'Monto final después del descuento',
  })
  finalAmount!: number;

  @ApiPropertyOptional({
    type: PromotionDetailResponseDTO,
    description: 'Detalle de la promoción aplicada',
  })
  promotion?: PromotionDetailResponseDTO;

  @ApiPropertyOptional({ example: 'Promoción aplicada. Descuento: 30000' })
  message?: string;
}
