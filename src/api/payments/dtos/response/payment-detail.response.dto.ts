import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus, PaymentMethod, PaymentProvider } from '@prisma/client';

export class PaymentDetailResponseDTO {
  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  id!: string;

  @ApiProperty({ example: 1 })
  userId!: number;

  @ApiProperty({ example: 5 })
  professionalId!: number;

  @ApiProperty({
    example: 'a63b5212-db5e-4ef5-9614-726614174000',
    description: 'ID (UUID público) del servicio pagado',
  })
  serviceId!: string;

  @ApiProperty({ example: 150000 })
  amount!: number;

  @ApiProperty({ example: 'PYG' })
  currencyCode!: string;

  @ApiProperty({ example: 4350 })
  fee!: number;

  @ApiProperty({ example: 32262 })
  tax!: number;

  @ApiProperty({ example: 186612 })
  totalAmount!: number;

  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.PENDING })
  status!: PaymentStatus;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CREDIT_CARD })
  paymentMethod!: PaymentMethod;

  @ApiProperty({ enum: PaymentProvider, example: PaymentProvider.STRIPE })
  paymentProvider!: PaymentProvider;

  @ApiProperty({ example: 'txn-uuid-abc' })
  transactionId!: string;

  @ApiPropertyOptional({ example: 'pi_stripe_123' })
  externalTransactionId?: string | null;

  @ApiPropertyOptional({ example: 'Servicio de plomería' })
  description?: string | null;

  @ApiPropertyOptional()
  paymentDetails?: Record<string, unknown> | null;

  @ApiPropertyOptional()
  metadata?: Record<string, unknown> | null;

  @ApiPropertyOptional()
  processedAt?: Date | null;

  @ApiPropertyOptional()
  failedAt?: Date | null;

  @ApiPropertyOptional()
  paidAt?: Date | null;

  @ApiPropertyOptional()
  failureReason?: string | null;

  @ApiPropertyOptional()
  refundDetails?: Record<string, unknown> | null;

  @ApiProperty({ example: 0 })
  platformFee!: number;

  @ApiPropertyOptional({ example: 150000 })
  professionalNetAmount?: number | null;

  @ApiProperty({ example: false })
  isRecurring!: boolean;

  @ApiPropertyOptional()
  recurringInterval?: string | null;

  @ApiPropertyOptional()
  nextPaymentDate?: Date | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiPropertyOptional()
  lastChangedAt?: Date | null;
}
