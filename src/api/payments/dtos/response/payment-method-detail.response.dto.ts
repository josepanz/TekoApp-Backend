import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, PaymentProvider } from '@prisma/client';

export class PaymentMethodDetailResponseDTO {
  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  id!: string;

  @ApiProperty({ example: 1 })
  userId!: number;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CREDIT_CARD })
  type!: PaymentMethod;

  @ApiProperty({ enum: PaymentProvider, example: PaymentProvider.STRIPE })
  provider!: PaymentProvider;

  @ApiProperty({ example: 'Visa terminada en 4242' })
  name!: string;

  @ApiProperty({ example: true })
  isDefault!: boolean;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: { last4: '4242', brand: 'visa' } })
  details!: Record<string, unknown>;

  @ApiPropertyOptional({ example: 'pm_stripe_xyz' })
  externalId?: string | null;

  @ApiPropertyOptional()
  metadata?: Record<string, unknown> | null;

  @ApiPropertyOptional()
  lastUsedAt?: Date | null;

  @ApiPropertyOptional()
  expiresAt?: Date | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
