import { IsNumber, IsString, IsOptional, IsEnum, IsUUID, Min, Max, IsBoolean, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaymentMethod, PaymentProvider } from '../entities/payment.entity';

class PaymentDetailsDto {
  @ApiProperty({
    description: 'Últimos 4 dígitos de la tarjeta',
    example: '1234',
    required: false,
  })
  @IsOptional()
  @IsString()
  cardLast4?: string;

  @ApiProperty({
    description: 'Marca de la tarjeta',
    example: 'visa',
    required: false,
  })
  @IsOptional()
  @IsString()
  cardBrand?: string;

  @ApiProperty({
    description: 'Mes de expiración de la tarjeta',
    example: 12,
    minimum: 1,
    maximum: 12,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  cardExpMonth?: number;

  @ApiProperty({
    description: 'Año de expiración de la tarjeta',
    example: 2025,
    minimum: 2024,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(2024)
  cardExpYear?: number;

  @ApiProperty({
    description: 'Nombre del titular de la tarjeta',
    example: 'Juan Pérez',
    required: false,
  })
  @IsOptional()
  @IsString()
  cardholderName?: string;

  @ApiProperty({
    description: 'Nombre del banco',
    example: 'Banco Santander',
    required: false,
  })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiProperty({
    description: 'Tipo de cuenta bancaria',
    example: 'checking',
    required: false,
  })
  @IsOptional()
  @IsString()
  accountType?: string;

  @ApiProperty({
    description: 'Últimos 4 dígitos de la cuenta bancaria',
    example: '5678',
    required: false,
  })
  @IsOptional()
  @IsString()
  accountLast4?: string;

  @ApiProperty({
    description: 'Número de ruta bancaria',
    example: '123456789',
    required: false,
  })
  @IsOptional()
  @IsString()
  routingNumber?: string;

  @ApiProperty({
    description: 'Tipo de wallet digital',
    example: 'paypal',
    required: false,
  })
  @IsOptional()
  @IsString()
  walletType?: string;

  @ApiProperty({
    description: 'Email del wallet digital',
    example: 'usuario@paypal.com',
    required: false,
  })
  @IsOptional()
  @IsString()
  walletEmail?: string;

  @ApiProperty({
    description: 'Dirección de crypto',
    example: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    required: false,
  })
  @IsOptional()
  @IsString()
  cryptoAddress?: string;

  @ApiProperty({
    description: 'Red de crypto',
    example: 'ethereum',
    required: false,
  })
  @IsOptional()
  @IsString()
  cryptoNetwork?: string;
}

export class CreatePaymentDto {
  @ApiProperty({
    description: 'ID del profesional que recibirá el pago',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  professionalId: string;

  @ApiProperty({
    description: 'ID de la solicitud de servicio',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  serviceRequestId: string;

  @ApiProperty({
    description: 'Monto del pago (sin comisiones ni impuestos)',
    example: 100.00,
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({
    description: 'Método de pago',
    enum: PaymentMethod,
    example: PaymentMethod.CREDIT_CARD,
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({
    description: 'Proveedor de pagos',
    enum: PaymentProvider,
    example: PaymentProvider.STRIPE,
  })
  @IsEnum(PaymentProvider)
  paymentProvider: PaymentProvider;

  @ApiProperty({
    description: 'ID del método de pago guardado (opcional)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  paymentMethodId?: string;

  @ApiProperty({
    description: 'Descripción del pago',
    example: 'Pago por servicio de plomería - Reparación de caño',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Detalles del método de pago',
    type: PaymentDetailsDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentDetailsDto)
  paymentDetails?: PaymentDetailsDto;

  @ApiProperty({
    description: 'Si es un pago recurrente',
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiProperty({
    description: 'Intervalo de recurrencia (monthly, weekly, etc.)',
    example: 'monthly',
    required: false,
  })
  @IsOptional()
  @IsString()
  recurringInterval?: string;

  @ApiProperty({
    description: 'Metadatos adicionales',
    example: { platform: 'mobile', appVersion: '1.2.0' },
    required: false,
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
