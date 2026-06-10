import { ApiProperty } from '@nestjs/swagger';

export class PaymentMethodStatsDto {
  @ApiProperty({ description: 'Tipo de método de pago' })
  method: string;

  @ApiProperty({ description: 'Número total de pagos con este método' })
  totalPayments: number;

  @ApiProperty({ description: 'Monto total procesado con este método' })
  totalAmount: number;

  @ApiProperty({ description: 'Porcentaje de uso de este método' })
  percentage: number;
}

export class PaymentProviderStatsDto {
  @ApiProperty({ description: 'Nombre del proveedor de pagos' })
  provider: string;

  @ApiProperty({ description: 'Número total de transacciones' })
  totalTransactions: number;

  @ApiProperty({ description: 'Número de transacciones exitosas' })
  successfulTransactions: number;

  @ApiProperty({ description: 'Número de transacciones fallidas' })
  failedTransactions: number;

  @ApiProperty({ description: 'Tasa de éxito en porcentaje' })
  successRate: number;

  @ApiProperty({ description: 'Monto total procesado' })
  totalAmount: number;
}

export class PaymentStatusStatsDto {
  @ApiProperty({ description: 'Estado del pago' })
  status: string;

  @ApiProperty({ description: 'Número de pagos en este estado' })
  count: number;

  @ApiProperty({ description: 'Porcentaje del total' })
  percentage: number;
}

export class PaymentTrendsDto {
  @ApiProperty({ description: 'Fecha del período' })
  date: string;

  @ApiProperty({ description: 'Número total de pagos' })
  totalPayments: number;

  @ApiProperty({ description: 'Monto total procesado' })
  totalAmount: number;

  @ApiProperty({ description: 'Número de pagos exitosos' })
  successfulPayments: number;

  @ApiProperty({ description: 'Número de pagos fallidos' })
  failedPayments: number;
}

export class PaymentSummaryDto {
  @ApiProperty({ description: 'Número total de pagos' })
  totalPayments: number;

  @ApiProperty({ description: 'Monto total procesado' })
  totalAmount: number;

  @ApiProperty({ description: 'Número de pagos exitosos' })
  successfulPayments: number;

  @ApiProperty({ description: 'Número de pagos fallidos' })
  failedPayments: number;

  @ApiProperty({ description: 'Tasa de éxito en porcentaje' })
  successRate: number;

  @ApiProperty({ description: 'Promedio de monto por pago' })
  averageAmount: number;

  @ApiProperty({ description: 'Monto total de comisiones' })
  totalFees: number;

  @ApiProperty({ description: 'Monto total de impuestos' })
  totalTaxes: number;
}

export class ProfessionalPaymentStatsDto {
  @ApiProperty({ description: 'ID del profesional' })
  professionalId: string;

  @ApiProperty({ description: 'Nombre del profesional' })
  professionalName: string;

  @ApiProperty({ description: 'Número total de pagos recibidos' })
  totalPayments: number;

  @ApiProperty({ description: 'Monto total recibido' })
  totalAmount: number;

  @ApiProperty({ description: 'Promedio de monto por pago' })
  averageAmount: number;

  @ApiProperty({ description: 'Número de pagos este mes' })
  monthlyPayments: number;

  @ApiProperty({ description: 'Monto recibido este mes' })
  monthlyAmount: number;
}

export class UserPaymentStatsDto {
  @ApiProperty({ description: 'ID del usuario' })
  userId: string;

  @ApiProperty({ description: 'Nombre del usuario' })
  userName: string;

  @ApiProperty({ description: 'Número total de pagos realizados' })
  totalPayments: number;

  @ApiProperty({ description: 'Monto total gastado' })
  totalSpent: number;

  @ApiProperty({ description: 'Promedio de monto por pago' })
  averageAmount: number;

  @ApiProperty({ description: 'Número de pagos este mes' })
  monthlyPayments: number;

  @ApiProperty({ description: 'Monto gastado este mes' })
  monthlySpent: number;
}
