import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PromotionStatus, PromotionType } from '@prisma/client';

export class PromotionDetailResponseDTO {
  @ApiProperty({ example: 'a63b5212-db5e-4ef5-9614-726614174000' })
  id!: string;

  @ApiProperty({ example: 'PROMO2025' })
  code!: string;

  @ApiProperty({ example: 'Descuento de verano' })
  name!: string;

  @ApiPropertyOptional({ example: '20% de descuento en todos los servicios' })
  description?: string | null;

  @ApiProperty({ enum: PromotionType, example: PromotionType.PERCENTAGE })
  type!: PromotionType;

  @ApiProperty({ enum: PromotionStatus, example: PromotionStatus.ACTIVE })
  status!: PromotionStatus;

  @ApiPropertyOptional({
    example: 20.0,
    description: 'Porcentaje de descuento (tipo PERCENTAGE)',
  })
  discountPercentage?: number | null;

  @ApiPropertyOptional({
    example: 50000,
    description: 'Monto fijo de descuento (tipo FIXED_AMOUNT)',
  })
  discountAmount?: number | null;

  @ApiPropertyOptional({ example: 30000 })
  minimumAmount?: number | null;

  @ApiPropertyOptional({ example: 100000 })
  maximumDiscount?: number | null;

  @ApiProperty({ example: 100, description: '-1 = ilimitado' })
  maxUsage!: number;

  @ApiProperty({ example: 1 })
  maxUsagePerUser!: number;

  @ApiProperty({ example: 42 })
  currentUsage!: number;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  validFrom!: Date;

  @ApiProperty({ example: '2025-12-31T23:59:59.000Z' })
  validUntil!: Date;

  @ApiProperty({
    example: ['cliente', 'profesional'],
    isArray: true,
    type: String,
  })
  allowedUserTypes!: string[];

  @ApiProperty({ example: [1, 2, 3], isArray: true, type: Number })
  specificUserIds!: number[];

  @ApiPropertyOptional({ example: 5 })
  createdById?: number | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiPropertyOptional()
  lastChangedAt?: Date | null;
}
