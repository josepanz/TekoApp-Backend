import { ApiProperty } from '@nestjs/swagger';

export class PaymentSummaryResponseDTO {
  @ApiProperty({ example: 120 })
  totalPayments!: number;

  @ApiProperty({ example: 98 })
  successfulPayments!: number;

  @ApiProperty({ example: 10 })
  failedPayments!: number;

  @ApiProperty({ example: 12 })
  pendingPayments!: number;

  @ApiProperty({ example: 15600000 })
  totalAmount!: number;

  @ApiProperty({ example: 81.67, description: 'Tasa de éxito en porcentaje' })
  successRate!: number;

  @ApiProperty({ example: 130000, description: 'Monto promedio por pago' })
  averageAmount!: number;
}
