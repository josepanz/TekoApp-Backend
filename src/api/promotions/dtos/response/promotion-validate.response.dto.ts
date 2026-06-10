import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PromotionDetailResponseDTO } from './promotion-detail.response.dto';

export class PromotionValidateResponseDTO {
  @ApiProperty({
    example: true,
    description: 'Indica si la promoción es válida y aplicable',
  })
  isValid!: boolean;

  @ApiProperty({ example: 30000, description: 'Monto de descuento calculado' })
  discountAmount!: number;

  @ApiPropertyOptional({
    type: PromotionDetailResponseDTO,
    description: 'Detalle de la promoción (solo si isValid=true)',
  })
  promotion?: PromotionDetailResponseDTO;

  @ApiPropertyOptional({ example: 'La promoción no está activa o ha expirado' })
  message?: string;
}
